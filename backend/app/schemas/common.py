from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(..., examples=["healthy", "degraded"])
    version: str
    environment: str
    database: str = Field(..., examples=["connected", "unreachable"])
    redis: str = Field(..., examples=["connected", "unreachable"])


class ErrorResponse(BaseModel):
    error: str
    message: str
    details: dict | None = None


class DashboardStatsResponse(BaseModel):
    total_jobs: int = 0
    pending_jobs: int = 0
    processing_jobs: int = 0
    completed_jobs: int = 0
    partial_jobs: int = 0
    failed_jobs: int = 0
    total_certificates: int = 0
    successful_certificates: int = 0
    failed_certificates: int = 0
    pending_certificates: int = 0
