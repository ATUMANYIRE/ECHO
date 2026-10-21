"""Pydantic schemas for execution requests, trace steps, and diagnostics."""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from enum import Enum
import uuid


class ExecutionStatus(str, Enum):
    COMPLETED = "completed"
    TIMEOUT = "timeout"
    ERROR = "error"
    TRACE_LIMIT_EXCEEDED = "trace_limit_exceeded"
    SANDBOX_UNAVAILABLE = "sandbox_unavailable"
    OOM_KILLED = "oom_killed"


class VariableSnapshot(BaseModel):
    """Snapshot of a local variable at a specific execution step."""

    name: str
    type_name: str
    repr_value: str
    is_changed: bool = False


class TraceStep(BaseModel):
    """A single verified execution event recorded by the tracer."""

    step_index: int = Field(..., description="0-based monotonic step index")
    line_number: int = Field(..., description="1-based source code line executed")
    event_type: str = Field(..., description="Event type: 'line', 'call', 'return', 'exception'")
    function_name: str = Field(default="<module>", description="Current function scope")
    locals_snapshot: Dict[str, VariableSnapshot] = Field(
        default_factory=dict, description="Variables in the current frame"
    )
    stdout_delta: str = Field(default="", description="Any standard output emitted during this step")
    exception: Optional[str] = Field(default=None, description="Exception message if one was raised")


class ExecutionRequest(BaseModel):
    """Request payload for student code execution."""

    code: str = Field(..., min_length=1, max_length=10000, description="Python 3 source code")
    expected_behavior: str = Field(
        default="",
        max_length=2000,
        description="Student's explanation of what the program should do",
    )


class ExecutionResponse(BaseModel):
    """Result of an isolated execution run."""

    execution_id: str = Field(default_factory=lambda: uuid.uuid4().hex[:12])
    status: ExecutionStatus
    total_steps: int = 0
    duration_ms: float = 0.0
    stdout: str = ""
    stderr: str = ""
    steps: List[TraceStep] = Field(default_factory=list)
    error_message: Optional[str] = None
    error_type: Optional[str] = None
    error_line: Optional[int] = None
    error_offset: Optional[int] = None
    termination_reason: Optional[str] = None
    is_authoritative: bool = Field(
        default=True,
        description="True if captured from real sandbox execution. False if simulated.",
    )
    executed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
