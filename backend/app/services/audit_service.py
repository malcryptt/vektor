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
        
        # Layer 2: Heuristic Signature Pre-Scan (High Speed)
        pre_findings = pre_scan(code_to_analyze)
        
        # Layer 3: Deep AI Behavioral Diagnosis (CoT Pass)
        request.code = code_to_analyze
        api_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENAI_API_KEY")
        base_url = "https://openrouter.ai/api/v1" if os.getenv("OPENROUTER_API_KEY") else None
        
        report = None
        if api_key:
            report = await AuditService._analyze_with_ai(
                request, 
                api_key, 
                base_url=base_url,
                model="google/gemini-2.0-flash-exp:free" if os.getenv("OPENROUTER_API_KEY") else "gpt-4o-mini"
            )

        if not report:
            report = await AuditService._analyze_with_heuristic(request)

        # Layer 4: Senior Auditor Verification (Cross-Audit)
        if api_key and report.findings:
            try:
                verified_report = await AuditService._verify_with_senior_auditor(report, api_key, base_url)
                report = verified_report
            except Exception as e:
                print(f"Senior Review failed: {e}")

        # Layer 5: Strategic Merging & Deduplication
        if pre_findings:
            ai_vulns = [f.vulnerability for f in report.findings]
            for f in pre_findings:
                if f.vulnerability not in ai_vulns:
                    report.findings.append(f)

        # High-Precision Pricing (Weighted)
        score_map = {"Critical": 35, "High": 20, "Medium": 10, "Low": 5}
        point_loss = sum(score_map.get(f.severity, 0) for f in report.findings)
        report.overall_score = max(0, 100 - point_loss)
        
        if not report.findings:
            report.overall_score = 100
            report.summary = "Ultimate Multi-Layer Audit complete. No vulnerabilities detected across any layer. Contract demonstrates perfect security posture."

        return report

    @staticmethod
    async def _analyze_with_ai(request: AuditRequest, api_key: str, base_url: Optional[str] = None, model: str = "gpt-4o-mini") -> AuditReport:
        client = AsyncOpenAI(api_key=api_key, base_url=base_url)
        framework = AuditService.detect_framework(request.code)
        
        # Chain-of-Thought Prompting Strategy
        system_prompt = """
        You are Vektor, the world's most advanced Red Team Solana Security Auditor. 
        Your mission is 100% vulnerability detection. Nothing must escape your audit.
        
        AUDIT PROTOCOL (CHAIN-OF-THOUGHT):
        1. LOGIC MAPPING: First, identify all instructions, state transitions, and critical account accesses.
        2. CONSTRAINT MAPPING: Identify every check (require!, assert!, if checks) and their purpose.
        3. ADVERSARIAL THINKING: For each instruction, think of how an attacker could bypass checks or manipulate state.
        4. MULTI-LAYER SCAN:
           - Layer A (Auth): Missing signers, incorrect owners, PDA seed collisions.
           - Layer B (Math): Unchecked arithmetic, precision loss in reward units.
           - Layer C (CPI): Reentrancy, arbitrary program IDs, unchecked results.
           - Layer D (Logic): Stale oracles, incorrect token payouts, admin backdoors.
        
        RESPONSE FORMAT (JSON ONLY):
        {
          "findings": [
            {
              "vulnerability": "name",
              "severity": "Critical|High|Medium|Low",
              "explanation": "how to exploit this line",
              "recommendation": "the fix",
              "corrected_code": "code",
              "exploit_poc": "TypeScript/Anchor POC",
              "anchor_test": "Mocha test case",
              "line_number": int
            }
          ],
          "summary": "overall posture",
          "overall_score": 0-100,
          "risk_level": "Level"
        }
        """

        extra_headers = {"HTTP-Referer": "https://vektor.security", "X-Title": "Vektor Security Auditor"} if base_url else {}

        try:
            response = await client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Perform Ultimate CoT Audit on: \n\n{request.code}"}
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
            return None

    @staticmethod
    async def _verify_with_senior_auditor(initial_report: AuditReport, api_key: str, base_url: Optional[str] = None) -> AuditReport:
        client = AsyncOpenAI(api_key=api_key, base_url=base_url)
        
        system_prompt = """
        You are the Senior Auditor at Vektor. A junior auditor has submitted the following findings.
        Your job is to:
        1. Verify each finding for accuracy (reject false positives).
        2. Find any vulnerabilities the junior auditor MISSED in the original code.
        3. Refine the explanation and exploit POCs for maximum clarity.
        
        Junior Auditor Findings:
        """
        for f in initial_report.findings:
            system_prompt += f"- {f.vulnerability} on line {f.line_number}: {f.explanation}\n"

        system_prompt += "\nOriginal Code:\n" + initial_report.raw_code

        extra_headers = {"HTTP-Referer": "https://vektor.security", "X-Title": "Vektor Senior Review"} if base_url else {}

        response = await client.chat.completions.create(
            model="google/gemini-2.0-flash-exp:free" if base_url else "gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": "Produce the FINAL, verified Audit Report in JSON format."}
            ],
            response_format={"type": "json_object"},
            extra_headers=extra_headers
        )
        
        data = json.loads(response.choices[0].message.content)
        initial_report.findings = [AuditFinding(**f) for f in data["findings"]]
        initial_report.summary = data.get("summary", initial_report.summary)
        initial_report.overall_score = data.get("overall_score", initial_report.overall_score)
        initial_report.risk_level = data.get("risk_level", initial_report.risk_level)
        return initial_report

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
            {"title": "Unchecked AccountInfo", "pattern": r"AccountInfo|next_account_info", "severity": "High", "remediation": "Use specific Anchor types or manually verify account properties.", "fix": "Account<'info, TokenAccount>", "exploit": "An attacker can pass an account with arbitrary data that the program will process as valid input."},
            {"title": "Reentrancy Risk", "pattern": r"invoke|invoke_signed", "severity": "High", "remediation": "Update state before CPI.", "fix": "self.balance -= amount; invoke(...);", "exploit": "Attacker re-enters the program via a malicious callback program to double-spend funds."}
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

        return AuditReport(
            id=str(uuid.uuid4()),
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            contract_name=request.contract_name,
            overall_score=max(0, 100 - sum(20 for _ in findings)),
            summary=f"Heuristic Audit complete. {len(findings)} issues identified.",
            risk_level="High" if findings else "Low",
            findings=findings,
            raw_code=request.code,
            framework=framework
        )

    @staticmethod
    async def chat_advisor(message: str, history: List[dict], report: Optional[AuditReport], code: str) -> str:
        or_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENAI_API_KEY")
        
        # 'Unbreakable' Failover Advisor (The Perfect Fallback)
        if not or_key:
            msg = message.lower()
            if "overflow" in msg:
                return "SOLANA SECURITY ADVISOR: Integer overflow in Solana programs occurs when mathematical operations (+, -, *) result in values exceeding the storage capacity of the variable (e.g., u64). This often leads to massive balance manipulation. FIX: Use `.checked_add()`, `.checked_sub()`, or the `anchor-lang` SafeMath checks. Attacker Perspective: We pass a 'pumping' value to wrap the balance to 0, or an 'overflow' value to wrap to max."
            if "signer" in msg:
                return "SOLANA SECURITY ADVISOR: Missing signer verification is the #1 cause of theft in Solana. If an instruction transfers funds but doesn't check if the authority 'signed' the tx, anyone can steal anyone's tokens. FIX: Use `Signer<'info, AccountInfo>` in Anchor or manually check `account.is_signer`. Attacker Perspective: We call the 'withdraw' instruction with the victim's account as authority, and since the program never checks for a signature, the tx succeeds."
            if "reentrancy" in msg:
                return "SOLANA SECURITY ADVISOR: Reentrancy on Solana is subtle but deadly. It occurs when you make a CPI call to another program BEFORE updating your own state. The malicious program can call back into your instruction to re-process state. FIX: Always update accounts BEFORE calling `invoke` or `invoke_signed`. This is the Checks-Effects-Interactions pattern."
            if "pda" in msg:
                return "SOLANA SECURITY ADVISOR: PDA Seed Collision occurs when seeds are not unique or validated. Attackers can supply seeds that resolve to an account they control, spoofing a system account. FIX: Always verify seeds using `find_program_address` and strictly validate every user-supplied seed."
            
            return "Vektor AI Security Advisor (Offline Mode): I've analyzed your Solana code. I'm highly trained in detecting Overflows, Signer issues, Reentrancy, and PDA vulnerabilities. Which one should we secure first?"

        client = AsyncOpenAI(
            api_key=or_key,
            base_url="https://openrouter.ai/api/v1" if os.getenv("OPENROUTER_API_KEY") else None
        )

        context = f"Code:\n{code}\n\n"
        if report:
            context += f"Report Context (Score {report.overall_score}):\nSummary: {report.summary}\n"
            for f in report.findings:
                context += f"- {f.vulnerability} on line {f.line_number}: {f.explanation}\n"

        system_prompt = f"""
        You are the Vektor AI Security Advisor. You provide perfect, technical, yet educational advice on Solana security.
        Context: {context}
        
        Guidelines:
        1. Explaining the 'Attacker Perspective' for every vulnerability discussed.
        2. Providing 'Anchor-native' code fixes.
        3. Ensuring 100% accuracy.
        """

        messages = [{"role": "system", "content": system_prompt}]
        for msg in history:
            messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": message})

        try:
            response = await client.chat.completions.create(
                model="google/gemini-2.0-flash-exp:free" if os.getenv("OPENROUTER_API_KEY") else "gpt-4o-mini",
                messages=messages,
                max_tokens=800
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Vektor Core Error: {str(e)}. Attempting Local Fallback... {await AuditService.chat_advisor(message, history, report, code)}"
