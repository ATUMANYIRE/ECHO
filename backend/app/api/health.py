"""Health check and system readiness route."""

import asyncio
import os
import shutil
import time
from datetime import datetime, timezone
from fastapi import APIRouter

from app.config import settings
from app.schemas.health import HealthResponse

router = APIRouter(tags=["Health"])

START_TIME = time.time()


async def check_docker_available() -> bool:
    """Check if Docker CLI is installed and the daemon is reachable."""
    docker_bin = shutil.which("docker")
    if not docker_bin:
        return False

    try:
        proc = await asyncio.create_subprocess_exec(
            docker_bin,
            "info",
            "--format",
            "{{.ServerErrors}}",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        try:
            stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=1.5)
            # If proc returned 0 and no server errors, docker is running
            return proc.returncode == 0 and len(stdout.strip()) == 0
        except asyncio.TimeoutError:
            try:
                proc.kill()
            except Exception:
                pass
            return False
    except Exception:
        return False


@router.get("/health", response_model=HealthResponse)
async def get_health() -> HealthResponse:
    """Return system health, uptime, and execution sandbox readiness."""
    uptime = time.time() - START_TIME
    docker_ready = await check_docker_available()

    return HealthResponse(
        status="healthy",
        app=settings.app_name,
        version=settings.app_version,
        environment=settings.environment,
        uptime_seconds=round(uptime, 2),
        timestamp=datetime.now(timezone.utc),
        sandbox_available=docker_ready,
        execution_enabled=False,  # Milestone 1: code execution disabled by design
        milestone="Milestone 1: Production-Quality Foundation",
        message=(
            "ECHO API is operational. Code execution engine is scheduled for Milestone 2."
            if not docker_ready
            else "ECHO API is operational. Docker engine detected; sandbox runner active in Milestone 2."
        ),
    )
