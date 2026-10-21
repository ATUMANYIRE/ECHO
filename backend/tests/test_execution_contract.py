"""Tests for execution API contract and Milestone 1 boundary."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_execution_endpoint_not_implemented_in_milestone_1(async_client: AsyncClient):
    """Execution endpoint must return 501 Not Implemented in Milestone 1."""
    payload = {
        "code": "def find_max(numbers):\n    return max(numbers)",
        "expected_behavior": "Should return maximum number in list",
    }
    response = await async_client.post("/api/execution/run", json=payload)
    assert response.status_code == 501
    data = response.json()
    assert "Milestone 1" in data["detail"]
    assert "Milestone 2" in data["detail"]


@pytest.mark.asyncio
async def test_execution_endpoint_validates_empty_code(async_client: AsyncClient):
    """Empty code payload should be rejected with 422 Unprocessable Entity."""
    payload = {"code": "", "expected_behavior": "Nothing"}
    response = await async_client.post("/api/execution/run", json=payload)
    assert response.status_code == 422
