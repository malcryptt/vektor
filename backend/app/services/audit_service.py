import os
import re
import json
import asyncio
import uuid
from typing import List, Optional
from openai import AsyncOpenAI
from ..models.models import AuditFinding, AuditReport, AuditRequest
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
        framework = AuditService.detect_framework(request.code)
        or_key = os.getenv("OPENROUTER_API_KEY")
        if or_key:
            return await AuditService._analyze_with_ai(
                request, 
                or_key, 
                base_url="https://openrouter.ai/api/v1",
                model="google/gemini-2.0-flash-lite-preview-02-05:free"
            )

        oa_key = os.getenv("OPENAI_API_KEY")
        if oa_key:
            return await AuditService._analyze_with_ai(request, oa_key)
            
        return await AuditService._analyze_with_heuristic(request)

    @staticmethod
    async def _analyze_with_ai(request: AuditRequest, api_key: str, base_url: Optional[str] = None, model: str = "gpt-4o-mini") -> AuditReport:
        client = AsyncOpenAI(api_key=api_key, base_url=base_url)
        
        system_prompt = """
        You are Vektor, a world-class Solana smart contract security auditor. 
        Your goal is to identify vulnerabilities in the provided Rust/Anchor code.
        Where relevant, reference historical Solana exploits (e.g., the Cashio infinite mint, the Wormhole bridge signature bypass) to explain the potential impact.
        
        For EVERY finding, you MUST provide a 'suggested_fix_code' which is the corrected version of the code snippet.
        
        ### EXAMPLE FINDING (JSON format):
        {
            "title": "Unchecked Account Ownership (Cashio Style)",
            "description": "The program fails to verify the owner of the 'vault' account. An attacker can pass a fake account owned by their own program.",
            "severity": "Critical",
            "remediation": "Use the #[account(owner = ...)] constraint or manually verify account.owner == program_id.",
            "exploit_scenario": "1. Attacker creates a malicious program that mimics a Vault account structure. 2. Attacker passes this malicious account to the 'withdraw' instruction. 3. The program reads the fake 'balance' and transfers real funds to the attacker.",
            "line_start": 42,
            "line_end": 42,
            "code_snippet": "let vault_info = &ctx.accounts.vault;",
            "suggested_fix_code": "let vault_info = &ctx.accounts.vault;\nif vault_info.owner != &crate::ID { return Err(ErrorCode::InvalidOwner.into()); }"
        }

        Return ONLY a JSON object:
        {
            "overall_score": number,
            "summary": "string",
            "findings": [ ... ]
        }
        
        Note: When calculating overall_score, use this weight: 
        Critical: -30, High: -20, Medium: -10, Low: -5.
        Start at 100 and do not go below 0.
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
                findings=findings,
                raw_code=request.code,
                framework=framework
            )
        except Exception:
            return await AuditService._analyze_with_heuristic(request)

    @staticmethod
    async def _analyze_with_heuristic(request: AuditRequest) -> AuditReport:
        await asyncio.sleep(1)
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
            for v in vulnerabilities:
                if re.search(v["pattern"], line) and v["title"] not in found_types:
                    findings.append(AuditFinding(
                        title=v["title"],
                        description=f"Potential {v['title']} detected.",
                        severity=v["severity"],
                        remediation=v["remediation"],
                        exploit_scenario=v["exploit"],
                        line_start=i + 1,
                        line_end=i + 1,
                        code_snippet=line.strip(),
                        suggested_fix_code=v["fix"]
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
            summary=f"Audit complete. {len(findings)} issues found.",
            findings=findings,
            raw_code=request.code,
            framework=framework
        )
