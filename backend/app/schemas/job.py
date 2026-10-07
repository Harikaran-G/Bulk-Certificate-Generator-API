import uuid
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.schemas.certificate import RecipientInput, CertificateSummary


class CreateJobRequest(BaseModel):
    organization_name: str = Field(
        default="GLOBAL ACADEMY OF TECHNOLOGY & EXCELLENCE",
        min_length=1,
        max_length=255,
        description="Name of the issuing organization",
        examples=["ABC Technologies"],
    )
    course_name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Name of the course / certification program",
        examples=["Python Programming"],
    )
    event_name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Name of the event or cohort",
        examples=["Python Workshop 2026"],
    )
    issue_date: date = Field(
        ...,
        description="Certificate issuance date (YYYY-MM-DD)",
        examples=["2026-10-07"],
    )
    signature_image: str | None = Field(
        default=None,
        description="Optional base64 digital signature image (PNG/JPG/WebP/SVG)",
    )
    signatory_name: str | None = Field(
        default=None,
        description="Optional name of the authorized signatory",
        examples=["Satheesha B. Nanjappa"],
    )
    signatory_title: str | None = Field(
        default=None,
        description="Optional title of the authorized signatory",
        examples=["Senior Vice President and Head"],
    )
    recipients: list[RecipientInput] = Field(
        ...,
        min_length=1,
        max_length=5000,
        description="List of recipients for whom certificates will be generated",
    )

    @field_validator("organization_name", "course_name", "event_name")
    @classmethod
    def validate_not_blank(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Field cannot be blank or only whitespace")
        return stripped


class CreateJobResponse(BaseModel):
    job_id: uuid.UUID
    status: str
    total_recipients: int
    message: str


class JobStatusResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    job_id: uuid.UUID
    status: str
    organization_name: str
    course_name: str
    event_name: str
    issue_date: date
    signatory_name: str | None = None
    signatory_title: str | None = None
    total_recipients: int
    processed_count: int
    successful_count: int
    failed_count: int
    progress_percentage: float
    created_at: datetime
    started_at: datetime | None = None
    completed_at: datetime | None = None
    error_message: str | None = None


class JobListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    jobs: list[JobStatusResponse]


class JobCertificatesResponse(BaseModel):
    job_id: uuid.UUID
    total: int
    page: int
    page_size: int
    total_pages: int
    certificates: list[CertificateSummary]


class DeleteJobResponse(BaseModel):
    message: str
    job_id: uuid.UUID
    certificates_deleted: int = 0

