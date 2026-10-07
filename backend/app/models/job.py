import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, Date, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import GUID


class JobStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    COMPLETED_WITH_ERRORS = "completed_with_errors"
    FAILED = "failed"


class Job(Base):
    __tablename__ = "jobs"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    status = Column(
        SQLEnum(JobStatus, values_callable=lambda obj: [e.value for e in obj], name="job_status_enum"),
        nullable=False,
        default=JobStatus.PENDING,
        index=True,
    )
    organization_name = Column(String(255), nullable=False, default="GLOBAL ACADEMY OF TECHNOLOGY & EXCELLENCE")
    course_name = Column(String(255), nullable=False)
    event_name = Column(String(255), nullable=False)
    issue_date = Column(Date, nullable=False)
    signature_image = Column(Text, nullable=True)
    signatory_name = Column(String(255), nullable=True)
    signatory_title = Column(String(255), nullable=True)

    total_recipients = Column(Integer, nullable=False, default=0)
    processed_count = Column(Integer, nullable=False, default=0)
    successful_count = Column(Integer, nullable=False, default=0)
    failed_count = Column(Integer, nullable=False, default=0)

    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)

    # Relationships
    certificates = relationship(
        "Certificate",
        back_populates="job",
        cascade="all, delete-orphan",
        order_by="Certificate.created_at",
        lazy="selectin",
    )

    @property
    def progress_percentage(self) -> float:
        if self.total_recipients == 0:
            return 0.0
        return round((self.processed_count / self.total_recipients) * 100, 2)
