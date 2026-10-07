import io
import math
import uuid
import zipfile
from datetime import datetime, timezone
from sqlalchemy import or_, func
from sqlalchemy.orm import Session
from app.core.exceptions import JobNotFoundError, InvalidStateError
from app.core.logging import logger
from app.models.job import Job, JobStatus
from app.models.certificate import Certificate, CertificateStatus
from app.schemas.common import DashboardStatsResponse
from app.schemas.job import (
    CreateJobRequest,
    JobStatusResponse,
    JobListResponse,
    JobCertificatesResponse,
)
from app.services.certificate_service import CertificateService
from app.services.storage_service import BaseStorageService, get_storage_service


class JobService:
    def __init__(self, storage_service: BaseStorageService | None = None):
        self.storage_service = storage_service or get_storage_service()

    def create_job(self, db: Session, payload: CreateJobRequest) -> Job:
        job_id = uuid.uuid4()
        total_recipients = len(payload.recipients)

        job = Job(
            id=job_id,
            status=JobStatus.PENDING,
            organization_name=payload.organization_name,
            course_name=payload.course_name,
            event_name=payload.event_name,
            issue_date=payload.issue_date,
            signature_image=payload.signature_image,
            signatory_name=payload.signatory_name,
            signatory_title=payload.signatory_title,
            total_recipients=total_recipients,
            processed_count=0,
            successful_count=0,
            failed_count=0,
            created_at=datetime.now(timezone.utc),
        )
        db.add(job)

        certificates = [
            Certificate(
                id=uuid.uuid4(),
                job_id=job_id,
                recipient_name=rec.name,
                recipient_email=rec.email,
                course_name=payload.course_name,
                event_name=payload.event_name,
                issue_date=payload.issue_date,
                status=CertificateStatus.PENDING,
                created_at=datetime.now(timezone.utc),
            )
            for rec in payload.recipients
        ]
        db.add_all(certificates)
        db.commit()
        db.refresh(job)

        logger.info(f"Job created: job_id={job.id}, org='{job.organization_name}', recipients={total_recipients}")

        # Dispatch background processing via Celery or async fallback
        from app.tasks.certificate_tasks import dispatch_job_processing
        dispatch_job_processing(str(job.id))

        return job

    def get_job(self, db: Session, job_id: uuid.UUID | str) -> Job:
        if isinstance(job_id, str):
            try:
                job_id = uuid.UUID(job_id)
            except ValueError:
                raise JobNotFoundError(str(job_id))

        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            raise JobNotFoundError(str(job_id))
        return job

    def list_jobs(
        self,
        db: Session,
        page: int = 1,
        page_size: int = 20,
        status_filter: str | None = None,
        search: str | None = None,
    ) -> JobListResponse:
        query = db.query(Job)

        if status_filter:
            status_val = status_filter.lower().strip()
            query = query.filter(Job.status == status_val)

        if search:
            s = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Job.organization_name.ilike(s),
                    Job.course_name.ilike(s),
                    Job.event_name.ilike(s),
                )
            )

        total = query.count()
        offset = (page - 1) * page_size
        jobs = query.order_by(Job.created_at.desc()).offset(offset).limit(page_size).all()
        total_pages = math.ceil(total / page_size) if page_size > 0 and total > 0 else 1

        items = [self._to_status_response(j) for j in jobs]
        return JobListResponse(
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            jobs=items,
        )

    def get_dashboard_stats(self, db: Session) -> DashboardStatsResponse:
        jobs = db.query(Job).all()
        certs = db.query(Certificate).all()

        total_jobs = len(jobs)
        pending_jobs = sum(1 for j in jobs if j.status == JobStatus.PENDING)
        processing_jobs = sum(1 for j in jobs if j.status == JobStatus.PROCESSING)
        completed_jobs = sum(1 for j in jobs if j.status == JobStatus.COMPLETED)
        partial_jobs = sum(1 for j in jobs if j.status == JobStatus.COMPLETED_WITH_ERRORS)
        failed_jobs = sum(1 for j in jobs if j.status == JobStatus.FAILED)

        total_certs = len(certs)
        successful_certs = sum(1 for c in certs if c.status == CertificateStatus.COMPLETED)
        failed_certs = sum(1 for c in certs if c.status == CertificateStatus.FAILED)
        pending_certs = sum(1 for c in certs if c.status in (CertificateStatus.PENDING, CertificateStatus.PROCESSING))

        return DashboardStatsResponse(
            total_jobs=total_jobs,
            pending_jobs=pending_jobs,
            processing_jobs=processing_jobs,
            completed_jobs=completed_jobs,
            partial_jobs=partial_jobs,
            failed_jobs=failed_jobs,
            total_certificates=total_certs,
            successful_certificates=successful_certs,
            failed_certificates=failed_certs,
            pending_certificates=pending_certs,
        )

    def _to_status_response(self, job: Job) -> JobStatusResponse:
        return JobStatusResponse(
            job_id=job.id,
            status=job.status.value if hasattr(job.status, "value") else str(job.status),
            organization_name=job.organization_name,
            course_name=job.course_name,
            event_name=job.event_name,
            issue_date=job.issue_date,
            signatory_name=getattr(job, "signatory_name", None),
            signatory_title=getattr(job, "signatory_title", None),
            total_recipients=job.total_recipients,
            processed_count=job.processed_count,
            successful_count=job.successful_count,
            failed_count=job.failed_count,
            progress_percentage=job.progress_percentage,
            created_at=job.created_at,
            started_at=job.started_at,
            completed_at=job.completed_at,
            error_message=job.error_message,
        )

    def get_job_status_response(self, db: Session, job_id: uuid.UUID | str) -> JobStatusResponse:
        job = self.get_job(db, job_id)
        return self._to_status_response(job)

    def get_job_certificates_response(
        self,
        db: Session,
        job_id: uuid.UUID | str,
        page: int = 1,
        page_size: int = 50,
    ) -> JobCertificatesResponse:
        job = self.get_job(db, job_id)
        certs, total = CertificateService.list_by_job_id(db, job.id, page=page, page_size=page_size)
        total_pages = math.ceil(total / page_size) if page_size > 0 and total > 0 else 1

        summaries = [CertificateService.to_summary(c) for c in certs]
        return JobCertificatesResponse(
            job_id=job.id,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            certificates=summaries,
        )

    def retry_failed_certificates(self, db: Session, job_id: uuid.UUID | str) -> Job:
        job = self.get_job(db, job_id)

        failed_certs = (
            db.query(Certificate)
            .filter(Certificate.job_id == job.id, Certificate.status == CertificateStatus.FAILED)
            .all()
        )

        if not failed_certs:
            raise InvalidStateError(f"Job {job_id} has no failed certificates to retry.")

        for cert in failed_certs:
            cert.status = CertificateStatus.PENDING
            cert.error_message = None
            cert.completed_at = None

        job.status = JobStatus.PENDING
        job.failed_count = max(0, job.failed_count - len(failed_certs))
        job.processed_count = max(0, job.processed_count - len(failed_certs))
        job.completed_at = None
        db.commit()
        db.refresh(job)

        logger.info(f"Retrying {len(failed_certs)} failed certificates for job {job.id}")

        from app.tasks.certificate_tasks import dispatch_job_processing
        dispatch_job_processing(str(job.id))

        return job

    def generate_job_zip(self, db: Session, job_id: uuid.UUID | str) -> io.BytesIO:
        job = self.get_job(db, job_id)
        completed_certs = CertificateService.get_completed_for_job(db, job.id)

        if not completed_certs:
            raise InvalidStateError(f"No completed certificates available for download for job {job.id}")

        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            for cert in completed_certs:
                if cert.file_path and self.storage_service.certificate_exists(cert.file_path):
                    file_bytes = self.storage_service.get_certificate_bytes(cert.file_path)
                    safe_name = f"{cert.recipient_name.replace(' ', '_')}_{cert.id}.pdf"
                    zip_file.writestr(safe_name, file_bytes)

        zip_buffer.seek(0)
        return zip_buffer

    def delete_job(self, db: Session, job_id: uuid.UUID | str) -> dict:
        job = self.get_job(db, job_id)
        certs = db.query(Certificate).filter(Certificate.job_id == job.id).all()
        deleted_files_count = 0
        for cert in certs:
            if cert.file_path:
                if self.storage_service.delete_certificate(cert.file_path):
                    deleted_files_count += 1

        db.delete(job)
        db.commit()

        logger.info(f"Deleted job {job.id} and {len(certs)} associated certificates ({deleted_files_count} files removed from storage)")
        return {
            "message": "Job and all associated certificates deleted successfully",
            "job_id": job.id,
            "certificates_deleted": len(certs),
        }


def get_job_service(storage_service: BaseStorageService | None = None) -> JobService:
    return JobService(storage_service=storage_service)
