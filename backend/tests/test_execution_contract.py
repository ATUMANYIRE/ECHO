"""Tests for execution API contract and validation."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_execution_endpoint_returns_typed_response(async_client: AsyncClient):
    """Execution endpoint returns a valid ExecutionResponse schema."""
    payload = {
        "code": "result = 40 + 2\nprint(result)",
        "expected_behavior": "Should calculate 42",
    }
    response = await async_client.post("/api/execution/run", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "execution_id" in data
    assert "steps" in data
    assert "stdout" in data
    assert "duration_ms" in data
    assert data["is_authoritative"] is True


@pytest.mark.asyncio
async def test_execution_endpoint_validates_empty_code(async_client: AsyncClient):
    """Empty code payload should be rejected with 422 Unprocessable Entity."""
    payload = {"code": "", "expected_behavior": "Nothing"}
    response = await async_client.post("/api/execution/run", json=payload)
    assert response.status_code == 422
