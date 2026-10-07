import os
import shutil
import uuid
import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

TEST_DB_FILE = "./test_certificates_backend.db"
TEST_STORAGE_DIR = Path("./tests/scratch/storage").resolve()

os.environ["APP_ENV"] = "testing"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_FILE}"
os.environ["STORAGE_PATH"] = str(TEST_STORAGE_DIR)
os.environ["REDIS_URL"] = "redis://localhost:6379/15"

import app.core.database as db_module
from app.core.celery_app import celery_app
from app.core.config import get_settings
from app.core.database import Base, get_db
from app.main import app
from app.services.storage_service import LocalStorageService, BaseStorageService
from app.api.dependencies import get_storage

settings = get_settings()
settings.STORAGE_PATH = str(TEST_STORAGE_DIR)

celery_app.conf.update(
    task_always_eager=True,
    task_eager_propagates=True,
)

test_engine = create_engine(
    f"sqlite:///{TEST_DB_FILE}",
    connect_args={"check_same_thread": False},
)
db_module.engine = test_engine
db_module.SessionLocal.configure(bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_suite():
    TEST_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists(TEST_DB_FILE):
        try:
            os.remove(TEST_DB_FILE)
        except Exception:
            pass
    if TEST_STORAGE_DIR.exists():
        shutil.rmtree(TEST_STORAGE_DIR.parent, ignore_errors=True)


@pytest.fixture(autouse=True)
def clean_tables_and_storage():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    if TEST_STORAGE_DIR.exists():
        for item in TEST_STORAGE_DIR.glob("*.pdf"):
            item.unlink(missing_ok=True)
    yield


@pytest.fixture
def db_session():
    session = db_module.SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def temp_storage() -> BaseStorageService:
    TEST_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    return LocalStorageService(base_dir=TEST_STORAGE_DIR)


@pytest.fixture
def client(temp_storage: BaseStorageService):
    def override_get_db():
        session = db_module.SessionLocal()
        try:
            yield session
        finally:
            session.close()

    def override_get_storage():
        return temp_storage

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_storage] = override_get_storage

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
