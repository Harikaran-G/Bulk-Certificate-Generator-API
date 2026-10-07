from datetime import date
from app.core.exceptions import PDFGenerationError
from app.core.logging import logger
from app.services.storage_service import BaseStorageService, get_storage_service
from app.templates.certificate_template import CertificateTemplate


class PDFService:
    def __init__(self, storage_service: BaseStorageService | None = None):
        self.storage_service = storage_service or get_storage_service()

    def generate_and_save_certificate(
        self,
        certificate_id: str,
        recipient_name: str,
        course_name: str,
        event_name: str,
        issue_date: date,
        org_name: str | None = None,
        signature_image: str | None = None,
        signatory_name: str | None = None,
        signatory_title: str | None = None,
    ) -> str:
        try:
            pdf_bytes = self.render_certificate_bytes(
                recipient_name=recipient_name,
                course_name=course_name,
                event_name=event_name,
                issue_date=issue_date,
                certificate_id=certificate_id,
                org_name=org_name,
                signature_image=signature_image,
                signatory_name=signatory_name,
                signatory_title=signatory_title,
            )
            file_path = self.storage_service.save_certificate(
                certificate_id=certificate_id,
                content=pdf_bytes,
            )
            return file_path
        except Exception as e:
            logger.error(f"Error generating PDF for certificate {certificate_id}: {e}")
            raise PDFGenerationError(f"PDF generation failed: {str(e)}")

    def render_certificate_bytes(
        self,
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
        if not recipient_name or not recipient_name.strip():
            raise PDFGenerationError("Recipient name is required for PDF rendering.")
        if not course_name or not course_name.strip():
            raise PDFGenerationError("Course name is required for PDF rendering.")

        try:
            return CertificateTemplate.generate(
                recipient_name=recipient_name,
                course_name=course_name,
                event_name=event_name,
                issue_date=issue_date,
                certificate_id=certificate_id,
                org_name=org_name,
                signature_image=signature_image,
                signatory_name=signatory_name,
                signatory_title=signatory_title,
            )
        except Exception as e:
            logger.error(f"ReportLab template rendering failed: {e}")
            raise PDFGenerationError(f"Template rendering error: {str(e)}")


def get_pdf_service(storage_service: BaseStorageService | None = None) -> PDFService:
    return PDFService(storage_service=storage_service)
