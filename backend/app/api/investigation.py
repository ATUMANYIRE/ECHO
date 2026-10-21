"""Investigation API endpoints for AI diagnosis and safe fix verification."""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.investigation import (
    AIProviderStatus,
    FixVerificationRequest,
    FixVerificationResponse,
    InvestigationRequest,
    InvestigationResponse,
)
from app.services.investigation import InvestigationService
from app.services.sandbox import SandboxService

logger = logging.getLogger("echo.api.investigation")

router = APIRouter(prefix="/investigation", tags=["Investigation"])

# Singletons / Dependency Injections
_sandbox_service = SandboxService()
_investigation_service = InvestigationService(sandbox_service=_sandbox_service)


def get_investigation_service() -> InvestigationService:
    return _investigation_service


@router.get("/status", response_model=AIProviderStatus)
async def get_ai_status(
    service: InvestigationService = Depends(get_investigation_service),
) -> AIProviderStatus:
    """Return live availability and active configuration of the AI provider."""
    return await service.get_provider_status()


@router.post("/analyze", response_model=InvestigationResponse)
async def analyze_failure(
    request: InvestigationRequest,
    service: InvestigationService = Depends(get_investigation_service),
) -> InvestigationResponse:
    """Generate an evidence-grounded diagnosis from execution traces and intent."""
    if not request.code.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Student code cannot be empty.",
        )

    try:
        response = await service.analyze(request)
        return response
    except Exception as e:
        logger.error("Investigation analysis failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Investigation failed: {str(e)}",
        )


@router.post("/verify-fix", response_model=FixVerificationResponse)
async def verify_fix(
    request: FixVerificationRequest,
    service: InvestigationService = Depends(get_investigation_service),
) -> FixVerificationResponse:
    """Safely execute suggested correction in disposable sandbox and compare results."""
    if not request.suggested_code.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Suggested code cannot be empty.",
        )

    try:
        response = await service.verify_suggested_fix(request)
        return response
    except Exception as e:
        logger.error("Fix verification failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fix verification failed: {str(e)}",
        )
