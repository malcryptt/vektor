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
        pattern=r"\.mint\s*(?:!=|==)\s*.*mint|mint\(\)|into_mint_to_context",
        reference="Cashio Hack 2022",
        description="The program accesses a token account's mint or transfers collateral without properly validating that the token account's mint matches the globally expected mint.",
        remediation="Strictly check the mint of the deposit account: require!(account.mint == expected_mint, ErrorCode::InvalidMint)."
    ),
    SignatureConfig(
        name="Spoofed Instruction Sysvar (Wormhole)",
        pattern=r"load_instruction_at|sysvar::instructions", 
        reference="Wormhole Bridge Hack 2022",
        description="The program calls secp256k1 or ed25519 instruction verification using `load_instruction_at` but fails to check that the instruction genuinely belongs to the System Program or was processed securely.",
        remediation="Ensure the verifying instruction's `program_id` exactly matches the expected secp256k1 or ed25519 program address."
    ),
    SignatureConfig(
        name="Stale Oracle Price (Mango)",
        pattern=r"price\.price|get_price|oracle|pyth",
        reference="Mango Markets Hack 2022",
        description="The program consumes an oracle price without asserting staleness checks (timestamps or slot verification).",
        remediation="Assert that the oracle price was updated within an acceptable slot or timestamp window before acting on it."
    ),
    SignatureConfig(
        name="Jito Bundle/MEV Vulnerability",
        pattern=r"tip_account|jito_bundle|bundle_results",
        reference="Jito MEV Best Practices",
        description="The program may be susceptible to sandwich attacks or atomic bundle manipulation if it doesn't verify tip payments before committing state.",
        remediation="Explicitly verify that the Jito tip for the current bundle has been processed before finalizing high-value state transitions."
    ),
    SignatureConfig(
        name="Metadata Spoofing (Metaplex)",
        pattern=r"Metadata::from_account_info|Edition::from_account_info",
        reference="Metaplex Vulnerability Guide",
        description="The program deserializes Metaplex metadata without verifying the 'update_authority' or 'is_mutable' flags correctly.",
        remediation="Always verify the metadata account's key against the PDA derivation: [\"metadata\", program_id, mint_key]."
    ),
    SignatureConfig(
        name="Reentrancy via borrow_mut",
        pattern=r"\.data\.borrow_mut\(\)|RefCell",
        reference="Solana Reentrancy Patterns",
        description="The program uses `borrow_mut()` on account data, which can lead to runtime panics if an external CPI call re-enters the program and attempts to borrow the same data.",
        remediation="Adopt the Checks-Effects-Interactions pattern: update state BEFORE making external CPI calls."
    ),
    SignatureConfig(
        name="Anchor init_if_needed Pitfall",
        pattern=r"init_if_needed",
        reference="Anchor Security Advisories",
        description="Using `init_if_needed` can lead to vulnerabilities if the discriminator is not checked first or if initialization seeds are not strictly validated.",
        remediation="Prefer explicit initialization instructions (`init`) or ensure strict seed validation to prevent re-initialization attacks."
    )
]

def pre_scan(code: str) -> List[AuditFinding]:
    findings = []
    lines = code.split('\n')
    found_refs = set()
    
    for i, line in enumerate(lines):
        # Skip comments
        if line.strip().startswith("//") or line.strip().startswith("/*"):
            continue
            
        for sig in SIGNATURES:
            if sig.reference not in found_refs and sig.pattern.search(line):
                findings.append(AuditFinding(
                    vulnerability=sig.name,
                    explanation=f"{sig.description}. This pattern resembles the root cause of {sig.reference}.",
                    severity="High" if "Reentrancy" not in sig.name else "Critical",
                    recommendation=sig.remediation,
                    line_number=i + 1,
                    source="signature",
                    confidence_score=95
                ))
                found_refs.add(sig.reference)
                
    return findings
