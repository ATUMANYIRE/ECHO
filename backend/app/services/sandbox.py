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
RUNNER_READY = b"<<<ECHO_RUNNER_READY>>>"
RUNNER_EXECUTING = b"<<<ECHO_RUNNER_EXECUTING>>>"


class SandboxService:
    def __init__(self):
        self.semaphore = asyncio.Semaphore(settings.max_concurrent_executions)

    async def check_sandbox_available(self) -> bool:
        """Verify that Docker is accessible and runner image is loaded."""
        docker_bin = shutil.which("docker")
        if not docker_bin:
            return False

        proc = None
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
            stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=5.0)
            return proc.returncode == 0
        except Exception as e:
            logger.warning("Sandbox availability check failed: %s", e)
            return False
        finally:
            if proc is not None and proc.returncode is None:
                try:
                    proc.kill()
                    await asyncio.wait_for(proc.wait(), timeout=2.0)
                except (ProcessLookupError, asyncio.TimeoutError):
                    logger.warning("Docker image inspection process did not exit cleanly")

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

        async with self.semaphore:
            proc = None
            startup_started = time.perf_counter()
            try:
                proc = await asyncio.create_subprocess_exec(
                    *docker_args,
                    stdin=asyncio.subprocess.PIPE,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                )

                assert proc.stdout is not None and proc.stdin is not None and proc.stderr is not None
                startup_deadline = startup_started + settings.sandbox_startup_timeout_seconds
                try:
                    ready_line = await asyncio.wait_for(
                        proc.stdout.readline(),
                        timeout=max(0.001, startup_deadline - time.perf_counter()),
                    )
                    if ready_line.strip() != RUNNER_READY:
                        stderr_bytes = await proc.stderr.read() if proc.returncode is not None else b""
                        logger.error(
                            "Runner did not become ready: container=%s stdout=%r stderr=%r",
                            container_name, ready_line[:200], stderr_bytes[:500],
                        )
                        return ExecutionResponse(
                            status=ExecutionStatus.SANDBOX_UNAVAILABLE,
                            error_message="Docker runner exited before it was ready. Check backend logs and runner image.",
                            termination_reason="sandbox_startup_failed",
                            is_authoritative=False,
                        )

                    proc.stdin.write(code.encode("utf-8"))
                    await asyncio.wait_for(
                        proc.stdin.drain(),
                        timeout=max(0.001, startup_deadline - time.perf_counter()),
                    )
                    proc.stdin.close()
                    executing_line = await asyncio.wait_for(
                        proc.stdout.readline(),
                        timeout=max(0.001, startup_deadline - time.perf_counter()),
                    )
                    if executing_line.strip() != RUNNER_EXECUTING:
                        logger.error(
                            "Runner did not accept code: container=%s stdout=%r",
                            container_name, executing_line[:200],
                        )
                        return ExecutionResponse(
                            status=ExecutionStatus.SANDBOX_UNAVAILABLE,
                            error_message="Docker runner did not accept the program. Check backend logs and runner image.",
                            termination_reason="sandbox_protocol_error",
                            is_authoritative=False,
                        )
                except asyncio.TimeoutError:
                    logger.error("Docker runner startup timed out: container=%s", container_name)
                    await self._force_kill_container(docker_bin, container_name)
                    return ExecutionResponse(
                        status=ExecutionStatus.SANDBOX_UNAVAILABLE,
                        duration_ms=round((time.perf_counter() - startup_started) * 1000, 2),
                        error_message="Docker runner did not start in time. Student code was not timed out.",
                        termination_reason="sandbox_startup_timeout",
                        is_authoritative=False,
                    )

                startup_ms = (time.perf_counter() - startup_started) * 1000
                execution_started = time.perf_counter()
                logger.info("Docker runner ready: container=%s startup_ms=%.2f", container_name, startup_ms)
                try:
                    stdout_bytes, stderr_bytes = await asyncio.wait_for(
                        proc.communicate(),
                        timeout=settings.execution_timeout_seconds,
                    )
                except asyncio.TimeoutError:
                    logger.warning(
                        "Runner execution deadline reached: container=%s startup_ms=%.2f execution_ms=%.2f",
                        container_name, startup_ms, (time.perf_counter() - execution_started) * 1000,
                    )
                    await self._force_kill_container(docker_bin, container_name)
                    return ExecutionResponse(
                        status=ExecutionStatus.TIMEOUT,
                        duration_ms=round((time.perf_counter() - execution_started) * 1000, 2),
                        error_message=(
                            f"Program execution timed out after the {settings.execution_timeout_seconds}s limit "
                            "after the Docker runner started."
                        ),
                        termination_reason="execution_timeout",
                        is_authoritative=True,
                    )

                execution_ms = (time.perf_counter() - execution_started) * 1000
                stdout_str = stdout_bytes.decode("utf-8", errors="replace")
                stderr_str = stderr_bytes.decode("utf-8", errors="replace")
                logger.info(
                    "Docker runner finished: container=%s startup_ms=%.2f execution_ms=%.2f parse_bytes=%d exit_code=%s",
                    container_name, startup_ms, execution_ms, len(stdout_bytes), proc.returncode,
                )

                # Handle OOM or abnormal container death (exit code 137)
                if proc.returncode == 137:
                    return ExecutionResponse(
                        status=ExecutionStatus.OOM_KILLED,
                        duration_ms=round(execution_ms, 2),
                        error_message=(
                            f"Container killed: memory limit ({settings.execution_max_memory_mb} MB) exceeded."
                        ),
                        termination_reason="oom_killed",
                        is_authoritative=True,
                    )

                # Parse delimited JSON output from trace runner
                parse_started = time.perf_counter()
                response = self._parse_runner_output(stdout_str, stderr_str, execution_ms)
                logger.info(
                    "Docker trace parsed: container=%s parse_ms=%.2f steps=%d status=%s",
                    container_name, (time.perf_counter() - parse_started) * 1000,
                    response.total_steps, response.status.value,
                )
                return response

            except Exception as e:
                logger.exception("Sandbox infrastructure error: container=%s", container_name)
                return ExecutionResponse(
                    status=ExecutionStatus.SANDBOX_UNAVAILABLE,
                    error_message=f"Sandbox infrastructure failed: {str(e)}",
                    termination_reason="sandbox_internal_error",
                    is_authoritative=False,
                )
            finally:
                if proc is not None and proc.returncode is None:
                    try:
                        proc.kill()
                        await asyncio.wait_for(proc.wait(), timeout=2.0)
                    except ProcessLookupError:
                        pass
                    except asyncio.TimeoutError:
                        logger.warning("Docker CLI did not exit after kill: container=%s", container_name)
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
