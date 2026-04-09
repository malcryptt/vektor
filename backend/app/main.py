from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="Vektor API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from .services.audit_service import AuditService
from .services.pdf_service import PDFService
from .models.models import AuditRequest, AuditReport
from fastapi.responses import Response
from typing import Dict

# Audit history (in-memory mock)
audit_history: Dict[str, AuditReport] = {}

@app.get("/")
async def root():
    return {"message": "Vektor Security Auditor API"}

@app.post("/audit", response_model=AuditReport)
@limiter.limit("5/minute")
async def create_audit(request: Request, audit_req: AuditRequest):
    report = await AuditService.analyze_code(audit_req)
    audit_history[report.id] = report
    return report

@app.get("/audit/{audit_id}", response_model=AuditReport)
async def get_audit(audit_id: str):
    if audit_id in audit_history:
        return audit_history[audit_id]
    return Response(content="Audit not found", status_code=404)

@app.get("/audit/{audit_id}/pdf")
async def export_pdf(audit_id: str):
    if audit_id in audit_history:
        report = audit_history[audit_id]
        pdf_bytes = PDFService.generate_report(report)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=vektor_audit_{audit_id}.pdf"}
        )
    return Response(content="Audit not found", status_code=404)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
