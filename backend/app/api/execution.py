"""Execution API endpoints.

Active in Milestone 2: dispatches untrusted Python code to the disposable
Docker container sandbox and returns authoritative runtime traces.
"""

from fastapi import APIRouter, status
from app.schemas.execution import ExecutionRequest, ExecutionResponse
from app.services.sandbox import sandbox_service

router = APIRouter(prefix="/execution", tags=["Execution"])


@router.post(
    "/run",
    response_model=ExecutionResponse,
    status_code=status.HTTP_200_OK,
    summary="Execute Python code in secure isolated sandbox",
    description="Runs student Python code inside an isolated container with sys.settrace tracing.",
)
async def run_code(request: ExecutionRequest) -> ExecutionResponse:
    """Execute student Python code in the isolated sandbox runner."""
    return await sandbox_service.execute_code(request.code)
