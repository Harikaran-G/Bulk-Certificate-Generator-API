import abc
from pathlib import Path
from app.core.config import get_settings
from app.core.exceptions import StorageError
from app.core.logging import logger

settings = get_settings()


class BaseStorageService(abc.ABC):
    @abc.abstractmethod
    def save_certificate(self, certificate_id: str, content: bytes) -> str:
        pass

    @abc.abstractmethod
    def get_certificate_bytes(self, file_path: str) -> bytes:
        pass

    @abc.abstractmethod
    def certificate_exists(self, file_path: str) -> bool:
        pass

    @abc.abstractmethod
    def get_absolute_path(self, file_path: str) -> Path:
        pass

    @abc.abstractmethod
    def delete_certificate(self, file_path: str) -> bool:
        pass


class LocalStorageService(BaseStorageService):
    def __init__(self, base_dir: Path | None = None):
        self.base_dir = (base_dir or settings.storage_dir).resolve()
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def _safe_path(self, relative_path: str) -> Path:
        safe_rel = Path(relative_path).name
        resolved = (self.base_dir / safe_rel).resolve()
        if not str(resolved).startswith(str(self.base_dir)):
            logger.error(f"Path traversal detected: {relative_path}")
            raise StorageError("Invalid file path: path traversal detected.")
        return resolved

    def save_certificate(self, certificate_id: str, content: bytes) -> str:
        try:
            filename = f"{certificate_id}.pdf"
            target_path = self._safe_path(filename)
            target_path.write_bytes(content)
            logger.debug(f"Saved certificate {certificate_id} to {target_path}")
            return filename
        except Exception as e:
            logger.error(f"Failed to save certificate {certificate_id}: {e}")
            raise StorageError(f"Failed to store certificate: {e}")

    def get_certificate_bytes(self, file_path: str) -> bytes:
        target_path = self._safe_path(file_path)
        if not target_path.exists() or not target_path.is_file():
            raise StorageError(f"Certificate file not found: {file_path}")
        try:
            return target_path.read_bytes()
        except Exception as e:
            logger.error(f"Failed to read certificate {file_path}: {e}")
            raise StorageError(f"Failed to read certificate file: {e}")

    def certificate_exists(self, file_path: str | None) -> bool:
        if not file_path:
            return False
        try:
            target_path = self._safe_path(file_path)
            return target_path.exists() and target_path.is_file() and target_path.stat().st_size > 0
        except Exception:
            return False

    def get_absolute_path(self, file_path: str) -> Path:
        return self._safe_path(file_path)

    def delete_certificate(self, file_path: str) -> bool:
        try:
            target_path = self._safe_path(file_path)
            if target_path.exists():
                target_path.unlink()
                return True
            return False
        except Exception as e:
            logger.error(f"Failed to delete certificate {file_path}: {e}")
            return False


def get_storage_service() -> BaseStorageService:
    return LocalStorageService()
