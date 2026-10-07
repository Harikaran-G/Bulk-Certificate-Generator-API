import uuid
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class RecipientInput(BaseModel):
    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Full name of the recipient to be printed on certificate",
        examples=["Harikaran"],
    )
    email: EmailStr = Field(
        ...,
        description="Valid email address of the recipient",
        examples=["hari@example.com"],
    )

    @field_validator("name")
    @classmethod
    def validate_name_not_blank(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Recipient name cannot be blank or only whitespace")
        return stripped

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: EmailStr) -> str:
        return str(v).strip().lower()


class CertificateSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    certificate_id: uuid.UUID
    recipient_name: str
    recipient_email: str
    course_name: str | None = None
    event_name: str | None = None
    issue_date: date | None = None
    status: str
    download_url: str | None = None
    error_message: str | None = None
    created_at: datetime
    completed_at: datetime | None = None


class CertificateDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    certificate_id: uuid.UUID
    job_id: uuid.UUID
    recipient_name: str
    recipient_email: str
    course_name: str
    event_name: str
    issue_date: date
    status: str
    download_url: str | None = None
    error_message: str | None = None
    created_at: datetime
    completed_at: datetime | None = None


class CertificateListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    certificates: list[CertificateSummary]
