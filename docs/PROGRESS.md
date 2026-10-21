# ECHO — Engineering Progress & Milestone Tracking

## Current Status: Milestone 2 Complete
- **Date Completed:** October 21, 2026
- **Lead Architect:** Principal Full-Stack & Security Engineer
- **Verdict:** PASS

---

## Milestone 2 Implementation Checklist

### 1. Isolated Execution Sandbox
- [x] Create `backend/runner/Dockerfile` with non-root user `10001:10001`
- [x] Create `backend/runner/trace_runner.py` with `sys.settrace` engine
- [x] Build `echo-runner:latest` container image
- [x] Configure Linux kernel isolation flags (`--network none`, `--read-only`, `--tmpfs /tmp:rw,noexec,nosuid,size=16m`, `--cpus 0.5`, `--memory 128m`, `--pids-limit 64`, `--cap-drop ALL`, `--security-opt no-new-privileges:true`)
- [x] Implement asynchronous container orchestrator (`backend/app/services/sandbox.py`)
- [x] Enforce hard execution timeout with container kill & teardown
- [x] Ensure reliable container cleanup (`docker rm -f`) with zero container leaks
- [x] Concurrency semaphore limiter to avoid Docker daemon exhaustion
- [x] Fallback policy: refuse execution (`sandbox_unavailable`) when Docker is unreachable

### 2. Authoritative Tracing Engine
- [x] Monotonic step indexing and line number mapping
- [x] Scope tracking (`<module>` vs functions)
- [x] Local variable snapshots with safe truncation
- [x] Variable delta tracking (`is_changed` diff)
- [x] Exception event capturing and line location
- [x] Standard output and error capturing (bounded at 64 KB)
- [x] Max step bound (capped at 500 steps)
- [x] Delimited JSON stream output (`<<<ECHO_TRACE_START>>>`)

### 3. API Implementation
- [x] Activate `POST /api/execution/run` returning `ExecutionResponse`
- [x] Handle status states: `completed`, `error`, `timeout`, `trace_limit_exceeded`, `sandbox_unavailable`, `oom_killed`
- [x] Update `/api/health` to reflect live runner readiness (`execution_enabled: true`)

### 4. Frontend Integration
- [x] Enable "Run in Sandbox" button with loading spinner
- [x] Connect `WorkspaceShell` to real API
- [x] Replace default illustrative preview with live authoritative trace steps
- [x] Terminal Output panel for stdout / stderr / duration
- [x] Syntax error state and runtime exception line highlighting
- [x] Step-by-step navigation and variable delta badges
- [x] Preset switcher for acceptance bug, corrected program, and sample demo

### 5. Automated Verification
- [x] Backend tests: 22/22 tests passing (pytest)
- [x] Frontend unit tests: 9/9 tests passing (vitest)
- [x] TypeScript strict type-check: 0 errors
- [x] Playwright E2E browser tests: 10/10 tests passing
- [x] Acceptance demonstration script (`scripts/acceptance-demo.py`): verified live output `33.333333333333336` and `80.0`
