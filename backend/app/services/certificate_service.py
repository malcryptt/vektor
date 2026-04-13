import uuid
import time

class CertificateService:
    @staticmethod
    def generate_certificate(report_id: str, score: int):
        # Simulation of Metaplex NFT Minting for Hackathon
        mint_id = str(uuid.uuid4()).replace("-", "")[:32]
        return {
            "mint_address": f"VekT{mint_id}",
            "metadata_uri": f"https://vektor.security/metadata/{report_id}",
            "explorer_url": f"https://explorer.solana.com/address/VekT{mint_id}?cluster=mainnet-beta",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "status": "MINTED" if score > 90 else "VERIFIED"
        }
