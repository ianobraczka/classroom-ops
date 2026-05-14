from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


def _default_sqlite_url() -> str:
    data_dir = Path(__file__).resolve().parent.parent.parent / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    db_path = (data_dir / "classroom_ops.db").resolve()
    return f"sqlite+aiosqlite:///{db_path.as_posix()}"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Default: local SQLite file under backend/data/ (no Postgres required).
    # Set DATABASE_URL for PostgreSQL (Docker Compose, CI, production).
    database_url: str = Field(default_factory=_default_sqlite_url)
    cors_origins: str = "http://localhost:3000"


def get_settings() -> Settings:
    return Settings()
