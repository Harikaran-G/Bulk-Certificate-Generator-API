import uuid
from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.api.dependencies import get_database, get_job_svc
from app.schemas.job import (
    CreateJobRequest,
    CreateJobResponse,
    JobStatusResponse,
    JobListResponse,
    JobCertificatesResponse,
    DeleteJobResponse,
)
from app.services.job_service import JobService

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.post(
    "",
    response_model=CreateJobResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Create bulk certificate generation job",
    description="Accepts a bulk recipient list, creates a background processing job, and immediately returns the job ID.",
)
def create_bulk_job(
    payload: CreateJobRequest,
    db: Session = Depends(get_database),
    job_service: JobService = Depends(get_job_svc),
) -> CreateJobResponse:
    job = job_service.create_job(db=db, payload=payload)
    return CreateJobResponse(
        job_id=job.id,
        status=job.status.value if hasattr(job.status, "value") else str(job.status),
        total_recipients=job.total_recipients,
        message="Certificate generation job accepted",
    )


@router.get(
    "",
    response_model=JobListResponse,
    summary="List all certificate generation jobs",
    description="Retrieves a paginated list of all jobs with optional status filter and search query.",
)
def list_jobs(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    status: str | None = Query(None, description="Filter by status (pending, processing, completed, completed_with_errors, failed)"),
    search: str | None = Query(None, description="Search by organization, course or event"),
    db: Session = Depends(get_database),
    job_service: JobService = Depends(get_job_svc),
) -> JobListResponse:
    return job_service.list_jobs(
        db=db,
        page=page,
        page_size=page_size,
        status_filter=status,
        search=search,
    )


@router.get(
    "/{job_id}",
    response_model=JobStatusResponse,
    summary="Get job status and real-time progress",
    description="Retrieve the current status, recipient counts, and progress percentage for a certificate generation job.",
)
def get_job_status(
    job_id: uuid.UUID,
    db: Session = Depends(get_database),
    job_service: JobService = Depends(get_job_svc),
) -> JobStatusResponse:
    return job_service.get_job_status_response(db=db, job_id=job_id)


@router.get(
    "/{job_id}/certificates",
    response_model=JobCertificatesResponse,
    summary="List certificates for a job",
    description="Retrieve paginated list of certificates belonging to the specified job.",
)
def get_job_certificates(
    job_id: uuid.UUID,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=500, description="Items per page"),
    db: Session = Depends(get_database),
    job_service: JobService = Depends(get_job_svc),
) -> JobCertificatesResponse:
    return job_service.get_job_certificates_response(db=db, job_id=job_id, page=page, page_size=page_size)


@router.get(
    "/{job_id}/download-zip",
    summary="Download all completed certificates as a ZIP archive",
    description="Streams a ZIP archive containing all successfully generated PDF certificates for the job.",
)
def download_job_certificates_zip(
    job_id: uuid.UUID,
    db: Session = Depends(get_database),
    job_service: JobService = Depends(get_job_svc),
) -> StreamingResponse:
    zip_buffer = job_service.generate_job_zip(db=db, job_id=job_id)
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="certificates_job_{job_id}.zip"'},
    )


@router.post(
    "/{job_id}/retry-failed",
    response_model=JobStatusResponse,
    summary="Retry failed certificates in a job",
    description="Resets all failed certificates in the job back to pending and queues background re-processing.",
)
@router.post(
    "/{job_id}/retry",
    response_model=JobStatusResponse,
    include_in_schema=False,
)
def retry_failed_certificates(
    job_id: uuid.UUID,
    db: Session = Depends(get_database),
    job_service: JobService = Depends(get_job_svc),
) -> JobStatusResponse:
    job = job_service.retry_failed_certificates(db=db, job_id=job_id)
    return job_service.get_job_status_response(db=db, job_id=job.id)


@router.delete(
    "/{job_id}",
    response_model=DeleteJobResponse,
    summary="Delete a job and its generated certificates",
    description="Deletes a job, all its certificate database records, and removes all associated PDF files from storage.",
)
def delete_job(
    job_id: uuid.UUID,
    db: Session = Depends(get_database),
    job_service: JobService = Depends(get_job_svc),
) -> DeleteJobResponse:
    result = job_service.delete_job(db=db, job_id=job_id)
    return DeleteJobResponse(
        message=result["message"],
        job_id=result["job_id"],
        certificates_deleted=result["certificates_deleted"],
    )

