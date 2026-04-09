import re
from typing import List
from ..models.models import AuditFinding

class SignatureConfig:
    def __init__(self, name: str, pattern: str, reference: str, description: str, remediation: str):
        self.name = name
        self.pattern = re.compile(pattern, re.IGNORECASE)
        self.reference = reference
        self.description = description
        self.remediation = remediation

SIGNATURES = [
    SignatureConfig(
        name="Arbitrary Collateral Mint (Cashio)",
        pattern=r"\.mint\s*(?:!=|==)\s*.*mint|mint\(\)|into_mint_to_context",  # Over-simplified for demo purposes
        reference="Cashio Hack 2022",
        description="The program accesses a token account's mint or transfers collateral without properly validating that the token account's mint matches the globally expected mint.",
        remediation="Strictly check the mint of the deposit account: require!(account.mint == expected_mint, ErrorCode::InvalidMint)."
    ),
    SignatureConfig(
        name="Spoofed Instruction Sysvar (Wormhole)",
        pattern=r"load_instruction_at", 
        reference="Wormhole Bridge Hack 2022",
        description="The program calls secp256k1 or ed25519 instruction verification using `load_instruction_at` but fails to check that the instruction genuinely belongs to the System Program or was processed securely.",
        remediation="Ensure the verifying instruction's `program_id` exactly matches the expected secp256k1 or ed25519 program address."
    ),
    SignatureConfig(
        name="Stale Oracle Price (Mango)",
        pattern=r"price\.price|get_price|oracle",
        reference="Mango Markets Hack 2022",
        description="The program consumes an oracle price without asserting staleness checks (timestamps or slot verification).",
        remediation="Assert that the oracle price was updated within an acceptable slot or timestamp window before acting on it."
    )
]

def pre_scan(code: str) -> List[AuditFinding]:
    findings = []
    lines = code.split('\n')
    found_refs = set()
    
    for i, line in enumerate(lines):
        for sig in SIGNATURES:
            if sig.reference not in found_refs and sig.pattern.search(line):
                findings.append(AuditFinding(
                    title=sig.name,
                    description=sig.description,
                    severity="Critical",
                    remediation=sig.remediation,
                    exploit_scenario=f"This code signature strongly resembles the root cause of the {sig.reference}.",
                    line_start=i + 1,
                    line_end=i + 1,
                    code_snippet=line.strip(),
                    corrected_code=None,
                    source="signature"
                ))
                found_refs.add(sig.reference)
                
    return findings
