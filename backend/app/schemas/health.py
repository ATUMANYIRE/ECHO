"""Health check response schema."""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class HealthResponse(BaseModel):
    """System health and readiness details."""

    status: str = Field(..., description="Overall service status (healthy, degraded)")
    app: str = Field(..., description="Application name")
    version: str = Field(..., description="Application version")
    environment: str = Field(..., description="Deployment environment")
    uptime_seconds: float = Field(..., description="Service uptime in seconds")
    timestamp: datetime = Field(..., description="Current server time (UTC)")
    sandbox_available: bool = Field(
        ...,
        description="Whether the isolated container runtime is reachable on the host",
    )
    execution_enabled: bool = Field(
        default=False,
        description="Whether untrusted code execution is active in this milestone",
    )
    milestone: str = Field(
        default="Milestone 1: Production-Quality Foundation",
        description="Active product milestone",
    )
    message: Optional[str] = Field(
        default="ECHO API is operational. Code execution engine is scheduled for Milestone 2.",
        description="System status message",
    )
