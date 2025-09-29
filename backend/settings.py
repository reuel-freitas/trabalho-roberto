"""Application configuration settings."""

import socket
from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration loaded from environment variables."""

    server_ip: str = "0.0.0.0"
    iface: str = "eth0"
    window_seconds: int = 5
    retention_seconds: int = 300

    model_config = SettingsConfigDict(env_file=".env", env_prefix="", env_nested_delimiter="__")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Se server_ip for 0.0.0.0, detectar automaticamente
        if self.server_ip == "0.0.0.0":
            try:
                # Conectar a um endereço externo para descobrir o IP local
                with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
                    s.connect(("8.8.8.8", 80))
                    self.server_ip = s.getsockname()[0]
            except Exception:
                # Fallback para localhost se não conseguir detectar
                self.server_ip = "127.0.0.1"


@lru_cache
def get_settings() -> Settings:
    """Return a cached settings instance."""

    return Settings()


