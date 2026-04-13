from datetime import datetime
import uuid
from typing import List, Optional
from pydantic import BaseModel, Field

class AuditFinding(BaseModel):
    vulnerability: str
    severity: str
    explanation: str
    recommendation: str
    corrected_code: Optional[str] = None
    exploit_poc: Optional[str] = None
    anchor_test: Optional[str] = None
    confidence_score: int = 100
    line_number: Optional[int] = None
    source: str = "ai"

class AuditReport(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = Field(default_factory=datetime.now)
    contract_name: str
    overall_score: int
    summary: str
    risk_level: str
    findings: List[AuditFinding]
    raw_code: str
    framework: Optional[str] = "Native Solana"
    chat_history: List[dict] = []
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class AuditRequest(BaseModel):
    code: str = ""
    contract_name: Optional[str] = "SolanaProgram"
    zip_data: Optional[str] = None # Base64 zip bundle
