"""ECHO Isolated Python Trace Runner.

Executes student Python code under sys.settrace inside a disposable,
non-networked, read-only Docker container.
Emits authoritative execution events, variable snapshots, and execution metadata
as a JSON payload bounded by safety limits.
"""

import sys
import os
import io
import json
import traceback
from typing import Dict, Any, List, Optional

MAX_STEPS = 500
MAX_OUTPUT_BYTES = 64 * 1024  # 64 KB
MAX_REPR_LEN = 250
MAX_CONTAINER_ITEMS = 30

DELIMITER_START = "<<<ECHO_TRACE_START>>>"
DELIMITER_END = "<<<ECHO_TRACE_END>>>"


def safe_repr(val: Any) -> str:
    """Safely represent any value without crashing, hanging, or unbounded memory."""
    try:
        if val is None:
            return "None"
        if isinstance(val, (int, float, bool)):
            return repr(val)
        if isinstance(val, str):
            if len(val) > MAX_REPR_LEN:
                return repr(val[:MAX_REPR_LEN] + "...")
            return repr(val)
        if isinstance(val, (list, tuple, set)):
            type_name = type(val).__name__
            items = list(val)
            if len(items) > MAX_CONTAINER_ITEMS:
                truncated = [safe_repr(x) for x in items[:MAX_CONTAINER_ITEMS]]
                inner = ", ".join(truncated) + f", ... (+{len(items) - MAX_CONTAINER_ITEMS} more)"
            else:
                inner = ", ".join(safe_repr(x) for x in items)
            if isinstance(val, tuple):
                return f"({inner}{',' if len(items) == 1 else ''})"
            if isinstance(val, set):
                return f"{{{inner}}}" if items else "set()"
            return f"[{inner}]"
        if isinstance(val, dict):
            items = list(val.items())
            if len(items) > MAX_CONTAINER_ITEMS:
                truncated = [f"{safe_repr(k)}: {safe_repr(v)}" for k, v in items[:MAX_CONTAINER_ITEMS]]
                inner = ", ".join(truncated) + f", ... (+{len(items) - MAX_CONTAINER_ITEMS} more)"
            else:
                inner = ", ".join(f"{safe_repr(k)}: {safe_repr(v)}" for k, v in items)
            return f"{{{inner}}}"
        # Fallback to standard repr with length bound
        r = repr(val)
        if len(r) > MAX_REPR_LEN:
            return r[:MAX_REPR_LEN] + "..."
        return r
    except Exception:
        return f"<{type(val).__name__} (unprintable)>"


def get_type_name(val: Any) -> str:
    """Return clean type name for value."""
    try:
        return type(val).__name__
    except Exception:
        return "unknown"


# Variables injected by execution harness that should be filtered from student inspection
SYSTEM_VAR_NAMES = {
    "__name__",
    "__doc__",
    "__package__",
    "__loader__",
    "__spec__",
    "__annotations__",
    "__builtins__",
    "__file__",
    "__cached__",
}


class TraceCollector:
    def __init__(self, target_filename: str):
        self.target_filename = target_filename
        self.steps: List[Dict[str, Any]] = []
        self.step_count = 0
        self.limit_exceeded = False
        self.last_locals: Dict[str, str] = {}
        self.stdout_capture = io.StringIO()
        self.stderr_capture = io.StringIO()
        self.last_stdout_pos = 0

    def trace_callback(self, frame, event, arg):
        # Only trace code executing within the target student script
        code_filename = frame.f_code.co_filename
        if code_filename != self.target_filename:
            return None

        if self.step_count >= MAX_STEPS:
            self.limit_exceeded = True
            # Stop tracing once limit is reached
            sys.settrace(None)
            return None

        line_no = frame.f_lineno
        func_name = frame.f_code.co_name

        # Ignore initial module call event at line 0
        if event == "call" and func_name == "<module>":
            return self.trace_callback

        # Capture stdout produced since last step
        current_stdout_val = self.stdout_capture.getvalue()
        stdout_delta = current_stdout_val[self.last_stdout_pos:]
        self.last_stdout_pos = len(current_stdout_val)

        # Snapshot local variables
        raw_locals = frame.f_locals
        locals_snapshot: Dict[str, Dict[str, Any]] = {}
        current_locals_repr: Dict[str, str] = {}

        for k, v in raw_locals.items():
            if k in SYSTEM_VAR_NAMES:
                continue
            r_val = safe_repr(v)
            current_locals_repr[k] = r_val
            is_changed = (k not in self.last_locals) or (self.last_locals[k] != r_val)
            locals_snapshot[k] = {
                "name": k,
                "type_name": get_type_name(v),
                "repr_value": r_val,
                "is_changed": is_changed,
            }

        self.last_locals = current_locals_repr

        # Determine exception details if event is 'exception'
        exception_desc = None
        if event == "exception" and arg:
            exc_type, exc_val, _ = arg
            exception_desc = f"{exc_type.__name__}: {str(exc_val)}"

        step_data = {
            "step_index": self.step_count,
            "line_number": line_no,
            "event_type": event,
            "function_name": func_name,
            "locals_snapshot": locals_snapshot,
            "stdout_delta": stdout_delta,
            "exception": exception_desc,
        }

        self.steps.append(step_data)
        self.step_count += 1

        return self.trace_callback


def main():
    # Read user code from stdin
    try:
        user_code = sys.stdin.read()
    except Exception as e:
        emit_result({
            "status": "error",
            "error_message": f"Failed to read input code: {str(e)}",
            "steps": [],
            "stdout": "",
            "stderr": "",
            "total_steps": 0,
            "duration_ms": 0.0,
            "is_authoritative": True,
        })
        return

    # Check for empty code
    if not user_code.strip():
        emit_result({
            "status": "error",
            "error_message": "Code is empty",
            "steps": [],
            "stdout": "",
            "stderr": "",
            "total_steps": 0,
            "duration_ms": 0.0,
            "is_authoritative": True,
        })
        return

    # 1. Syntax check before tracing
    target_filename = "student_code.py"
    try:
        compiled_code = compile(user_code, target_filename, "exec")
    except SyntaxError as syn_err:
        emit_result({
            "status": "error",
            "error_type": "SyntaxError",
            "error_message": f"SyntaxError: {syn_err.msg} at line {syn_err.lineno}",
            "error_line": syn_err.lineno,
            "error_offset": syn_err.offset,
            "steps": [],
            "stdout": "",
            "stderr": "",
            "total_steps": 0,
            "duration_ms": 0.0,
            "is_authoritative": True,
        })
        return
    except Exception as comp_err:
        emit_result({
            "status": "error",
            "error_type": type(comp_err).__name__,
            "error_message": str(comp_err),
            "steps": [],
            "stdout": "",
            "stderr": "",
            "total_steps": 0,
            "duration_ms": 0.0,
            "is_authoritative": True,
        })
        return

    # 2. Setup tracing environment
    collector = TraceCollector(target_filename)
    orig_stdout = sys.stdout
    orig_stderr = sys.stderr

    sys.stdout = collector.stdout_capture
    sys.stderr = collector.stderr_capture

    global_scope = {
        "__name__": "__main__",
        "__file__": target_filename,
        "__builtins__": __builtins__,
    }

    import time
    start_time = time.perf_counter()
    status = "completed"
    error_message = None

    try:
        sys.settrace(collector.trace_callback)
        exec(compiled_code, global_scope)
    except Exception as runtime_err:
        status = "error"
        exc_type, exc_val, tb = sys.exc_info()
        tb_lines = traceback.format_exception(exc_type, exc_val, tb)
        error_message = "".join(tb_lines[-2:]).strip()

        # Add an explicit exception step if not already recorded
        if collector.steps and collector.steps[-1].get("event_type") != "exception":
            last_line = getattr(runtime_err, "lineno", None)
            if last_line is None:
                # Find line from traceback
                for frame_summary in traceback.extract_tb(tb):
                    if frame_summary.filename == target_filename:
                        last_line = frame_summary.lineno

            collector.steps.append({
                "step_index": collector.step_count,
                "line_number": last_line or (collector.steps[-1]["line_number"] if collector.steps else 1),
                "event_type": "exception",
                "function_name": collector.steps[-1]["function_name"] if collector.steps else "<module>",
                "locals_snapshot": collector.steps[-1]["locals_snapshot"] if collector.steps else {},
                "stdout_delta": "",
                "exception": f"{exc_type.__name__}: {str(exc_val)}",
            })
            collector.step_count += 1
    finally:
        sys.settrace(None)
        duration_ms = (time.perf_counter() - start_time) * 1000

    # Restore stdout/stderr
    sys.stdout = orig_stdout
    sys.stderr = orig_stderr

    if collector.limit_exceeded:
        status = "trace_limit_exceeded"
        error_message = f"Execution exceeded maximum step limit of {MAX_STEPS} steps."

    final_stdout = collector.stdout_capture.getvalue()
    final_stderr = collector.stderr_capture.getvalue()

    if len(final_stdout) > MAX_OUTPUT_BYTES:
        final_stdout = final_stdout[:MAX_OUTPUT_BYTES] + "\n[Standard output truncated: exceeded 64 KB limit]"

    if len(final_stderr) > MAX_OUTPUT_BYTES:
        final_stderr = final_stderr[:MAX_OUTPUT_BYTES] + "\n[Standard error truncated: exceeded 64 KB limit]"

    emit_result({
        "status": status,
        "error_message": error_message,
        "steps": collector.steps,
        "stdout": final_stdout,
        "stderr": final_stderr,
        "total_steps": len(collector.steps),
        "duration_ms": round(duration_ms, 2),
        "is_authoritative": True,
    })


def emit_result(payload: Dict[str, Any]):
    """Output structured JSON payload between unique delimiters to sys.__stdout__."""
    serialized = json.dumps(payload)
    sys.__stdout__.write(f"{DELIMITER_START}\n{serialized}\n{DELIMITER_END}\n")
    sys.__stdout__.flush()


if __name__ == "__main__":
    main()
