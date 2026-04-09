from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
import io
from ..models.models import AuditReport

class PDFService:
    @staticmethod
    def generate_report(report: AuditReport) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            textColor=colors.HexColor("#1A1A1A")
        )
        
        elements = []
        
        # Header
        elements.append(Paragraph(f"Vektor Security Audit Report", title_style))
        elements.append(Paragraph(f"Contract: {report.contract_name}", styles['Heading2']))
        elements.append(Paragraph(f"Date: {report.timestamp.strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
        elements.append(Spacer(1, 20))
        
        # Score
        score_color = colors.green if report.overall_score > 80 else (colors.orange if report.overall_score > 50 else colors.red)
        elements.append(Paragraph(f"Overall Security Score: <font color='{score_color}'>{report.overall_score}/100</font>", styles['Heading2']))
        elements.append(Spacer(1, 10))
        
        # Summary
        elements.append(Paragraph("Executive Summary", styles['Heading3']))
        elements.append(Paragraph(report.summary, styles['Normal']))
        elements.append(Spacer(1, 20))
        
        # Findings
        elements.append(Paragraph("Detailed Findings", styles['Heading3']))
        for i, finding in enumerate(report.findings):
            elements.append(Paragraph(f"{i+1}. {finding.title} ({finding.severity})", styles['Heading4']))
            elements.append(Paragraph(f"<b>Description:</b> {finding.description}", styles['Normal']))
            elements.append(Paragraph(f"<b>Remediation:</b> {finding.remediation}", styles['Normal']))
            elements.append(Paragraph(f"<b>Line:</b> {finding.line_start}", styles['Normal']))
            elements.append(Spacer(1, 10))
            
        doc.build(elements)
        return buffer.getvalue()
