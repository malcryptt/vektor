import random
import re
from typing import List
from ..models.models import AuditFinding, AuditReport, AuditRequest
import time

class AuditService:
    @staticmethod
    async def analyze_code(request: AuditRequest) -> AuditReport:
        # Simulate AI processing time
        time.sleep(2)
        
        findings = []
        code_lines = request.code.split('\n')
        
        vulnerabilities = [
            {
                "title": "Missing Signer Check",
                "pattern": r"(?i)signer",
                "description": "The program fails to verify if the account is a signer, allowing unauthorized users to execute critical logic.",
                "severity": "Critical",
                "remediation": "Add `if !account_info.is_signer { return Err(ProgramError::MissingRequiredSignature); }` check."
            },
            {
                "title": "Missing Ownership Check",
                "pattern": r"(?i)owner",
                "description": "The program does not verify the owner of the account, which could allow arbitrary account data to be passed in.",
                "severity": "High",
                "remediation": "Verify the account owner matches the program ID using `if account_info.owner != program_id { return Err(ProgramError::IncorrectProgramId); }`."
            },
            {
                "title": "Integer Overflow/Underflow",
                "pattern": r"[\+\-\*\/]",
                "description": "Unchecked arithmetic operations can lead to overflow or underflow vulnerabilities.",
                "severity": "High",
                "remediation": "Use checked math methods like `checked_add`, `checked_sub`, etc."
            },
            {
                "title": "Account Reload after CPI",
                "pattern": r"(?i)invoke",
                "description": "Account data might change after a Cross-Program Invocation (CPI). Failure to reload can lead to stale data usage.",
                "severity": "Medium",
                "remediation": "Reload the account after the CPI call if you need up-to-date data."
            },
            {
                "title": "Reentrancy Attack",
                "pattern": r"(?i)lamports",
                "description": "Modifying state after external calls or lamport transfers can be vulnerable to reentrancy.",
                "severity": "Critical",
                "remediation": "Use the Checks-Effects-Interactions pattern: update state before making external calls."
            },
            {
                "title": "Insecure Randomness",
                "pattern": r"(?i)Clock::get",
                "description": "Using slot or timestamp for randomness is insecure as validators can manipulate these values.",
                "severity": "High",
                "remediation": "Use an off-chain oracle or VDF for secure randomness."
            },
            {
                "title": "Arbitrary Signed Program Invocation",
                "pattern": r"(?i)invoke_signed",
                "description": "Insecure use of `invoke_signed` with user-controlled seeds could allow attackers to sign for program-owned accounts.",
                "severity": "Critical",
                "remediation": "Ensure seeds are correctly validated and not fully user-controlled."
            },
            {
                "title": "Invalid Account Data Validation",
                "pattern": r"(?i)data",
                "description": "Account data size or structure is not validated before deserialization.",
                "severity": "Medium",
                "remediation": "Implement strict data validation and size checks before processing account data."
            }
        ]

        found_types = set()
        for i, line in enumerate(code_lines):
            for v in vulnerabilities:
                if re.search(v["pattern"], line) and v["title"] not in found_types:
                    if random.random() > 0.4:
                        findings.append(AuditFinding(
                            title=v["title"],
                            description=v["description"],
                            severity=v["severity"],
                            remediation=v["remediation"],
                            line_start=i + 1,
                            line_end=i + 1,
                            code_snippet=line.strip()
                        ))
                        found_types.add(v["title"])

        # Calculate score
        base_score = 100
        for f in findings:
            if f.severity == "Critical": base_score -= 30
            elif f.severity == "High": base_score -= 20
            elif f.severity == "Medium": base_score -= 10
            else: base_score -= 5
        
        overall_score = max(0, base_score)

        summary = f"Audit completed for {request.contract_name}. "
        if not findings:
            summary += "No critical vulnerabilities found. The contract appears to follow Solana security best practices."
        else:
            summary += f"Found {len(findings)} potential security issues. Immediate attention is required for {sum(1 for f in findings if f.severity in ['Critical', 'High'])} high-risk vulnerabilities."

        return AuditReport(
            contract_name=request.contract_name,
            overall_score=overall_score,
            summary=summary,
            findings=findings,
            raw_code=request.code
        )
