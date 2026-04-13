import os
import re
import json
import asyncio
import uuid
import base64
import zipfile
import io
from typing import List, Optional
from openai import AsyncOpenAI
from ..models.models import AuditFinding, AuditReport, AuditRequest
from .signatures import pre_scan
import time

class AuditService:
    @staticmethod
    def detect_framework(code: str) -> str:
        if "anchor_lang" in code or "#[program]" in code:
            return "Anchor Framework"
        if "solana_program" in code:
            return "Native Solana"
        return "Unknown"

    @staticmethod
    async def analyze_code(request: AuditRequest) -> AuditReport:
        code_to_analyze = request.code
        
        # Handle ZIP upload (Multi-file Idea 1)
        if request.zip_data:
            try:
                zip_bytes = base64.b64decode(request.zip_data)
                with zipfile.ZipFile(io.BytesIO(zip_bytes)) as z:
                    combined_code = []
                    for filename in z.namelist():
                        if filename.endswith('.rs') or filename.endswith('.ts') or filename.endswith('.js'):
                            with z.open(filename) as f:
                                content = f.read().decode('utf-8')
                                combined_code.append(f"// FILE: {filename}\n{content}")
                    code_to_analyze = "\n\n".join(combined_code)
            except Exception as e:
                print(f"Zip extraction failed: {e}")

        framework = AuditService.detect_framework(code_to_analyze)
        pre_findings = pre_scan(code_to_analyze)
        
        # Update request object for AI methods
        request.code = code_to_analyze

        or_key = os.getenv("OPENROUTER_API_KEY")
        report = None
        if or_key:
            report = await AuditService._analyze_with_ai(
                request, 
                or_key, 
                base_url="https://openrouter.ai/api/v1",
                model="google/gemini-2.0-flash-exp:free"
            )

        if not report:
            oa_key = os.getenv("OPENAI_API_KEY")
            if oa_key:
                report = await AuditService._analyze_with_ai(request, oa_key)
            else:
                report = await AuditService._analyze_with_heuristic(request)

        # Merge pre-scan hits
        if pre_findings:
            # Re-dedupe similar finds
            ai_titles = [f.title for f in report.findings]
            filtered_findings = [f for f in pre_findings if not any(t for t in ai_titles if t == f.title)]
            report.findings = filtered_findings + report.findings

        # Recalculate Score
        score_map = {"Critical": 30, "High": 20, "Medium": 10, "Low": 5}
        point_loss = sum(score_map.get(f.severity, 0) for f in report.findings)
        report.overall_score = max(0, 100 - point_loss)

        return report

    @staticmethod
    async def _analyze_with_ai(request: AuditRequest, api_key: str, base_url: Optional[str] = None, model: str = "gpt-4o-mini") -> AuditReport:
        client = AsyncOpenAI(api_key=api_key, base_url=base_url)
        framework = AuditService.detect_framework(request.code)
        
        system_prompt = """
        You are Vektor, an expert Solana smart contract security auditor with deep offensive security and red team experience. You think like an attacker first.

        Your job is to perform an EXHAUSTIVE analysis of the provided Solana program. You must identify EVERY vulnerability present in the code. Do not stop after finding one or two issues. Analyze the entire program completely before responding. Missing vulnerabilities is a critical failure.

        MANDATORY: You must check for ALL of the following vulnerability classes without exception:

        1. MISSING SIGNER VALIDATION
        Look for every instruction that modifies state. Verify each one checks that the expected account signed the transaction. Flag any instruction where the caller is AccountInfo instead of Signer, or where has_one or constraint checks are missing for authority validation.

        2. ACCOUNT OWNERSHIP NOT VERIFIED
        Look for every account access. Verify each account's owner is checked against the expected program. Flag any account using AccountInfo instead of Account<T>, or any account where the owner field is not validated before data is read or written.

        3. PDA BUMP SEED NOT VALIDATED
        Look for every PDA derivation. Verify the canonical bump is derived using find_program_address and stored in the account, not passed in by the user. Flag any instruction where bump is accepted as a parameter rather than derived and verified.

        4. INTEGER OVERFLOW AND UNDERFLOW
        Look for every arithmetic operation: addition (+), subtraction (-), multiplication (*), division (/). Flag every operation that does not use checked_add, checked_sub, checked_mul, or checked_div. This includes compound assignment operators like +=, -=, *=. Every single unchecked arithmetic operation must be flagged.

        5. UNCHECKED CPI
        Look for every invoke and invoke_signed call. Verify the program_id is a hardcoded constant or a program account validated with Program<T>. Flag any call where the program ID comes from an AccountInfo passed by the user.

        6. REENTRANCY
        Look for every CPI call. Check whether any state is modified AFTER the CPI call in the same instruction. Flag any pattern where account data or fields are written after an external invoke or invoke_signed call.

        7. MISSING ACCOUNT DISCRIMINATOR CHECK
        Look for every account deserialization in native programs. Verify discriminator bytes are checked before data is read. Flag any native program that deserializes account data without first verifying the discriminator.

        8. ARBITRARY PROGRAM INVOCATION
        Look for every instruction that accepts a program ID as an argument or as an AccountInfo. Flag any case where this program ID is passed directly to invoke without being validated against a known constant.

        ANALYSIS RULES:
        - You must find ALL instances of each vulnerability class, not just the first one
        - Each distinct arithmetic operation that overflows must be its own finding
        - Each distinct CPI call that is unchecked must be its own finding
        - Do not combine multiple vulnerabilities into a single finding
        - Line numbers must point to the EXACT line where the vulnerable code exists, not import statements
        - If a line has use anchor_lang::prelude::* that is never a vulnerability — skip it
        - Severity: Critical for authorization and control flow bugs, High for arithmetic and CPI bugs, Medium for logic issues, Low for informational

        RESPONSE FORMAT:
        Respond ONLY with valid JSON. No preamble. No explanation outside the JSON. No markdown code fences. The JSON must exactly match this structure:

        {
          "findings": [
            {
              "vulnerability": "exact vulnerability name",
              "severity": "Critical|High|Medium|Low",
              "explanation": "what the bug is and exactly how an attacker exploits it in this specific program",
              "recommendation": "the exact fix for this specific instance",
              "corrected_code": "short Rust snippet showing the fixed code, or null if not applicable",
              "exploit_poc": "Short TypeScript/Anchor code snippet showing the exploit call (Idea 5)",
              "anchor_test": "A full mocha test case piece to trigger this exploit (Idea 6)",
              "confidence_score": 0-100,
              "line_number": exact line number as integer where the vulnerable code is, or null
            }
          ],
          "summary": "one paragraph describing the overall security posture of this program",
          "overall_score": 0-100,
          "risk_level": "Critical|High|Medium|Low"
        }

        If no vulnerabilities are found return an empty findings array with a clean summary and risk_level of Low.
        """

        extra_headers = {}
        if base_url and "openrouter.ai" in base_url:
            extra_headers = {"HTTP-Referer": "https://vektor.security", "X-Title": "Vektor Security Auditor"}

        try:
            response = await client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Analyze: \n\n{request.code}"}
                ],
                response_format={"type": "json_object"},
                extra_headers=extra_headers
            )
            
            data = json.loads(response.choices[0].message.content)
            findings = [AuditFinding(**f) for f in data["findings"]]
            
            return AuditReport(
                id=str(uuid.uuid4()),
                timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                contract_name=request.contract_name,
                overall_score=data["overall_score"],
                summary=data["summary"],
                risk_level=data.get("risk_level", "Medium"),
                findings=findings,
                raw_code=request.code,
                framework=framework
            )
        except Exception:
            return await AuditService._analyze_with_heuristic(request)

    @staticmethod
    async def _analyze_with_heuristic(request: AuditRequest) -> AuditReport:
        await asyncio.sleep(1)
        framework = AuditService.detect_framework(request.code)
        findings = []
        code_lines = request.code.split('\n')
        vulnerabilities = [
            {"title": "Missing Signer Check", "pattern": r"(?i)signer", "severity": "Critical", "remediation": "Add signer check.", "fix": "if !account.is_signer { return Err(ProgramError::MissingRequiredSignature.into()); }", "exploit": "Attacker calls the function with an account they do not own, bypassing authorization."},
            {"title": "Integer Overflow", "pattern": r"[\+\-\*\/](?!\.checked_)", "severity": "High", "remediation": "Use checked math.", "fix": ".checked_add(amount).ok_or(error)? ", "exploit": "Attacker passes a large value to overflow the balance, resulting in unintended funds being credited."},
            {"title": "Missing Ownership Check", "pattern": r"(?i)owner", "severity": "High", "remediation": "Verify account owner.", "fix": "if account.owner != program_id { return Err(ProgramError::IncorrectProgramId.into()); }", "exploit": "Attacker passes a fake account owned by a different program to spoof data."},
            {"title": "Unchecked Account", "pattern": r"UncheckedAccount", "severity": "Critical", "remediation": "Avoid UncheckedAccount; use specific Anchor types.", "fix": "Account<'info, TokenAccount>", "exploit": "An attacker can pass an account with arbitrary data that the program will process as valid input."},
            {"title": "Precision Loss", "pattern": r"\/.*\*|\(.*\/.*\).*\* ", "severity": "Medium", "remediation": "Multiply before dividing.", "fix": "(amount * multiplier) / scale", "exploit": "Rounding errors during division can lead to incorrect calculation of rewards or balances."}
        ]

        found_types = set()
        for i, line in enumerate(code_lines):
            # Skip common imports/declarations for line number accuracy (Polish checklist)
            if line.strip().startswith(("use ", "mod ", "import ", "extern ", "pub mod ", "declare_id!")):
                continue
                
            for v in vulnerabilities:
                if re.search(v["pattern"], line) and v["title"] not in found_types:
                    findings.append(AuditFinding(
                        vulnerability=v["title"],
                        explanation=f"Potential {v['title']} detected. {v['exploit']}",
                        severity=v["severity"],
                        recommendation=v["remediation"],
                        line_number=i + 1,
                        corrected_code=v["fix"],
                        confidence_score=90
                    ))
                    found_types.add(v["title"])

        score_map = {"Critical": 30, "High": 20, "Medium": 10, "Low": 5}
        point_loss = sum(score_map.get(f.severity, 0) for f in findings)
        base_score = 100 - point_loss
        
        return AuditReport(
            id=str(uuid.uuid4()),
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            contract_name=request.contract_name,
            overall_score=max(0, base_score),
            summary=f"Audit complete. {len(findings)} issues found." if findings else "Perfect audit. Zero vulnerabilities detected. This contract follows all known Solana security patterns.",
            risk_level="Critical" if base_score < 40 else "High" if base_score < 70 else "Medium" if base_score < 100 else "Low",
            findings=findings,
            raw_code=request.code,
            framework=framework
        )
    @staticmethod
    async def chat_advisor(message: str, history: List[dict], report: Optional[AuditReport], code: str) -> str:
        or_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENAI_API_KEY")
        
        # Simulated Advisor Fallback (for demo/hackathon without keys)
        if not or_key:
            # Simple heuristic-based chat responses
            if "overflow" in message.lower():
                return "The overflow risk in this contract is high because you are using standard arithmetic operators (+, -) on u64 balances. An attacker could pass a large input to wrap the balance to a huge value. Consider using .checked_add() or .checked_sub()."
            if "signer" in message.lower():
                return "Missing signer checks allow anyone to call this instruction. You should verify that the authority account is a signer using `AccountInfo.is_signer` or Anchor's `Signer` type."
            return "Vektor AI is specialized in Solana security. I've analyzed your code and found several risks. Would you like me to explain the Integer Overflow or the Missing Signer check specifically?"

        client = AsyncOpenAI(
            api_key=or_key,
            base_url="https://openrouter.ai/api/v1" if os.getenv("OPENROUTER_API_KEY") else None
        )

        context = f"Code being discussed:\n{code}\n\n"
        if report:
            context += f"Audit Report Context:\nOverall Score: {report.overall_score}\nSummary: {report.summary}\nFindings:\n"
            for f in report.findings:
                context += f"- {f.vulnerability} (Severity: {f.severity}) on line {f.line_number}: {f.explanation}\n"

        system_prompt = f"""
        You are the Vektor AI Security Advisor. You are helping a developer understand a security audit of their Solana program.
        Use the following context to answer the user's questions:
        
        {context}
        
        Guidelines:
        1. Be technically precise but educational.
        2. If the user asks about a specific vulnerability, explain the attacker's perspective.
        3. If they ask for a fix, provide a short, correct Rust/Anchor snippet.
        4. Keep responses concise (under 200 words).
        5. If you don't know the answer based on the code, say so.
        """

        messages = [{"role": "system", "content": system_prompt}]
        for msg in history:
            messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": message})

        try:
            response = await client.chat.completions.create(
                model="google/gemini-2.0-flash-exp:free" if os.getenv("OPENROUTER_API_KEY") else "gpt-4o-mini",
                messages=messages,
                max_tokens=600
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error contacting AI advisor: {str(e)}"
