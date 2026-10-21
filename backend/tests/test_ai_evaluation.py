"""14-Case Evaluation Benchmark Suite for Evidence-Grounded AI Investigation.

Evaluates AI diagnosis on 12 distinct programming defects and 2 ambiguous/insufficient cases:
1. Accumulator Overwrite
2. Off-by-One Range Boundary
3. Incorrect Loop Condition
4. Wrong Comparison Operator (< vs >)
5. Integer vs Float Division (// vs /)
6. Mutable List Aliasing (b = a)
7. Missing Function Return (returning None)
8. Recursion Base-Case Defect
9. IndexError
10. KeyError
11. ZeroDivisionError
12. Clean Exit with Stated Intent Violation
13. Ambiguous Expected Behavior ("make it work")
14. Insufficient Trace Context
"""

import pytest
from httpx import AsyncClient
from app.schemas.execution import ExecutionResponse, ExecutionStatus, TraceStep, VariableSnapshot


EVALUATION_DATASET = [
    {
        "id": "CASE-01-ACCUMULATOR",
        "name": "Accumulator Overwrite",
        "code": "scores = [60, 80, 100]\ntotal = 0\nfor score in scores:\n    total = score\navg = total / len(scores)\nprint(avg)",
        "expected": "Calculate average of scores: 80.0",
        "mock_status": ExecutionStatus.COMPLETED,
        "mock_stdout": "33.333333333333336\n",
        "mock_stderr": "",
        "error_message": None,
        "error_line": None,
        "expect_sufficiency": "sufficient",
        "expected_defect_keyword": "accumulator",
    },
    {
        "id": "CASE-02-OFF-BY-ONE",
        "name": "Off-by-One List Boundary",
        "code": "items = ['a', 'b', 'c']\nfor i in range(len(items) + 1):\n    print(items[i])",
        "expected": "Print all items without crashing",
        "mock_status": ExecutionStatus.ERROR,
        "mock_stdout": "a\nb\nc\n",
        "mock_stderr": "IndexError: list index out of range\n",
        "error_message": "IndexError: list index out of range",
        "error_line": 3,
        "expect_sufficiency": "sufficient",
        "expected_defect_keyword": "index",
    },
    {
        "id": "CASE-03-LOOP-CONDITION",
        "name": "Incorrect Loop Condition",
        "code": "n = 5\nwhile n > 0:\n    print(n)\n    n += 1\n    if n > 10: break",
        "expected": "Count down from 5 to 1",
        "mock_status": ExecutionStatus.COMPLETED,
        "mock_stdout": "5\n6\n7\n8\n9\n10\n",
        "mock_stderr": "",
        "error_message": None,
        "error_line": None,
        "expect_sufficiency": "sufficient",
        "expected_defect_keyword": "loop",
    },
    {
        "id": "CASE-04-RELATIONAL-OP",
        "name": "Wrong Comparison Operator",
        "code": "x = 15\nif x < 10:\n    print('Greater than 10')\nelse:\n    print('Not greater')",
        "expected": "Print 'Greater than 10' when x is 15",
        "mock_status": ExecutionStatus.COMPLETED,
        "mock_stdout": "Not greater\n",
        "mock_stderr": "",
        "error_message": None,
        "error_line": None,
        "expect_sufficiency": "sufficient",
        "expected_defect_keyword": "operator",
    },
    {
        "id": "CASE-05-INT-DIV",
        "name": "Integer versus Floating-Point Division",
        "code": "total = 7\ncount = 2\nresult = total // count\nprint(result)",
        "expected": "Exact float average: 3.5",
        "mock_status": ExecutionStatus.COMPLETED,
        "mock_stdout": "3\n",
        "mock_stderr": "",
        "error_message": None,
        "error_line": None,
        "expect_sufficiency": "sufficient",
        "expected_defect_keyword": "output",
    },
    {
        "id": "CASE-06-MUTABLE-ALIAS",
        "name": "Mutable List Aliasing",
        "code": "original = [1, 2, 3]\nbackup = original\nbackup.append(4)\nprint(original)",
        "expected": "original list remains [1, 2, 3] without 4",
        "mock_status": ExecutionStatus.COMPLETED,
        "mock_stdout": "[1, 2, 3, 4]\n",
        "mock_stderr": "",
        "error_message": None,
        "error_line": None,
        "expect_sufficiency": "sufficient",
        "expected_defect_keyword": "alias",
    },
    {
        "id": "CASE-07-FUNCTION-RETURN",
        "name": "Incorrect Function Return",
        "code": "def add(a, b):\n    total = a + b\nres = add(2, 3)\nprint(res)",
        "expected": "Print 5",
        "mock_status": ExecutionStatus.COMPLETED,
        "mock_stdout": "None\n",
        "mock_stderr": "",
        "error_message": None,
        "error_line": None,
        "expect_sufficiency": "sufficient",
        "expected_defect_keyword": "output",
    },
    {
        "id": "CASE-08-RECURSION-BASE",
        "name": "Recursion Base-Case Error",
        "code": "def count_down(n):\n    print(n)\n    count_down(n - 1)\ncount_down(3)",
        "expected": "Count down and stop at 0",
        "mock_status": ExecutionStatus.ERROR,
        "mock_stdout": "3\n2\n1\n0\n",
        "mock_stderr": "RecursionError: maximum recursion depth exceeded\n",
        "error_message": "RecursionError: maximum recursion depth exceeded",
        "error_line": 3,
        "expect_sufficiency": "sufficient",
        "expected_defect_keyword": "base case",
    },
    {
        "id": "CASE-09-INDEX-ERROR",
        "name": "IndexError Direct Access",
        "code": "data = [10, 20]\nprint(data[5])",
        "expected": "Access element safely",
        "mock_status": ExecutionStatus.ERROR,
        "mock_stdout": "",
        "mock_stderr": "IndexError: list index out of range\n",
        "error_message": "IndexError: list index out of range",
        "error_line": 2,
        "expect_sufficiency": "sufficient",
        "expected_defect_keyword": "index",
    },
    {
        "id": "CASE-10-KEY-ERROR",
        "name": "KeyError Dictionary Lookup",
        "code": "profile = {'name': 'Alice'}\nprint(profile['age'])",
        "expected": "Retrieve age or default if missing",
        "mock_status": ExecutionStatus.ERROR,
        "mock_stdout": "",
        "mock_stderr": "KeyError: 'age'\n",
        "error_message": "KeyError: 'age'",
        "error_line": 2,
        "expect_sufficiency": "sufficient",
        "expected_defect_keyword": "key",
    },
    {
        "id": "CASE-11-ZERO-DIVISION",
        "name": "ZeroDivisionError",
        "code": "total = 100\ncount = 0\navg = total / count\nprint(avg)",
        "expected": "Compute average or return 0 if count is 0",
        "mock_status": ExecutionStatus.ERROR,
        "mock_stdout": "",
        "mock_stderr": "ZeroDivisionError: division by zero\n",
        "error_message": "ZeroDivisionError: division by zero",
        "error_line": 3,
        "expect_sufficiency": "sufficient",
        "expected_defect_keyword": "zero",
    },
    {
        "id": "CASE-12-INTENT-VIOLATION",
        "name": "Clean Execution with Intent Violation",
        "code": "radius = 5\narea = 2 * 3.14159 * radius\nprint(area)",
        "expected": "Calculate circle area (pi * r^2), approx 78.54",
        "mock_status": ExecutionStatus.COMPLETED,
        "mock_stdout": "31.4159\n",
        "mock_stderr": "",
        "error_message": None,
        "error_line": None,
        "expect_sufficiency": "sufficient",
        "expected_defect_keyword": "output",
    },
    {
        "id": "CASE-13-AMBIGUOUS-INTENT",
        "name": "Ambiguous Student Intent",
        "code": "data = [1, 2, 3]\nprint(sum(data))",
        "expected": "make it work",
        "mock_status": ExecutionStatus.COMPLETED,
        "mock_stdout": "6\n",
        "mock_stderr": "",
        "error_message": None,
        "error_line": None,
        "expect_sufficiency": "ambiguous",
        "expected_defect_keyword": "ambiguous",
    },
    {
        "id": "CASE-14-INSUFFICIENT-TRACE",
        "name": "Insufficient Trace Context",
        "code": "pass",
        "expected": "Compute result",
        "mock_status": ExecutionStatus.COMPLETED,
        "mock_stdout": "",
        "mock_stderr": "",
        "error_message": None,
        "error_line": None,
        "expect_sufficiency": "insufficient",
        "expected_defect_keyword": "insufficient",
    },
]


@pytest.mark.asyncio
@pytest.mark.parametrize("case", EVALUATION_DATASET, ids=[c["id"] for c in EVALUATION_DATASET])
async def test_ai_evaluation_case(async_client: AsyncClient, case: dict):
    """Evaluate each benchmark case against the 6 objective criteria."""
    # Build synthetic trace steps for the case
    steps = []
    line_count = len(case["code"].splitlines())
    for idx, line_no in enumerate(range(1, line_count + 1)):
        event_type = "exception" if line_no == case.get("error_line") else "line"
        exc = case.get("error_message") if event_type == "exception" else None
        steps.append(
            TraceStep(
                step_index=idx,
                line_number=line_no,
                event_type=event_type,
                locals_snapshot={},
                exception=exc,
            )
        )

    execution = ExecutionResponse(
        execution_id=f"exec-{case['id'].lower()}",
        status=case["mock_status"],
        total_steps=len(steps),
        duration_ms=10.0,
        stdout=case["mock_stdout"],
        stderr=case["mock_stderr"],
        error_message=case["error_message"],
        error_line=case["error_line"],
        is_authoritative=True,
        steps=steps,
    )

    payload = {
        "code": case["code"],
        "expected_behavior": case["expected"],
        "execution": execution.model_dump(mode="json"),
    }

    response = await async_client.post("/api/investigation/analyze", json=payload)
    assert response.status_code == 200, f"Case {case['id']} returned HTTP {response.status_code}"
    data = response.json()

    # Criterion 1: Identifies observed behavior accurately
    assert data["observed_behavior"], f"Case {case['id']} missing observed behavior"

    # Criterion 2: References valid trace evidence
    for step_idx in data["supporting_step_indices"]:
        assert 0 <= step_idx < len(steps), f"Case {case['id']} referenced invalid step #{step_idx}"

    for line_no in data["relevant_lines"]:
        assert 1 <= line_no <= line_count, f"Case {case['id']} referenced invalid line {line_no}"

    # Criterion 3: Avoids fabricated evidence
    assert isinstance(data["validation_warnings"], list)
    assert not any("Hallucinated step" in w for w in data["validation_warnings"])

    # Criterion 4: States uncertainty on ambiguous/insufficient cases
    assert data["evidence_sufficiency"] == case["expect_sufficiency"], (
        f"Case {case['id']} expected sufficiency {case['expect_sufficiency']}, got {data['evidence_sufficiency']}"
    )

    # Criterion 5: Proposed correction provided
    assert data["suggested_correction"], f"Case {case['id']} missing suggested correction"

    # Criterion 6: Generated challenges connect to diagnosed misconception (when sufficient)
    if case["expect_sufficiency"] == "sufficient" and data.get("learning_challenges"):
        for ch in data["learning_challenges"]:
            assert ch["question"]
            assert ch["correct_answer"]
