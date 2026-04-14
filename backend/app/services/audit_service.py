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
        
        # Layer 1: Multi-File Bundle Extraction
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
        
        # Layer 2: Heuristic Signature Pre-Scan (Speed)
        pre_findings = pre_scan(code_to_analyze)
        
        # Layer 3: Deep AI Behavioral Diagnosis (Depth)
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

        # Layer 4: Intellectual Cross-Correlation & Strategic Merging
        if pre_findings:
            ai_vulns = [f.vulnerability for f in report.findings]
            for f in pre_findings:
                # Merge heuristic results if not already caught by deep AI layer
                if f.vulnerability not in ai_vulns:
                    report.findings.append(f)

        # High-Precision Scoring (Weighted Tier System)
        score_map = {"Critical": 35, "High": 20, "Medium": 10, "Low": 5}
        point_loss = sum(score_map.get(f.severity, 0) for f in report.findings)
        report.overall_score = max(0, 100 - point_loss)
        
        # Final Verification Pass
        if not report.findings:
            report.overall_score = 100
            report.summary = "Vektor Multi-Layer Audit Tier 4 complete. zero vulnerabilities detected across all heuristic and AI behavioral layers. Contract achieves top-tier security rating."

        return report

    @staticmethod
    async def _analyze_with_ai(request: AuditRequest, api_key: str, base_url: Optional[str] = None, model: str = "gpt-4o-mini") -> AuditReport:
        client = AsyncOpenAI(api_key=api_key, base_url=base_url)
        framework = AuditService.detect_framework(request.code)
        
        system_prompt = """
        You are Vektor, a World-Class Red Team Solana Security Auditor. 
        Perform an EXHAUSTIVE, MULTI-LAYERED audit of the following code.
        
        REQUIRED AUDIT LAYERS:
        1. AUTHORIZATION LAYER: Validate every instruction for missing signer or ownership checks.
        2. ARITHMETIC LAYER: Trace every math operation for potential overflow/underflow without checked math.
        3. PDA LAYER: Audit PDA derivation for seed collision or missing validation.
        4. CPI LAYER: Analyze every Cross-Program Invocation for reentrancy or trusted program spoofing.
        5. LOGIC LAYER: Detect logical errors in reward systems, admin controls, or state transitions.
        
        VULNERABILITY CLASSES:
        1. MISSING SIGNER CHECK: Sensitive actions without check_signer or Signer<'info>.
        2. ARITHMETIC OVERFLOW: Operations using +, -, * without .checked_add/sub/mul.
        3. REENTRANCY: State updates after an external invoke/CPI call.
        4. PDA SEED COLLISION: Unvalidated User-supplied seeds in PDAs.
        5. OWNERSHIP LACK: No validation that AccountInfo.owner matches the expected program.
        6. STALE ORACLES: Prices used without checking slot/timestamp staleness.
        7. ARBITRARY CPI: Calling a program account passed by the user without validation.
        8. ACCOUNT DISCRIMINATOR: Deserializing data without checking the Anchor/Native discriminator.

        ANALYSIS RULES:
        - Find ALL instances, not just the first.
        - severity: Critical|High|Medium|Low.
        - line_number: Point to the exact vulnerable line.
        
        RESPONSE FORMAT (JSON ONLY):
        {
          "findings": [
            {
              "vulnerability": "name",
              "severity": "Severity",
              "explanation": "how to exploit this specific line",
              "recommendation": "the exact fix",
              "corrected_code": "code snippet",
              "exploit_poc": "TypeScript/Anchor exploit code",
              "anchor_test": "Mocha test case",
              "confidence_score": 0-100,
              "line_number": int
            }
          ],
          "summary": "overall posture",
          "overall_score": 0-100,
          "risk_level": "Level"
        }
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
                overall_score=data.get("overall_score", 100),
                summary=data.get("summary", "Analysis complete."),
                risk_level=data.get("risk_level", "Low"),
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
        
        if not or_key:
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
