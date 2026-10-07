import uuid
from fastapi import APIRouter, Depends, Header, Query, status
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
from app.api.dependencies import get_database, get_storage
from app.core.exceptions import StorageError
from app.models.certificate import CertificateStatus
from app.schemas.certificate import CertificateListResponse
from app.services.certificate_service import CertificateService
from app.services.storage_service import BaseStorageService

router = APIRouter(prefix="/certificates", tags=["Certificates"])


@router.get(
    "",
    response_model=CertificateListResponse,
    summary="List all certificates",
    description="Retrieve a paginated list of all generated certificates across jobs, with search and status filtering.",
)
def list_certificates(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=200, description="Items per page"),
    status: str | None = Query(None, description="Filter by status (pending, processing, completed, failed)"),
    search: str | None = Query(None, description="Search by recipient name, email, or course"),
    db: Session = Depends(get_database),
) -> CertificateListResponse:
    return CertificateService.list_all(
        db=db,
        page=page,
        page_size=page_size,
        status_filter=status,
        search=search,
    )


@router.get(
    "/{certificate_id}",
    summary="Get certificate detail or PDF file",
    description="Retrieves the generated PDF certificate if completed, or returns JSON status details if requested with format=json.",
)
def get_certificate(
    certificate_id: uuid.UUID,
    format: str | None = Query(None, description="Set to 'json' to explicitly retrieve JSON metadata"),
    accept: str | None = Header(None),
    db: Session = Depends(get_database),
    storage: BaseStorageService = Depends(get_storage),
):
    cert = CertificateService.get_by_id(db, certificate_id)

    wants_json = format == "json" or (accept and "application/json" in accept and "application/pdf" not in accept)

    if wants_json or cert.status != CertificateStatus.COMPLETED:
        detail = CertificateService.to_detail(cert)
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=detail.model_dump(mode="json"),
        )

    # Return the PDF file
    if not cert.file_path or not storage.certificate_exists(cert.file_path):
        raise StorageError(f"Certificate PDF file not found on storage for ID {certificate_id}")

    abs_path = storage.get_absolute_path(cert.file_path)
    return FileResponse(
        path=str(abs_path),
        media_type="application/pdf",
        content_disposition_type="inline",
    )


@router.get(
    "/{certificate_id}/download",
    summary="Directly download PDF certificate file",
    description="Downloads the PDF file for a completed certificate.",
)
def download_certificate_pdf(
    certificate_id: uuid.UUID,
    db: Session = Depends(get_database),
    storage: BaseStorageService = Depends(get_storage),
):
    cert = CertificateService.get_by_id(db, certificate_id)

    if cert.status != CertificateStatus.COMPLETED:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={
                "error": "InvalidStateError",
                "message": f"Certificate is currently in '{cert.status.value}' state and cannot be downloaded.",
                "status": cert.status.value,
                "error_message": cert.error_message,
            },
        )

    if not cert.file_path or not storage.certificate_exists(cert.file_path):
        raise StorageError(f"Certificate PDF file not found on storage for ID {certificate_id}")

    abs_path = storage.get_absolute_path(cert.file_path)
    safe_download_name = f"Certificate_{cert.recipient_name.replace(' ', '_')}_{cert.id}.pdf"
    return FileResponse(
        path=str(abs_path),
        media_type="application/pdf",
        filename=safe_download_name,
    )
