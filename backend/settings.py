"""Application configuration settings."""

from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration loaded from environment variables."""

    server_ip: str
    iface: str
    window_seconds: int = 5
    retention_seconds: int = 300

    model_config = SettingsConfigDict(env_file=".env", env_prefix="", env_nested_delimiter="__")


@lru_cache
def get_settings() -> Settings:
    """Return a cached settings instance."""

    return Settings()


