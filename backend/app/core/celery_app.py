from celery import Celery
from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "certificate_generator",
    broker=settings.broker_url,
    backend=settings.result_backend,
    include=["app.tasks.certificate_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,
    task_soft_time_limit=3300,
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=100,
    broker_connection_retry_on_startup=True,
)
