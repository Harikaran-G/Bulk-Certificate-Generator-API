from collections.abc import Generator
from fastapi import Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.storage_service import BaseStorageService, get_storage_service
from app.services.job_service import JobService, get_job_service
from app.services.pdf_service import PDFService, get_pdf_service


def get_database() -> Generator[Session, None, None]:
    yield from get_db()


def get_storage() -> BaseStorageService:
    return get_storage_service()


def get_job_svc(storage: BaseStorageService = Depends(get_storage)) -> JobService:
    return get_job_service(storage_service=storage)


def get_pdf_svc(storage: BaseStorageService = Depends(get_storage)) -> PDFService:
    return get_pdf_service(storage_service=storage)
