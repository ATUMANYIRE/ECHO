"""Health check and system readiness route."""

import time
from datetime import datetime, timezone
from fastapi import APIRouter

from app.config import settings
from app.schemas.health import HealthResponse
from app.services.sandbox import sandbox_service

router = APIRouter(tags=["Health"])

START_TIME = time.time()


@router.get("/health", response_model=HealthResponse)
async def get_health() -> HealthResponse:
    """Return system health, uptime, and execution sandbox readiness."""
    uptime = time.time() - START_TIME
    docker_ready = await sandbox_service.check_sandbox_available()

    return HealthResponse(
        status="healthy" if docker_ready else "degraded",
        app=settings.app_name,
        version=settings.app_version,
        environment=settings.environment,
        uptime_seconds=round(uptime, 2),
        timestamp=datetime.now(timezone.utc),
        sandbox_available=docker_ready,
        execution_enabled=docker_ready,
        milestone="Milestone 3: Interactive Timeline & Variable State Inspection",
        message=(
            "ECHO API is operational. Isolated Docker execution runner is active."
            if docker_ready
            else "ECHO API is operational, but Docker runner is not detected. Untrusted code execution is paused."
        ),
    )
