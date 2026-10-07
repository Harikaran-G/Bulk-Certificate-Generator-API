import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Date, DateTime, Text, ForeignKey, Index, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import GUID


class CertificateStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    job_id = Column(GUID, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)

    recipient_name = Column(String(255), nullable=False)
    recipient_email = Column(String(255), nullable=False)
    course_name = Column(String(255), nullable=False)
    event_name = Column(String(255), nullable=False)
    issue_date = Column(Date, nullable=False)

    status = Column(
        SQLEnum(CertificateStatus, values_callable=lambda obj: [e.value for e in obj], name="certificate_status_enum"),
        nullable=False,
        default=CertificateStatus.PENDING,
        index=True,
    )
    file_path = Column(String(500), nullable=True)
    error_message = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    job = relationship("Job", back_populates="certificates")

    __table_args__ = (
        Index("idx_certificates_job_status", "job_id", "status"),
        Index("idx_certificates_recipient_email", "recipient_email"),
    )
