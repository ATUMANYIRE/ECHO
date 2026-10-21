"""ECHO AI Investigation & Safe Correction Verification Service.

Coordinates AI provider diagnostics, validates evidence citations against verified traces,
and securely evaluates suggested corrections in disposable Docker execution sandboxes.
"""

import logging
from typing import List, Tuple
from app.config import settings
from app.schemas.execution import ExecutionResponse
from app.schemas.investigation import (
    AIProviderStatus,
    FixVerificationRequest,
    FixVerificationResponse,
    InvestigationRequest,
    InvestigationResponse,
)
from app.services.ai_provider import (
    BaseLLMProvider,
    GeminiProvider,
    MockDeterministicProvider,
    get_ai_provider,
)
from app.services.sandbox import SandboxService

logger = logging.getLogger("echo.investigation")


class InvestigationService:
    def __init__(self, sandbox_service: SandboxService):
        self.sandbox = sandbox_service
        self.provider, self.is_live_configured = get_ai_provider()

    async def get_provider_status(self) -> AIProviderStatus:
        """Query availability of the active AI diagnostic backend."""
        try:
            status_dict = await self.provider.check_availability()
            is_avail = status_dict.get("available", False)
            return AIProviderStatus(
                is_configured=self.is_live_configured,
                is_available=is_avail,
                provider_name="google-genai" if self.is_live_configured else "mock-deterministic",
                configured_model=settings.gemini_model,
                active_model=status_dict.get("model", settings.gemini_model),
                message=(
                    f"Live Gemini AI active ({settings.gemini_model})"
                    if self.is_live_configured and is_avail
                    else (
                        "GEMINI_API_KEY is not configured. Running in verified deterministic mock mode."
                        if not self.is_live_configured
                        else f"Gemini API check failed: {status_dict.get('reason', 'Unknown error')}"
                    )
                ),
            )
        except Exception as e:
            logger.error("AI provider check error: %s", e)
            return AIProviderStatus(
                is_configured=self.is_live_configured,
                is_available=False,
                provider_name="error",
                configured_model=settings.gemini_model,
                active_model="none",
                message=f"Error checking AI provider: {str(e)}",
            )

    def validate_evidence_citations(
        self, response: InvestigationResponse, request: InvestigationRequest
    ) -> InvestigationResponse:
        """Server-side verification of AI evidence claims.

        Ensures every cited step index actually exists in the trace, and every
        cited source line actually exists in the student's code. Filters out
        any hallucinated references and adds transparent warnings.
        """
        valid_steps: List[int] = []
        warnings: List[str] = list(response.validation_warnings)
        num_trace_steps = len(request.execution.steps)

        for step_idx in response.supporting_step_indices:
            if 0 <= step_idx < num_trace_steps:
                valid_steps.append(step_idx)
            else:
                warnings.append(
                    f"Hallucinated step reference filtered: Step #{step_idx} does not exist in trace (max step is #{num_trace_steps - 1})."
                )

        valid_lines: List[int] = []
        total_code_lines = len(request.code.splitlines())
        for line_no in response.relevant_lines:
            if 1 <= line_no <= max(1, total_code_lines):
                valid_lines.append(line_no)
            else:
                warnings.append(
                    f"Invalid line reference filtered: Line {line_no} does not exist in source code ({total_code_lines} lines total)."
                )

        response.supporting_step_indices = valid_steps
        response.relevant_lines = valid_lines
        response.validation_warnings = warnings
        return response

    async def analyze(
        self, request: InvestigationRequest
    ) -> InvestigationResponse:
        """Run evidence-grounded diagnosis with validation and safe fallback."""
        try:
            raw_response = await self.provider.analyze_diagnosis(request)
        except Exception as e:
            logger.warning("Primary AI diagnosis failed: %s. Falling back to deterministic engine.", e)
            fallback = MockDeterministicProvider()
            raw_response = await fallback.analyze_diagnosis(request)
            raw_response.validation_warnings.append(
                f"Live AI provider failed ({str(e)}). Result derived from deterministic evidence engine."
            )
            raw_response.is_live_ai = False

        # Validate that model did not invent missing steps or lines
        verified_response = self.validate_evidence_citations(raw_response, request)
        return verified_response

    async def verify_suggested_fix(
        self, request: FixVerificationRequest
    ) -> FixVerificationResponse:
        """Safely execute the proposed code inside the disposable sandbox and verify results."""
        # 1. Execute original code in sandbox to confirm baseline
        orig_res = await self.sandbox.execute_code(request.original_code)
        orig_out = orig_res.stdout.strip() if orig_res.status == "completed" else (orig_res.error_message or "Error")

        # 2. Execute AI suggested code inside disposable container (Treat as untrusted!)
        verified_res = await self.sandbox.execute_code(request.suggested_code)
        verif_out = verified_res.stdout.strip() if verified_res.status == "completed" else (verified_res.error_message or "Error")

        # 3. Determine if the fix resolved the error and matched expectations
        is_clean_exit = verified_res.status == "completed" and verified_res.error_message is None
        matches_exp = False

        exp = request.expected_behavior.strip().lower()
        if exp and is_clean_exit:
            # Check if expected output is reflected in stdout
            if exp in verif_out.lower() or any(term in verif_out.lower() for term in exp.split() if len(term) > 3):
                matches_exp = True
        elif is_clean_exit and orig_res.status != "completed":
            # Fixed a runtime crash
            matches_exp = True
        elif is_clean_exit and verif_out != orig_out:
            matches_exp = True

        is_verified = is_clean_exit and (matches_exp or verif_out != orig_out)

        summary = (
            f"Verified: Suggested code executed successfully with output: '{verif_out}'."
            if is_verified
            else f"Verification alert: Execution produced '{verif_out}' with status {verified_res.status}."
        )

        return FixVerificationResponse(
            is_verified=is_verified,
            status=verified_res.status,
            original_output=orig_out,
            verified_output=verif_out,
            matches_expectation=matches_exp,
            verification_summary=summary,
            execution=verified_res,
            disclaimer="Passing observed checks verifies behavior for tested inputs but does not prove universal algorithm correctness.",
        )
