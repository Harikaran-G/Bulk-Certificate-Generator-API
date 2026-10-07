import threading
import uuid
from datetime import datetime, timezone
from app.core.celery_app import celery_app
from app.core.database import SessionLocal
from app.core.logging import logger
from app.models.job import Job, JobStatus
from app.models.certificate import Certificate, CertificateStatus
from app.services.pdf_service import PDFService
from app.services.storage_service import LocalStorageService


def execute_certificate_job(job_id: str) -> dict:
    """Core execution logic for generating certificates for a job.
    Provides per-recipient fault isolation.
    """
    logger.info(f"Started certificate job execution for job_id={job_id}")
    db = SessionLocal()
    storage = LocalStorageService()
    pdf_service = PDFService(storage_service=storage)

    try:
        try:
            job_uuid = uuid.UUID(job_id)
        except ValueError:
            logger.error(f"Invalid UUID string for job: {job_id}")
            return {"error": "Invalid job UUID"}

        job = db.query(Job).filter(Job.id == job_uuid).first()
        if not job:
            logger.error(f"Job {job_id} not found in database.")
            return {"error": "Job not found"}

        # Transition job to PROCESSING
        job.status = JobStatus.PROCESSING
        if not job.started_at:
            job.started_at = datetime.now(timezone.utc)
        db.commit()

        # Query all certificates for this job
        certificates = (
            db.query(Certificate)
            .filter(Certificate.job_id == job_uuid)
            .order_by(Certificate.created_at.asc())
            .all()
        )

        successful_count = 0
        failed_count = 0
        processed_count = 0

        for cert in certificates:
            # Idempotency check: if already completed and file exists, skip regeneration
            if cert.status == CertificateStatus.COMPLETED and cert.file_path and storage.certificate_exists(cert.file_path):
                successful_count += 1
                processed_count += 1
                continue

            # Mark certificate as PROCESSING
            cert.status = CertificateStatus.PROCESSING
            db.commit()

            try:
                logger.debug(f"Generating certificate {cert.id} for recipient '{cert.recipient_name}'")

                if "__FORCE_FAIL__" in cert.recipient_name:
                    raise ValueError(f"Simulated failure trigger for recipient {cert.recipient_name}")

                file_path = pdf_service.generate_and_save_certificate(
                    certificate_id=str(cert.id),
                    recipient_name=cert.recipient_name,
                    course_name=cert.course_name,
                    event_name=cert.event_name,
                    issue_date=cert.issue_date,
                    org_name=job.organization_name,
                    signature_image=getattr(job, "signature_image", None),
                    signatory_name=getattr(job, "signatory_name", None),
                    signatory_title=getattr(job, "signatory_title", None),
                )

                cert.status = CertificateStatus.COMPLETED
                cert.file_path = file_path
                cert.error_message = None
                cert.completed_at = datetime.now(timezone.utc)

                successful_count += 1
                logger.info(f"Generated certificate {cert.id} successfully.")

            except Exception as exc:
                cert.status = CertificateStatus.FAILED
                cert.error_message = f"Generation error: {str(exc)}"
                cert.completed_at = datetime.now(timezone.utc)
                failed_count += 1
                logger.error(f"Failed generating certificate {cert.id} for {cert.recipient_name}: {exc}")

            processed_count += 1

            # Update job real-time progress counters
            job.processed_count = processed_count
            job.successful_count = successful_count
            job.failed_count = failed_count
            db.commit()

        # Finalize job status
        if failed_count == 0:
            job.status = JobStatus.COMPLETED
        elif successful_count > 0:
            job.status = JobStatus.COMPLETED_WITH_ERRORS
        else:
            job.status = JobStatus.FAILED

        job.completed_at = datetime.now(timezone.utc)
        db.commit()

        logger.info(
            f"Job {job_id} finished with status '{job.status.value}'. "
            f"Total: {job.total_recipients}, Success: {successful_count}, Failed: {failed_count}"
        )

        return {
            "job_id": job_id,
            "status": job.status.value,
            "total": job.total_recipients,
            "successful": successful_count,
            "failed": failed_count,
        }

    except Exception as e:
        logger.critical(f"Critical unhandled error processing job {job_id}: {e}", exc_info=True)
        try:
            job = db.query(Job).filter(Job.id == uuid.UUID(job_id)).first()
            if job:
                job.status = JobStatus.FAILED
                job.error_message = f"Worker internal error: {str(e)}"
                job.completed_at = datetime.now(timezone.utc)
                db.commit()
        except Exception:
            pass
        return {"error": str(e)}

    finally:
        db.close()


@celery_app.task(bind=True, name="process_bulk_certificate_job", max_retries=1)
def process_bulk_certificate_job(self, job_id: str) -> dict:
    """Celery task wrapper around execute_certificate_job."""
    return execute_certificate_job(job_id)


def is_redis_available() -> bool:
    """Fast non-blocking check to verify if the Celery/Redis broker is reachable."""
    try:
        import socket
        from urllib.parse import urlparse
        from app.core.config import get_settings
        settings = get_settings()
        parsed = urlparse(settings.broker_url)
        host = parsed.hostname or "127.0.0.1"
        port = parsed.port or 6379
        with socket.create_connection((host, port), timeout=0.15):
            return True
    except Exception:
        return False


def dispatch_job_processing(job_id: str) -> None:
    """Dispatches certificate job processing to Celery if broker is reachable,
    otherwise instantly executes in an asynchronous background daemon thread.
    """
    from app.core.config import get_settings
    settings = get_settings()

    if settings.APP_ENV == "testing":
        try:
            process_bulk_certificate_job.delay(job_id)
        except Exception:
            pass
        return

    if is_redis_available():
        try:
            process_bulk_certificate_job.delay(job_id)
            logger.info(f"Dispatched Celery task for job_id={job_id}")
            return
        except Exception as e:
            logger.info(f"Failed to dispatch to Celery ({e}), falling back to background thread.")
    else:
        logger.info(f"Redis broker offline. Executing job {job_id} in background daemon thread.")

    thread = threading.Thread(target=execute_certificate_job, args=(job_id,), daemon=True)
    thread.start()
