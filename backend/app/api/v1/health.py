import redis
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.api.dependencies import get_database, get_job_svc
from app.core.config import get_settings
from app.core.database import check_db_connection
from app.schemas.common import HealthResponse, DashboardStatsResponse
from app.services.job_service import JobService

router = APIRouter(tags=["Health & Stats"])
settings = get_settings()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check endpoint",
    description="Check the connectivity status of PostgreSQL database and Redis broker.",
)
def health_check(db: Session = Depends(get_database)):
    db_status = "connected"
    try:
        if not check_db_connection():
            db_status = "unreachable"
    except Exception:
        db_status = "unreachable"

    redis_status = "connected"
    try:
        r = redis.from_url(settings.REDIS_URL, socket_timeout=1.5)
        r.ping()
    except Exception:
        redis_status = "unreachable"

    is_healthy = db_status == "connected" and redis_status == "connected"

    payload = HealthResponse(
        status="healthy" if is_healthy else "degraded",
        version=settings.APP_VERSION,
        environment=settings.APP_ENV,
        database=db_status,
        redis=redis_status,
    )

    status_code = status.HTTP_200_OK if is_healthy else status.HTTP_503_SERVICE_UNAVAILABLE
    return JSONResponse(status_code=status_code, content=payload.model_dump())


@router.get(
    "/stats",
    response_model=DashboardStatsResponse,
    summary="Get aggregated dashboard statistics",
    description="Returns aggregate counts of jobs and certificates by status for the frontend dashboard.",
)
def get_dashboard_stats(
    db: Session = Depends(get_database),
    job_service: JobService = Depends(get_job_svc),
) -> DashboardStatsResponse:
    return job_service.get_dashboard_stats(db=db)
