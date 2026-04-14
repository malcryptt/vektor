from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, XPreformatted
from io import BytesIO
import time

class PDFService:
    @staticmethod
    def generate_report(report) -> bytes:
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = []

        # Custom Styles
        title_style = ParagraphStyle(
            'TitleStyle', parent=styles['Heading1'], fontSize=24, 
            textColor=colors.HexColor("#ff4444"), spaceAfter=20, alignment=1
        )
        
        code_style = ParagraphStyle(
            'CodeStyle', parent=styles['Normal'], fontName='Courier',
            fontSize=8, textColor=colors.HexColor("#333333"),
            leftIndent=20, rightIndent=20, spaceBefore=5, spaceAfter=5,
            backColor=colors.HexColor("#F4F4F4")
        )

        elements.append(Paragraph("VEKTOR SECURITY AUDIT", title_style))
        elements.append(Paragraph(f"Smart Contract: {report.contract_name}", styles['Heading2']))
        elements.append(Paragraph(f"Safety Score: {report.overall_score}/100", styles['Normal']))
        elements.append(Spacer(1, 20))

        for finding in report.findings:
            elements.append(Paragraph(f"<b>{finding.title}</b> ({finding.severity})", styles['Heading3']))
            elements.append(Paragraph(f"<b>Description:</b> {finding.description}", styles['Normal']))
            
            if finding.suggested_fix_code:
                elements.append(Paragraph("<b>Suggested Fix:</b>", styles['Normal']))
                elements.append(Spacer(1, 5))
                elements.append(XPreformatted(finding.suggested_fix_code, code_style))
                
            elements.append(Spacer(1, 10))

        def add_watermark(canvas, doc):
            canvas.saveState()
            canvas.setFont('Helvetica-Bold', 100)
            canvas.setStrokeColor(colors.lightgrey)
            canvas.setFillGray(0.9)
            # Center of the page for watermark
            canvas.translate(300, 450)
            canvas.rotate(45)
            canvas.drawCentredString(0, 0, "VEKTOR")
            canvas.restoreState()

        doc.build(elements, onFirstPage=add_watermark, onLaterPages=add_watermark)
        pdf = buffer.getvalue()
        buffer.close()
        return pdf
