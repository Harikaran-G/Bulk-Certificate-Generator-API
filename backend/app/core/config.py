from functools import lru_cache
from pathlib import Path
from typing import Literal
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # Application
    APP_NAME: str = "Bulk Certificate Generator API"
    APP_VERSION: str = "1.0.0"
    APP_ENV: Literal["development", "testing", "production"] = "development"
    DEBUG: bool = False
    SECRET_KEY: str = "super-secret-key-change-in-production-2026"
    API_V1_STR: str = "/api/v1"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Database
    DATABASE_URL: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/certificate_db",
        description="PostgreSQL or SQLite connection string",
    )

    # Redis / Celery
    REDIS_URL: str = Field(
        default="redis://localhost:6379/0",
        description="Redis connection URL for Celery broker and cache",
    )
    CELERY_BROKER_URL: str | None = None
    CELERY_RESULT_BACKEND: str | None = None

    # Storage
    STORAGE_PATH: str = Field(
        default="./storage/certificates",
        description="Directory for storing generated certificate PDFs",
    )

    # Limits & Validation
    MAX_RECIPIENTS_PER_JOB: int = 5000
    RATE_LIMIT_PER_MINUTE: int = 60

    # Organization Defaults
    DEFAULT_ORG_NAME: str = "GLOBAL ACADEMY OF TECHNOLOGY & EXCELLENCE"

    @property
    def broker_url(self) -> str:
        return self.CELERY_BROKER_URL or self.REDIS_URL

    @property
    def result_backend(self) -> str:
        return self.CELERY_RESULT_BACKEND or self.REDIS_URL

    @property
    def storage_dir(self) -> Path:
        p = Path(self.STORAGE_PATH).resolve()
        p.mkdir(parents=True, exist_ok=True)
        return p


@lru_cache
def get_settings() -> Settings:
    return Settings()
