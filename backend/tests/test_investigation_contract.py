"""Tests for AI Investigation API contracts, evidence citation validation, and safe fix verification."""

import pytest
from httpx import AsyncClient
from app.schemas.execution import ExecutionResponse, ExecutionStatus, TraceStep, VariableSnapshot


@pytest.fixture
def mock_accumulator_execution():
    """Authoritative execution trace for the accumulator overwrite bug."""
    return ExecutionResponse(
        execution_id="exec-test-accum-1",
        status=ExecutionStatus.COMPLETED,
        total_steps=5,
        duration_ms=12.5,
        stdout="33.333333333333336\n",
        stderr="",
        is_authoritative=True,
        steps=[
            TraceStep(
                step_index=0,
                line_number=1,
                event_type="line",
                function_name="<module>",
                locals_snapshot={},
            ),
            TraceStep(
                step_index=1,
                line_number=2,
                event_type="line",
                function_name="<module>",
                locals_snapshot={
                    "scores": VariableSnapshot(name="scores", type_name="list", repr_value="[60, 80, 100]", is_changed=True),
                },
            ),
            TraceStep(
                step_index=2,
                line_number=3,
                event_type="line",
                function_name="<module>",
                locals_snapshot={
                    "scores": VariableSnapshot(name="scores", type_name="list", repr_value="[60, 80, 100]", is_changed=False),
                    "total": VariableSnapshot(name="total", type_name="int", repr_value="0", is_changed=True),
                },
            ),
            TraceStep(
                step_index=3,
                line_number=4,
                event_type="line",
                function_name="<module>",
                locals_snapshot={
                    "scores": VariableSnapshot(name="scores", type_name="list", repr_value="[60, 80, 100]", is_changed=False),
                    "total": VariableSnapshot(name="total", type_name="int", repr_value="60", is_changed=True),
                    "score": VariableSnapshot(name="score", type_name="int", repr_value="60", is_changed=True),
                },
            ),
            TraceStep(
                step_index=4,
                line_number=5,
                event_type="line",
                function_name="<module>",
                locals_snapshot={
                    "scores": VariableSnapshot(name="scores", type_name="list", repr_value="[60, 80, 100]", is_changed=False),
                    "total": VariableSnapshot(name="total", type_name="int", repr_value="80", is_changed=True),
                    "score": VariableSnapshot(name="score", type_name="int", repr_value="80", is_changed=True),
                },
            ),
        ],
    )


@pytest.mark.asyncio
async def test_investigation_status_endpoint(async_client: AsyncClient):
    """Verify GET /api/investigation/status returns provider metadata."""
    response = await async_client.get("/api/investigation/status")
    assert response.status_code == 200
    data = response.json()
    assert "is_configured" in data
    assert "is_available" in data
    assert "provider_name" in data
    assert "configured_model" in data
    assert "active_model" in data
    assert "message" in data


@pytest.mark.asyncio
async def test_investigation_analyze_endpoint(async_client: AsyncClient, mock_accumulator_execution):
    """Verify POST /api/investigation/analyze returns structured diagnosis and challenges."""
    code = """scores = [60, 80, 100]
total = 0
for score in scores:
    total = score
average = total / len(scores)
print(average)"""

    payload = {
        "code": code,
        "expected_behavior": "Calculate average of scores: 80.0",
        "execution": mock_accumulator_execution.model_dump(mode="json"),
    }

    response = await async_client.post("/api/investigation/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Core diagnosis fields
    assert "investigation_id" in data
    assert data["investigation_id"].startswith("inv-")
    assert "observed_behavior" in data
    assert "expected_behavior" in data
    assert "root_cause_hypothesis" in data
    assert any(
        term in data["root_cause_hypothesis"].lower()
        for term in ("accumulat", "overwrit", "assign", "addition", "sum")
    )
    assert "explanation" in data
    assert "suggested_correction" in data
    assert "total += score" in data["suggested_correction"]
    assert "correction_rationale" in data
    assert "confidence_assessment" in data
    assert data["evidence_sufficiency"] in ("sufficient", "ambiguous", "insufficient")

    # Trace evidence citations
    assert isinstance(data["supporting_step_indices"], list)
    assert isinstance(data["relevant_lines"], list)
    assert len(data["relevant_lines"]) > 0

    # Learning challenges
    assert "learning_challenges" in data
    challenges = data["learning_challenges"]
    assert len(challenges) >= 1
    for ch in challenges:
        assert "id" in ch
        assert ch["challenge_type"] in ("prediction", "conceptual", "coding")
        assert "question" in ch
        assert "correct_answer" in ch
        assert "explanation" in ch


@pytest.mark.asyncio
async def test_investigation_filters_hallucinated_evidence_citations(async_client: AsyncClient, mock_accumulator_execution):
    """Verify server-side evidence citation validation strips out non-existent step IDs."""
    from app.services.investigation import InvestigationService
    from app.services.sandbox import SandboxService
    from app.schemas.investigation import InvestigationRequest, InvestigationResponse, EvidenceSufficiency

    service = InvestigationService(sandbox_service=SandboxService())

    # Create a simulated response with hallucinated step index 999 and line 500
    fake_response = InvestigationResponse(
        investigation_id="test-fake",
        observed_behavior="output test",
        expected_behavior="expect test",
        root_cause_hypothesis="test hypothesis",
        explanation="test explanation",
        supporting_step_indices=[2, 999],  # 999 does not exist in 5-step trace
        relevant_lines=[3, 500],  # 500 does not exist in 6-line code
        suggested_correction="pass",
        correction_rationale="test",
        confidence_assessment="high",
        evidence_sufficiency=EvidenceSufficiency.SUFFICIENT,
    )

    request = InvestigationRequest(
        code="a = 1\nb = 2\nc = 3\nd = 4\ne = 5\nf = 6",
        expected_behavior="test",
        execution=mock_accumulator_execution,
    )

    verified = service.validate_evidence_citations(fake_response, request)
    assert verified.supporting_step_indices == [2]
    assert 999 not in verified.supporting_step_indices
    assert verified.relevant_lines == [3]
    assert 500 not in verified.relevant_lines
    assert any("Hallucinated step reference filtered" in w for w in verified.validation_warnings)
    assert any("Invalid line reference filtered" in w for w in verified.validation_warnings)


@pytest.mark.asyncio
async def test_investigation_empty_code_rejected(async_client: AsyncClient, mock_accumulator_execution):
    """Verify submitting empty code returns HTTP 422 Unprocessable Entity."""
    payload = {
        "code": "   ",
        "expected_behavior": "Do something",
        "execution": mock_accumulator_execution.model_dump(mode="json"),
    }
    response = await async_client.post("/api/investigation/analyze", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_verify_fix_endpoint(async_client: AsyncClient):
    """Verify POST /api/investigation/verify-fix executes suggested code in isolated container."""
    original_code = """scores = [60, 80, 100]
total = 0
for score in scores:
    total = score
print(total / len(scores))"""

    suggested_code = """scores = [60, 80, 100]
total = 0
for score in scores:
    total += score
print(total / len(scores))"""

    payload = {
        "original_code": original_code,
        "suggested_code": suggested_code,
        "expected_behavior": "Output average 80.0",
    }

    response = await async_client.post("/api/investigation/verify-fix", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["is_verified"] is True
    assert data["status"] == "completed"
    assert "80.0" in data["verified_output"]
    assert "33.333333333333336" in data["original_output"]
    assert "Passing observed checks" in data["disclaimer"]
    assert data["execution"]["is_authoritative"] is True
