"""Execution endpoints.

NOTE: In Milestone 1, execution is strictly disabled.
This endpoint validates the payload format and returns an explicit 501 status,
ensuring that untrusted execution is never simulated or run insecurely on the host.
"""

from fastapi import APIRouter, HTTPException, status
from app.schemas.execution import ExecutionRequest, ExecutionResponse, ExecutionStatus

router = APIRouter(prefix="/execution", tags=["Execution"])


@router.post(
    "/run",
    response_model=ExecutionResponse,
    status_code=status.HTTP_501_NOT_IMPLEMENTED,
    responses={
        501: {
            "description": "Code execution engine is disabled in Milestone 1.",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Untrusted code execution is disabled in Milestone 1. Isolated Docker sandbox runner will be introduced in Milestone 2."
                    }
                }
            },
        }
    },
)
async def run_code(request: ExecutionRequest):
    """Refuse execution and report milestone boundary."""
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail=(
            "Untrusted code execution is disabled in Milestone 1. "
            "Isolated Docker sandbox runner will be introduced in Milestone 2."
        ),
    )
