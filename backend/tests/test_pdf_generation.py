import uuid
from datetime import date
import pytest
from app.core.exceptions import PDFGenerationError, StorageError
from app.services.pdf_service import PDFService
from app.templates.certificate_template import CertificateTemplate


def test_certificate_template_renders_pdf_bytes():
    cert_id = str(uuid.uuid4())
    pdf_bytes = CertificateTemplate.generate(
        recipient_name="Harikaran",
        course_name="Python Mastery 2026",
        event_name="Global Backend Summit",
        issue_date=date(2026, 10, 7),
        certificate_id=cert_id,
        org_name="ABC Technologies",
    )

    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 1000
    assert pdf_bytes.startswith(b"%PDF-")


def test_pdf_service_generate_and_save(temp_storage):
    pdf_service = PDFService(storage_service=temp_storage)
    cert_id = str(uuid.uuid4())

    file_path = pdf_service.generate_and_save_certificate(
        certificate_id=cert_id,
        recipient_name="Arun Kumar",
        course_name="FastAPI & Celery Architecture",
        event_name="Engineering Cohort #4",
        issue_date=date(2026, 10, 7),
        org_name="ABC Technologies",
    )

    assert file_path == f"{cert_id}.pdf"
    assert temp_storage.certificate_exists(file_path) is True

    retrieved_bytes = temp_storage.get_certificate_bytes(file_path)
    assert retrieved_bytes.startswith(b"%PDF-")


def test_storage_service_path_traversal_protection(temp_storage):
    with pytest.raises(StorageError):
        temp_storage.get_certificate_bytes("../../../etc/passwd")


def test_pdf_service_empty_name_error(temp_storage):
    pdf_service = PDFService(storage_service=temp_storage)
    with pytest.raises(PDFGenerationError):
        pdf_service.render_certificate_bytes(
            recipient_name="",
            course_name="Python",
            event_name="Event",
            issue_date=date(2026, 10, 7),
            certificate_id="123",
        )


def test_certificate_template_with_digital_signature():
    # 1x1 transparent PNG base64
    tiny_png_b64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
    cert_id = str(uuid.uuid4())
    pdf_bytes = CertificateTemplate.generate(
        recipient_name="Jane Doe",
        course_name="Advanced Deep Learning",
        event_name="Tech Conference 2026",
        issue_date=date(2026, 10, 7),
        certificate_id=cert_id,
        org_name="Infosys",
        signature_image=tiny_png_b64,
        signatory_name="Satheesha B. Nanjappa",
        signatory_title="Executive Vice President",
    )

    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 1000
    assert pdf_bytes.startswith(b"%PDF-")

