import math
import uuid
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.core.exceptions import CertificateNotFoundError
from app.models.certificate import Certificate, CertificateStatus
from app.schemas.certificate import CertificateSummary, CertificateDetail, CertificateListResponse


class CertificateService:
    @staticmethod
    def get_by_id(db: Session, certificate_id: uuid.UUID | str) -> Certificate:
        if isinstance(certificate_id, str):
            try:
                certificate_id = uuid.UUID(certificate_id)
            except ValueError:
                raise CertificateNotFoundError(str(certificate_id))

        cert = db.query(Certificate).filter(Certificate.id == certificate_id).first()
        if not cert:
            raise CertificateNotFoundError(str(certificate_id))
        return cert

    @staticmethod
    def list_by_job_id(
        db: Session,
        job_id: uuid.UUID | str,
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[list[Certificate], int]:
        if isinstance(job_id, str):
            try:
                job_id = uuid.UUID(job_id)
            except ValueError:
                return [], 0

        query = db.query(Certificate).filter(Certificate.job_id == job_id)
        total = query.count()
        offset = (page - 1) * page_size
        certs = query.order_by(Certificate.created_at.asc()).offset(offset).limit(page_size).all()
        return certs, total

    @staticmethod
    def list_all(
        db: Session,
        page: int = 1,
        page_size: int = 50,
        status_filter: str | None = None,
        search: str | None = None,
    ) -> CertificateListResponse:
        query = db.query(Certificate)

        if status_filter:
            status_val = status_filter.lower().strip()
            query = query.filter(Certificate.status == status_val)

        if search:
            s = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Certificate.recipient_name.ilike(s),
                    Certificate.recipient_email.ilike(s),
                    Certificate.course_name.ilike(s),
                )
            )

        total = query.count()
        offset = (page - 1) * page_size
        certs = query.order_by(Certificate.created_at.desc()).offset(offset).limit(page_size).all()
        total_pages = math.ceil(total / page_size) if page_size > 0 and total > 0 else 1

        summaries = [CertificateService.to_summary(c) for c in certs]
        return CertificateListResponse(
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            certificates=summaries,
        )

    @staticmethod
    def get_completed_for_job(db: Session, job_id: uuid.UUID | str) -> list[Certificate]:
        if isinstance(job_id, str):
            job_id = uuid.UUID(job_id)
        return (
            db.query(Certificate)
            .filter(Certificate.job_id == job_id, Certificate.status == CertificateStatus.COMPLETED)
            .all()
        )

    @staticmethod
    def to_summary(cert: Certificate) -> CertificateSummary:
        download_url = f"/api/v1/certificates/{cert.id}" if cert.status == CertificateStatus.COMPLETED else None
        return CertificateSummary(
            certificate_id=cert.id,
            recipient_name=cert.recipient_name,
            recipient_email=cert.recipient_email,
            course_name=cert.course_name,
            event_name=cert.event_name,
            issue_date=cert.issue_date,
            status=cert.status.value if hasattr(cert.status, "value") else str(cert.status),
            download_url=download_url,
            error_message=cert.error_message,
            created_at=cert.created_at,
            completed_at=cert.completed_at,
        )

    @staticmethod
    def to_detail(cert: Certificate) -> CertificateDetail:
        download_url = f"/api/v1/certificates/{cert.id}" if cert.status == CertificateStatus.COMPLETED else None
        return CertificateDetail(
            certificate_id=cert.id,
            job_id=cert.job_id,
            recipient_name=cert.recipient_name,
            recipient_email=cert.recipient_email,
            course_name=cert.course_name,
            event_name=cert.event_name,
            issue_date=cert.issue_date,
            status=cert.status.value if hasattr(cert.status, "value") else str(cert.status),
            download_url=download_url,
            error_message=cert.error_message,
            created_at=cert.created_at,
            completed_at=cert.completed_at,
        )
