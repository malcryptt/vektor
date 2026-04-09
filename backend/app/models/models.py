from datetime import datetime
import uuid
from typing import List, Optional
from pydantic import BaseModel, Field

class AuditFinding(BaseModel):
    title: str
    description: str
    severity: str  # Critical, High, Medium, Low
    remediation: str
    line_start: int
    line_end: int
    code_snippet: Optional[str] = None
    suggested_fix_code: Optional[str] = None

class AuditReport(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = Field(default_factory=datetime.now)
    contract_name: str
    overall_score: int  # 0-100
    summary: str
    findings: List[AuditFinding]
    raw_code: str

class AuditRequest(BaseModel):
    code: str
    contract_name: Optional[str] = "SolanaProgram"
