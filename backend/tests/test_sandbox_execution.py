"""Automated tests for isolated sandbox execution and authoritative tracing."""

import pytest
import asyncio
import shutil
from unittest.mock import patch
from httpx import AsyncClient
from app.services.sandbox import sandbox_service


@pytest.mark.asyncio
async def test_acceptance_program_with_bug(async_client: AsyncClient):
    """Verify acceptance test case from prompt: loop overwriting total instead of accumulating.

    scores = [60, 80, 100]
    total = 0
    for score in scores:
        total = score
    average = total / len(scores)
    print(average)
    """
    code = (
        "scores = [60, 80, 100]\n"
        "total = 0\n"
        "for score in scores:\n"
        "    total = score\n"
        "average = total / len(scores)\n"
        "print(average)\n"
    )

    response = await async_client.post("/api/execution/run", json={"code": code})
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "completed"
    assert "33.333333333333336" in data["stdout"]
    assert data["is_authoritative"] is True
    assert data["total_steps"] > 0

    # Inspect variable changes
    steps = data["steps"]
    # Check that total takes values 0, 60, 80, 100
    totals_observed = [
        s["locals_snapshot"]["total"]["repr_value"]
        for s in steps
        if "total" in s["locals_snapshot"]
    ]
    assert "0" in totals_observed
    assert "60" in totals_observed
    assert "80" in totals_observed
    assert "100" in totals_observed

    # Check line 4 overwrites total
    line_4_steps = [s for s in steps if s["line_number"] == 4]
    assert len(line_4_steps) == 3


@pytest.mark.asyncio
async def test_acceptance_program_corrected(async_client: AsyncClient):
    """Verify corrected acceptance program using total += score produces 80.0."""
    code = (
        "scores = [60, 80, 100]\n"
        "total = 0\n"
        "for score in scores:\n"
        "    total += score\n"
        "average = total / len(scores)\n"
        "print(average)\n"
    )

    response = await async_client.post("/api/execution/run", json={"code": code})
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "completed"
    assert "80.0" in data["stdout"]

    steps = data["steps"]
    final_avg = [
        s["locals_snapshot"]["average"]["repr_value"]
        for s in steps
        if "average" in s["locals_snapshot"]
    ]
    assert "80.0" in final_avg


@pytest.mark.asyncio
async def test_syntax_error_reported(async_client: AsyncClient):
    """Syntax error must report error status, line, and message without executing."""
    code = "def broken(:\n    pass\n"
    response = await async_client.post("/api/execution/run", json={"code": code})
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "error"
    assert data["error_type"] == "SyntaxError"
    assert data["error_line"] == 1
    assert "SyntaxError" in data["error_message"]
    assert len(data["steps"]) == 0


@pytest.mark.asyncio
async def test_runtime_exception_zero_division(async_client: AsyncClient):
    """ZeroDivisionError must be recorded at exact line with exception event."""
    code = (
        "a = 10\n"
        "b = 0\n"
        "c = a / b\n"
    )
    response = await async_client.post("/api/execution/run", json={"code": code})
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "error"
    assert "ZeroDivisionError" in data["error_message"]

    # Verify exception step exists
    exception_steps = [s for s in data["steps"] if s["event_type"] == "exception"]
    assert len(exception_steps) > 0
    assert exception_steps[-1]["line_number"] == 3
    assert "ZeroDivisionError" in exception_steps[-1]["exception"]


@pytest.mark.asyncio
async def test_runtime_exception_index_error(async_client: AsyncClient):
    """IndexError must be recorded when indexing past list boundary."""
    code = (
        "items = ['apple', 'banana']\n"
        "val = items[5]\n"
    )
    response = await async_client.post("/api/execution/run", json={"code": code})
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "error"
    assert "IndexError" in data["error_message"]


@pytest.mark.asyncio
async def test_function_calls_and_returns(async_client: AsyncClient):
    """Function call and return events must be traced with scopes."""
    code = (
        "def multiply(x, y):\n"
        "    return x * y\n"
        "result = multiply(4, 5)\n"
    )
    response = await async_client.post("/api/execution/run", json={"code": code})
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "completed"
    func_steps = [s for s in data["steps"] if s["function_name"] == "multiply"]
    assert len(func_steps) > 0
    # Last step in function scope should return 20
    assert any(s["event_type"] == "return" for s in func_steps)


@pytest.mark.asyncio
async def test_variable_delta_tracking(async_client: AsyncClient):
    """Verify is_changed flag is True on mutation and False when unchanged."""
    code = (
        "x = 10\n"
        "y = 20\n"
        "x = 15\n"
        "print(x, y)\n"
    )
    response = await async_client.post("/api/execution/run", json={"code": code})
    assert response.status_code == 200
    data = response.json()

    steps = data["steps"]
    # Line 2 reached: x was initialized at line 1 -> is_changed True
    step_line2 = next(s for s in steps if s["line_number"] == 2 and "x" in s["locals_snapshot"])
    assert step_line2["locals_snapshot"]["x"]["is_changed"] is True

    # Line 3 reached: y was initialized at line 2 -> y is_changed True, x unchanged -> x is_changed False
    step_line3 = next(s for s in steps if s["line_number"] == 3 and "x" in s["locals_snapshot"])
    assert step_line3["locals_snapshot"]["x"]["is_changed"] is False
    assert step_line3["locals_snapshot"]["y"]["is_changed"] is True

    # Line 4 reached: x was mutated at line 3 to 15 -> x is_changed True
    step_line4 = next(s for s in steps if s["line_number"] == 4 and "x" in s["locals_snapshot"])
    assert step_line4["locals_snapshot"]["x"]["is_changed"] is True
    assert step_line4["locals_snapshot"]["x"]["repr_value"] == "15"


@pytest.mark.asyncio
async def test_infinite_loop_timeout(async_client: AsyncClient):
    """Infinite loops must terminate strictly within timeout limit."""
    code = "while True:\n    pass\n"
    start_t = asyncio.get_event_loop().time()
    response = await async_client.post("/api/execution/run", json={"code": code})
    elapsed = asyncio.get_event_loop().time() - start_t

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "timeout"
    assert "timed out" in data["error_message"].lower()
    # Must terminate reasonably close to timeout
    assert elapsed <= 7.0


@pytest.mark.asyncio
async def test_excessive_output_bounded(async_client: AsyncClient):
    """Excessive stdout must be capped at 64 KB with truncation banner."""
    code = "print('A' * 80000)\n"
    response = await async_client.post("/api/execution/run", json={"code": code})
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "completed"
    assert len(data["stdout"]) <= 65536 + 200
    assert "[Standard output truncated" in data["stdout"]


@pytest.mark.asyncio
async def test_trace_step_limit_exceeded(async_client: AsyncClient):
    """Executions exceeding 500 steps must cleanly terminate with trace_limit_exceeded."""
    code = (
        "count = 0\n"
        "for i in range(1000):\n"
        "    count += 1\n"
    )
    response = await async_client.post("/api/execution/run", json={"code": code})
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "trace_limit_exceeded"
    assert "step limit" in data["error_message"].lower()
    assert len(data["steps"]) == 500


@pytest.mark.asyncio
async def test_network_isolation_blocked(async_client: AsyncClient):
    """Outbound socket creation must fail with Network is unreachable."""
    code = (
        "import socket\n"
        "s = socket.create_connection(('8.8.8.8', 53), timeout=1)\n"
    )
    response = await async_client.post("/api/execution/run", json={"code": code})
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "error"
    assert ("Network is unreachable" in data["error_message"] or "OSError" in data["error_message"])


@pytest.mark.asyncio
async def test_filesystem_write_blocked(async_client: AsyncClient):
    """Writing to root or system directories must fail with Permission denied."""
    code = (
        "with open('/root/test.txt', 'w') as f:\n"
        "    f.write('forbidden')\n"
    )
    response = await async_client.post("/api/execution/run", json={"code": code})
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "error"
    assert "Permission" in data["error_message"]


@pytest.mark.asyncio
async def test_concurrent_execution_requests(async_client: AsyncClient):
    """Multiple concurrent execution requests must complete without deadlocks."""
    codes = [
        f"x = {i}\ny = x * 2\nprint(y)"
        for i in range(3)
    ]

    tasks = [
        async_client.post("/api/execution/run", json={"code": c})
        for c in codes
    ]
    responses = await asyncio.gather(*tasks)

    for i, res in enumerate(responses):
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "completed"
        assert str(i * 2) in data["stdout"]


@pytest.mark.asyncio
async def test_sandbox_unavailable_fallback(async_client: AsyncClient):
    """When Docker is unavailable, execution must safely refuse rather than run on host."""
    with patch.object(sandbox_service, "check_sandbox_available", return_value=False):
        response = await async_client.post(
            "/api/execution/run",
            json={"code": "print('never run on host')"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "sandbox_unavailable"
        assert "strictly prohibited" in data["error_message"]
        assert data["is_authoritative"] is False


@pytest.mark.asyncio
async def test_off_by_one_benchmark_program(async_client: AsyncClient):
    """Verify Benchmark Program 2: Off-by-one list boundary raising IndexError."""
    code = (
        "items = ['alpha', 'beta', 'gamma']\n"
        "for i in range(len(items) + 1):\n"
        "    print(f'Item {i}: {items[i]}')\n"
    )
    response = await async_client.post("/api/execution/run", json={"code": code})
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "error"
    assert "IndexError" in data["error_message"]
    assert "Item 0: alpha" in data["stdout"]
    assert "Item 1: beta" in data["stdout"]
    assert "Item 2: gamma" in data["stdout"]
    exc_steps = [s for s in data["steps"] if s["event_type"] == "exception"]
    assert len(exc_steps) > 0
    assert exc_steps[-1]["line_number"] == 3


@pytest.mark.asyncio
async def test_recursive_factorial_benchmark_program(async_client: AsyncClient):
    """Verify Benchmark Program 3: Recursive function frames and call stack returns."""
    code = (
        "def factorial(n):\n"
        "    if n <= 1:\n"
        "        return 1\n"
        "    return n * factorial(n - 1)\n"
        "\n"
        "result = factorial(4)\n"
        "print(f'4! = {result}')\n"
    )
    response = await async_client.post("/api/execution/run", json={"code": code})
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "completed"
    assert "4! = 24" in data["stdout"]
    steps = data["steps"]
    factorial_steps = [s for s in steps if s["function_name"] == "factorial"]
    assert len(factorial_steps) > 0
    return_steps = [s for s in factorial_steps if s["event_type"] == "return"]
    assert len(return_steps) == 4
