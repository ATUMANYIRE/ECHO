"""Application configuration management using Pydantic Settings."""

from pathlib import Path
from typing import List, Union
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
import json

_BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """Central application configuration loaded from environment and defaults."""

    model_config = SettingsConfigDict(
        env_file=(_BACKEND_DIR / ".env", ".env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "ECHO API"
    app_version: str = "0.1.0"
    environment: str = Field(default="development", alias="ENVIRONMENT")
    debug: bool = Field(default=False, alias="DEBUG")
    port: int = Field(default=8005, alias="PORT")
    host: str = Field(default="0.0.0.0", alias="HOST")

    # CORS configuration
    cors_origins: Union[List[str], str] = Field(
        default=["http://localhost:3005", "http://127.0.0.1:3005", "http://localhost:3000"],
        alias="CORS_ORIGINS",
    )

    # LLM Settings (Milestone 4 - server side only)
    gemini_api_key: str = Field(default="", alias="GEMINI_API_KEY")
    gemini_model: str = Field(default="gemini-3.5-flash-lite", alias="GEMINI_MODEL")
    gemini_timeout_seconds: float = Field(default=8.0, alias="GEMINI_TIMEOUT_SECONDS")
    gemini_max_retries: int = Field(default=1, alias="GEMINI_MAX_RETRIES")
    gemini_fallback_models: List[str] = Field(
        default=["gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3.6-flash", "gemini-flash-lite-latest"],
        alias="GEMINI_FALLBACK_MODELS"
    )

    # Execution Sandbox Settings (Milestone 2)
    runner_image: str = Field(default="echo-runner:latest", alias="RUNNER_IMAGE")
    execution_timeout_seconds: float = Field(default=8.0, alias="EXECUTION_TIMEOUT_SECONDS")
    execution_max_memory_mb: int = Field(default=128, alias="EXECUTION_MAX_MEMORY_MB")
    execution_max_steps: int = Field(default=500, alias="EXECUTION_MAX_STEPS")
    max_concurrent_executions: int = Field(default=5, alias="MAX_CONCURRENT_EXECUTIONS")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        return v


settings = Settings()
