from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from typing import Dict, List, Optional
import os
import json
import pickle

from .models.models import AuditReport, AuditRequest
from .services.audit_service import AuditService
from .services.pdf_service import PDFService
from .services.badge_service import BadgeService
from .services.certificate_service import CertificateService
from fastapi.responses import Response

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="Vektor Security API")

# Persistent storage for reports
REPORTS_FILE = "reports_db.pkl"
reports_db: Dict[str, AuditReport] = {}

if os.path.exists(REPORTS_FILE):
    try:
        with open(REPORTS_FILE, "rb") as f:
            reports_db = pickle.load(f)
            print(f"Loaded {len(reports_db)} reports from {REPORTS_FILE}")
    except Exception as e:
        print(f"Failed to load reports: {e}")

def save_reports():
    try:
        with open(REPORTS_FILE, "wb") as f:
            pickle.dump(reports_db, f)
    except Exception as e:
        print(f"Failed to save reports: {e}")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Vektor Security Auditor API"}

@app.post("/audit", response_model=AuditReport)
@limiter.limit("5/minute")
async def create_audit(request: Request, audit_req: AuditRequest):
    report = await AuditService.analyze_code(audit_req)
    reports_db[report.id] = report
    save_reports()
    return report

@app.get("/audit/{audit_id}")
async def get_audit(audit_id: str):
    if audit_id in reports_db:
        return reports_db[audit_id]
    return Response(content="Audit not found", status_code=404)

@app.get("/audit/{audit_id}/pdf")
async def export_pdf(audit_id: str):
    if audit_id in reports_db:
        report = reports_db[audit_id]
        pdf_bytes = PDFService.generate_report(report)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=vektor_audit_{audit_id}.pdf"}
        )
    return Response(content="Audit not found", status_code=404)

@app.get("/audit/{audit_id}/badge")
async def get_audit_badge(audit_id: str):
    if audit_id in reports_db:
        report = reports_db[audit_id]
        svg = BadgeService.generate_badge_svg(report.overall_score)
        return Response(content=svg, media_type="image/svg+xml")
    return Response(content=BadgeService.generate_badge_svg(0), media_type="image/svg+xml")

@app.post("/chat")
async def chat_advisor(request: Request):
    data = await request.json()
    report_id = data.get("report_id")
    message = data.get("message")
    history = data.get("history", [])
    code = data.get("code", "")
    
    report = reports_db.get(report_id)
    reply = await AuditService.chat_advisor(message, history, report, code)
    return {"reply": reply}

@app.get("/badge/{score}")
async def get_score_badge(score: int):
    svg = BadgeService.generate_badge_svg(max(0, min(100, score)))
    return Response(content=svg, media_type="image/svg+xml", headers={"Cache-Control": "no-cache"})

@app.get("/on-chain/{program_id}")
async def simulate_on_chain_fetch(program_id: str):
    # This is a simulation for hackathon purposes
    mock_code = f"// Simulated source for {program_id}\nuse anchor_lang::prelude::*;\n\ndeclare_id!(\"{program_id}\");\n\n#[program]\npub mod target_program {{\n    pub fn process(ctx: Context<Process>) -> Result<()> {{\n        Ok(())\n    }}\n}}"
    return {"code": mock_code}

@app.get("/audit/{audit_id}/certificate")
async def get_certificate(audit_id: str):
    if audit_id in reports_db:
        report = reports_db[audit_id]
        cert = CertificateService.generate_certificate(audit_id, report.overall_score)
        return cert
    return Response(content="Audit not found", status_code=404)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
