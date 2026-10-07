import base64
import io
from datetime import date
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.graphics import renderPDF
from app.core.config import get_settings

settings = get_settings()


class CertificateTemplate:
    """High-fidelity Certificate Template matching enterprise credential standards
    (Infosys Springboard aesthetic with vertical tick accents, QR code, and uploaded digital signature).
    """

    PRIMARY_BLUE = colors.HexColor("#0070BA")
    DEEP_BLUE = colors.HexColor("#005A9C")
    TEXT_DARK = colors.HexColor("#1A1A1A")
    TEXT_MUTED = colors.HexColor("#333333")
    TEXT_LIGHT = colors.HexColor("#666666")
    CYAN_ACCENT = colors.HexColor("#82D1F4")
    CORAL_ACCENT = colors.HexColor("#ED458B")
    BG_WHITE = colors.HexColor("#FFFFFF")

    @classmethod
    def generate(
        cls,
        recipient_name: str,
        course_name: str,
        event_name: str,
        issue_date: date,
        certificate_id: str,
        org_name: str | None = None,
        signature_image: str | None = None,
        signatory_name: str | None = None,
        signatory_title: str | None = None,
    ) -> bytes:
        buffer = io.BytesIO()
        width, height = landscape(A4)  # 841.89 x 595.27 points
        c = canvas.Canvas(buffer, pagesize=(width, height))

        org_name = org_name or settings.DEFAULT_ORG_NAME or "Infosys"

        # 1. Pure White Clean Canvas
        c.setFillColor(cls.BG_WHITE)
        c.rect(0, 0, width, height, fill=1, stroke=0)

        # 2. Top Organization Brand Header
        c.setFillColor(cls.PRIMARY_BLUE)
        c.setFont("Helvetica-Bold", 26)
        c.drawCentredString(width / 2.0, height - 55, org_name)

        # Trademark dot / symbol
        c.setFont("Helvetica", 8)
        org_w = c.stringWidth(org_name, "Helvetica-Bold", 26)
        c.drawString(width / 2.0 + (org_w / 2.0) + 2, height - 42, "®")

        # Organization Tagline
        c.setFillColor(cls.PRIMARY_BLUE)
        c.setFont("Helvetica", 9)
        c.drawCentredString(width / 2.0, height - 72, "Navigate your next")

        # 3. Main Title Banner with Decorative Vertical Ticks
        title_text = "CERTIFICATE OF COMPLETION"
        c.setFont("Helvetica-Bold", 22)
        title_w = c.stringWidth(title_text, "Helvetica-Bold", 22)
        title_y = height - 125

        c.setFillColor(cls.PRIMARY_BLUE)
        c.drawCentredString(width / 2.0, title_y, title_text)

        # Draw left and right vertical decorative cyan ticks
        cls._draw_side_ticks(c, start_x=width / 2.0 - (title_w / 2.0) - 25, y=title_y - 2, count=10, direction=-1)
        cls._draw_side_ticks(c, start_x=width / 2.0 + (title_w / 2.0) + 25, y=title_y - 2, count=10, direction=1)

        # 4. Presentation Line
        c.setFillColor(cls.TEXT_MUTED)
        c.setFont("Helvetica", 12)
        c.drawCentredString(width / 2.0, height - 165, "presented to")

        # 5. Recipient Name (Bold Prominent Corporate Blue)
        c.setFillColor(cls.PRIMARY_BLUE)
        c.setFont("Helvetica-Bold", 26)
        c.drawCentredString(width / 2.0, height - 205, recipient_name.strip().upper())

        # 6. Body Text
        c.setFillColor(cls.TEXT_DARK)
        c.setFont("Helvetica", 11)
        c.drawCentredString(
            width / 2.0,
            height - 245,
            "for actively participating and completing the mandatory assignment related to",
        )

        # 7. Course / Program Title (Bold Dark Text)
        c.setFont("Helvetica-Bold", 13)
        course_str = course_name.strip()
        # Word wrap if course name is very long
        if len(course_str) > 75:
            words = course_str.split()
            mid = len(words) // 2
            line1 = " ".join(words[:mid])
            line2 = " ".join(words[mid:])
            c.drawCentredString(width / 2.0, height - 275, line1)
            c.drawCentredString(width / 2.0, height - 293, line2)
            cohort_y = height - 322
        else:
            c.drawCentredString(width / 2.0, height - 280, course_str)
            cohort_y = height - 310

        # 8. Event / Cohort Context
        c.setFont("Helvetica", 11)
        if event_name:
            c.drawCentredString(width / 2.0, cohort_y, f"conducted for {event_name.strip()}")
        else:
            c.drawCentredString(width / 2.0, cohort_y, f"issued on {issue_date.strftime('%B %d, %Y')}")

        # 9. Stylized Brand Badge (Infosys | Springboard style)
        badge_y = cohort_y - 45
        cls._draw_platform_badge(c, width / 2.0, badge_y, org_name)

        # 10. Bottom Left: Real Scannable QR Code & Verification info
        cls._draw_qr_code(c, x=35, y=55, certificate_id=certificate_id, size=105)

        # Date & Verification text under QR code
        formatted_date = issue_date.strftime("%A, %B %d, %Y")
        c.setFillColor(cls.TEXT_DARK)
        c.setFont("Helvetica", 8)
        c.drawString(35, 40, f"Issued on: {formatted_date}")
        c.drawString(35, 28, "To verify, scan the QR code or visit https://verify.onwingspan.com")

        # 11. Bottom Right: Executive Digital Signature Block
        cls._draw_signature_block(
            c,
            x=width - 200,
            y=95,
            org_name=org_name,
            signature_image=signature_image,
            signatory_name=signatory_name,
            signatory_title=signatory_title,
        )

        c.showPage()
        c.save()
        buffer.seek(0)
        return buffer.getvalue()

    @classmethod
    def _draw_side_ticks(cls, c: canvas.Canvas, start_x: float, y: float, count: int = 10, direction: int = 1) -> None:
        """Draws a row of vertical rounded ticks on either side of the title."""
        bar_w = 2.5
        bar_h = 16
        spacing = 5.5
        c.setFillColor(cls.CYAN_ACCENT)
        for i in range(count):
            bx = start_x + (i * spacing * direction) - (bar_w / 2.0)
            by = y - (bar_h / 2.0)
            c.roundRect(bx, by, bar_w, bar_h, radius=1, fill=1, stroke=0)

    @classmethod
    def _draw_platform_badge(cls, c: canvas.Canvas, cx: float, cy: float, org_name: str) -> None:
        """Draws stylized platform badge: {org_name} | Springboard / Certification."""
        c.setFont("Helvetica-Bold", 17)
        left_text = org_name
        left_w = c.stringWidth(left_text, "Helvetica-Bold", 17)

        c.setFont("Helvetica-Bold", 17)
        right_text = "Springboard"
        right_w = c.stringWidth(right_text, "Helvetica-Bold", 17)

        total_w = left_w + 16 + right_w
        start_x = cx - (total_w / 2.0)

        # Left Part
        c.setFillColor(cls.PRIMARY_BLUE)
        c.setFont("Helvetica-Bold", 17)
        c.drawString(start_x, cy, left_text)

        # Divider bar
        c.setStrokeColor(cls.CYAN_ACCENT)
        c.setLineWidth(1.5)
        c.line(start_x + left_w + 7, cy - 2, start_x + left_w + 7, cy + 15)

        # Right Part (Springboard)
        c.setFillColor(cls.CORAL_ACCENT)
        c.setFont("Helvetica-Bold", 17)
        c.drawString(start_x + left_w + 15, cy, right_text)

    @classmethod
    def _draw_qr_code(cls, c: canvas.Canvas, x: float, y: float, certificate_id: str, size: float = 105) -> None:
        """Renders an actual scannable 2D QR Code containing the verification URL."""
        verify_url = f"https://verify.onwingspan.com?cert_id={certificate_id}"
        qr = QrCodeWidget(verify_url)
        bounds = qr.getBounds()
        qr_w = bounds[2] - bounds[0]
        qr_h = bounds[3] - bounds[1]

        d = Drawing(size, size, transform=[size / qr_w, 0, 0, size / qr_h, 0, 0])
        d.add(qr)
        renderPDF.draw(d, c, x, y)

    @classmethod
    def _draw_signature_block(
        cls,
        c: canvas.Canvas,
        x: float,
        y: float,
        org_name: str,
        signature_image: str | None = None,
        signatory_name: str | None = None,
        signatory_title: str | None = None,
    ) -> None:
        """Renders the digital signature (either uploaded image or default executive script)."""
        rendered_image = False

        if signature_image and signature_image.strip():
            try:
                raw_data = signature_image.strip()
                if raw_data.startswith("data:"):
                    # Format: data:image/png;base64,...
                    header, encoded = raw_data.split(",", 1)
                    img_bytes = base64.b64decode(encoded)
                else:
                    img_bytes = base64.b64decode(raw_data)

                img_reader = ImageReader(io.BytesIO(img_bytes))
                # Draw signature image with transparent mask support
                sig_w, sig_h = 140, 48
                c.drawImage(
                    img_reader,
                    x - 30,
                    y + 5,
                    width=sig_w,
                    height=sig_h,
                    mask="auto",
                    preserveAspectRatio=True,
                )
                rendered_image = True
            except Exception as e:
                pass

        if not rendered_image:
            # Fallback default handwritten executive script
            c.setStrokeColor(colors.HexColor("#0D2C54"))
            c.setLineWidth(1.4)
            sig = c.beginPath()
            sig.moveTo(x - 25, y + 20)
            sig.curveTo(x - 10, y + 36, x + 5, y + 8, x + 25, y + 28)
            sig.curveTo(x + 45, y + 42, x + 65, y + 12, x + 85, y + 24)
            sig.curveTo(x + 95, y + 32, x + 105, y + 16, x + 115, y + 22)
            c.drawPath(sig, fill=0, stroke=1)

        # Signatory details
        disp_name = (signatory_name or "Satheesha B. Nanjappa").strip()
        disp_title = (signatory_title or "Senior Vice President and Head").strip()

        c.setFillColor(cls.TEXT_DARK)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(x - 30, y - 2, disp_name)

        c.setFillColor(cls.TEXT_MUTED)
        c.setFont("Helvetica", 7.5)
        c.drawString(x - 30, y - 13, disp_title)
        c.drawString(x - 30, y - 23, "Education, Training and Assessment")
        c.drawString(x - 30, y - 33, f"{org_name} Limited")


