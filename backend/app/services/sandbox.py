"""ECHO Isolated Execution Sandbox Service.

Orchestrates disposable Docker containers for untrusted Python execution.
Enforces multi-layer OS containment, process guardrails, timeouts,
and clean container teardown.
"""

import asyncio
import json
import logging
import os
import shutil
import time
import uuid
from typing import Optional, Tuple
from datetime import datetime, timezone

from app.config import settings
from app.schemas.execution import (
    ExecutionResponse,
    ExecutionStatus,
    TraceStep,
    VariableSnapshot,
)

logger = logging.getLogger("echo.sandbox")

DELIMITER_START = "<<<ECHO_TRACE_START>>>"
DELIMITER_END = "<<<ECHO_TRACE_END>>>"


class SandboxService:
    def __init__(self):
        self.semaphore = asyncio.Semaphore(settings.max_concurrent_executions)

    async def check_sandbox_available(self) -> bool:
        """Verify that Docker is accessible and runner image is loaded."""
        docker_bin = shutil.which("docker")
        if not docker_bin:
            return False

        try:
            # Check daemon response
            proc = await asyncio.create_subprocess_exec(
                docker_bin,
                "image",
                "inspect",
                settings.runner_image,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=2.0)
            return proc.returncode == 0
        except Exception as e:
            logger.warning("Sandbox availability check failed: %s", e)
            return False

    async def execute_code(self, code: str) -> ExecutionResponse:
        """Run student code inside a disposable isolated container."""
        # 1. Guard against unavailable sandbox
        is_ready = await self.check_sandbox_available()
        if not is_ready:
            return ExecutionResponse(
                status=ExecutionStatus.SANDBOX_UNAVAILABLE,
                error_message=(
                    "Execution sandbox unavailable: Docker daemon is unreachable or "
                    f"'{settings.runner_image}' is not built. Untrusted execution on the host is strictly prohibited."
                ),
                termination_reason="sandbox_unavailable",
                is_authoritative=False,
            )

        docker_bin = shutil.which("docker")
        if not docker_bin:
            return ExecutionResponse(
                status=ExecutionStatus.SANDBOX_UNAVAILABLE,
                error_message="Docker CLI binary not found on host.",
                termination_reason="docker_not_found",
                is_authoritative=False,
            )

        container_name = f"echo-run-{uuid.uuid4().hex[:12]}"
        docker_args = [
            docker_bin,
            "run",
            "-i",
            "--name",
            container_name,
            "--network",
            "none",
            "--user",
            "10001:10001",
            "--read-only",
            "--tmpfs",
            "/tmp:rw,noexec,nosuid,size=16m",
            "--cpus",
            "0.5",
            "--memory",
            f"{settings.execution_max_memory_mb}m",
            "--memory-swap",
            f"{settings.execution_max_memory_mb}m",
            "--pids-limit",
            "64",
            "--cap-drop",
            "ALL",
            "--security-opt",
            "no-new-privileges:true",
            settings.runner_image,
        ]

        start_time = time.perf_counter()

        async with self.semaphore:
            proc = None
            try:
                proc = await asyncio.create_subprocess_exec(
                    *docker_args,
                    stdin=asyncio.subprocess.PIPE,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                )

                code_bytes = code.encode("utf-8")
                try:
                    stdout_bytes, stderr_bytes = await asyncio.wait_for(
                        proc.communicate(input=code_bytes),
                        timeout=settings.execution_timeout_seconds,
                    )
                except asyncio.TimeoutError:
                    # Enforce hard kill on timeout
                    logger.warning("Execution timed out for container %s", container_name)
                    await self._force_kill_container(docker_bin, container_name)
                    return ExecutionResponse(
                        status=ExecutionStatus.TIMEOUT,
                        duration_ms=round(settings.execution_timeout_seconds * 1000, 2),
                        error_message=(
                            f"Execution timed out after {settings.execution_timeout_seconds}s limit. "
                            "Check for infinite loops or excessive recursion."
                        ),
                        termination_reason="timeout",
                        is_authoritative=True,
                    )

                duration_ms = (time.perf_counter() - start_time) * 1000
                stdout_str = stdout_bytes.decode("utf-8", errors="replace")
                stderr_str = stderr_bytes.decode("utf-8", errors="replace")

                # Handle OOM or abnormal container death (exit code 137)
                if proc.returncode == 137:
                    return ExecutionResponse(
                        status=ExecutionStatus.OOM_KILLED,
                        duration_ms=round(duration_ms, 2),
                        error_message=(
                            f"Container killed: memory limit ({settings.execution_max_memory_mb} MB) exceeded."
                        ),
                        termination_reason="oom_killed",
                        is_authoritative=True,
                    )

                # Parse delimited JSON output from trace runner
                return self._parse_runner_output(stdout_str, stderr_str, duration_ms)

            except Exception as e:
                logger.error("Unexpected error executing code in sandbox: %s", e)
                return ExecutionResponse(
                    status=ExecutionStatus.ERROR,
                    error_message=f"Sandbox execution failed: {str(e)}",
                    termination_reason="internal_error",
                    is_authoritative=True,
                )
            finally:
                # Guarantee container cleanup to prevent orphaned containers
                await self._cleanup_container(docker_bin, container_name)

    def _parse_runner_output(
        self, stdout_str: str, stderr_str: str, duration_ms: float
    ) -> ExecutionResponse:
        """Extract and validate the trace payload between sentinel delimiters."""
        if DELIMITER_START not in stdout_str or DELIMITER_END not in stdout_str:
            # Fallback if delimiters missing (e.g. fatal Python interpreter crash)
            error_msg = stderr_str.strip() or stdout_str.strip() or "Runner process terminated unexpectedly"
            return ExecutionResponse(
                status=ExecutionStatus.ERROR,
                duration_ms=round(duration_ms, 2),
                stdout=stdout_str,
                stderr=stderr_str,
                error_message=error_msg,
                termination_reason="unexpected_termination",
                is_authoritative=True,
            )

        start_idx = stdout_str.find(DELIMITER_START) + len(DELIMITER_START)
        end_idx = stdout_str.find(DELIMITER_END)
        json_segment = stdout_str[start_idx:end_idx].strip()

        try:
            data = json.loads(json_segment)
        except Exception as json_err:
            return ExecutionResponse(
                status=ExecutionStatus.ERROR,
                duration_ms=round(duration_ms, 2),
                error_message=f"Failed to parse trace JSON from runner: {str(json_err)}",
                termination_reason="json_parse_error",
                is_authoritative=True,
            )

        # Reconstruct TraceStep models
        raw_steps = data.get("steps", [])
        steps: list[TraceStep] = []
        for s in raw_steps:
            locals_dict: dict[str, VariableSnapshot] = {}
            for var_name, var_info in s.get("locals_snapshot", {}).items():
                locals_dict[var_name] = VariableSnapshot(
                    name=var_info.get("name", var_name),
                    type_name=var_info.get("type_name", "unknown"),
                    repr_value=var_info.get("repr_value", ""),
                    is_changed=var_info.get("is_changed", False),
                )

            steps.append(
                TraceStep(
                    step_index=s.get("step_index", len(steps)),
                    line_number=s.get("line_number", 1),
                    event_type=s.get("event_type", "line"),
                    function_name=s.get("function_name", "<module>"),
                    locals_snapshot=locals_dict,
                    stdout_delta=s.get("stdout_delta", ""),
                    exception=s.get("exception"),
                )
            )

        status_str = data.get("status", "completed")
        try:
            status = ExecutionStatus(status_str)
        except ValueError:
            status = ExecutionStatus.COMPLETED

        return ExecutionResponse(
            status=status,
            total_steps=len(steps),
            duration_ms=data.get("duration_ms", round(duration_ms, 2)),
            stdout=data.get("stdout", ""),
            stderr=data.get("stderr", ""),
            steps=steps,
            error_message=data.get("error_message"),
            error_type=data.get("error_type"),
            error_line=data.get("error_line"),
            error_offset=data.get("error_offset"),
            termination_reason=status_str,
            is_authoritative=True,
        )

    async def _force_kill_container(self, docker_bin: str, container_name: str):
        """Immediately kill a timed-out container."""
        try:
            kill_proc = await asyncio.create_subprocess_exec(
                docker_bin,
                "kill",
                container_name,
                stdout=asyncio.subprocess.DEVNULL,
                stderr=asyncio.subprocess.DEVNULL,
            )
            await asyncio.wait_for(kill_proc.communicate(), timeout=1.5)
        except Exception:
            pass

    async def _cleanup_container(self, docker_bin: str, container_name: str):
        """Remove container to ensure zero orphaned containers."""
        try:
            rm_proc = await asyncio.create_subprocess_exec(
                docker_bin,
                "rm",
                "-f",
                container_name,
                stdout=asyncio.subprocess.DEVNULL,
                stderr=asyncio.subprocess.DEVNULL,
            )
            await asyncio.wait_for(rm_proc.communicate(), timeout=2.0)
        except Exception:
            pass


sandbox_service = SandboxService()
