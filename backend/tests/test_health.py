"""Tests for health endpoint and service metadata."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_endpoint_api_path(async_client: AsyncClient):
    """Verify GET /api/health returns 200 OK with expected schema fields."""
    response = await async_client.get("/api/health")
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "healthy"
    assert data["app"] == "ECHO API"
    assert "version" in data
    assert "uptime_seconds" in data
    assert data["uptime_seconds"] >= 0.0
    assert "sandbox_available" in data
    assert isinstance(data["sandbox_available"], bool)
    assert data["execution_enabled"] is False  # Milestone 1 guarantee
    assert data["milestone"] == "Milestone 1: Production-Quality Foundation"
    assert "message" in data


@pytest.mark.asyncio
async def test_health_endpoint_root_path(async_client: AsyncClient):
    """Verify GET /health (for container probes) also returns 200 OK."""
    response = await async_client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


@pytest.mark.asyncio
async def test_root_index(async_client: AsyncClient):
    """Verify GET / returns descriptive service metadata."""
    response = await async_client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "ECHO API"
    assert "tagline" in data
    assert data["health_endpoint"] == "/api/health"
