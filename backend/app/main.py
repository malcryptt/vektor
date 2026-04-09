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
from .services.badge_service import BadgeService
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

@app.get("/audit/{audit_id}/badge")
async def get_audit_badge(audit_id: str):
    if audit_id in audit_history:
        report = audit_history[audit_id]
        svg = BadgeService.generate_badge_svg(report.overall_score)
        return Response(content=svg, media_type="image/svg+xml")
    return Response(content=BadgeService.generate_badge_svg(0), media_type="image/svg+xml")

@app.get("/on-chain/{program_id}")
async def simulate_on_chain_fetch(program_id: str):
    # This is a simulation for hackathon purposes
    mock_code = f"// Simulated source for {program_id}\nuse anchor_lang::prelude::*;\n\ndeclare_id!(\"{program_id}\");\n\n#[program]\npub mod target_program {{\n    pub fn process(ctx: Context<Process>) -> Result<()> {{\n        Ok(())\n    }}\n}}"
    return {"code": mock_code}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
