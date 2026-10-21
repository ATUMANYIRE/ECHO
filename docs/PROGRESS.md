# ECHO — Engineering Progress & Milestone Tracking

## Current Status: Milestone 3 Complete
- **Date Completed:** October 21, 2026
- **Lead Architect:** Principal Full-Stack & Security Engineer
- **Verdict:** PASS

---

## Milestone 3 Implementation Checklist

### 1. Interactive Time-Travel Replay
- [x] Play/Pause replay timer with clear button feedback (`ReplayControls.tsx`)
- [x] Step forward (`Next`) and backward (`Prev`)
- [x] Configurable playback speeds (`0.5x`, `1.0x`, `2.0x`, `4.0x`)
- [x] Timeline scrubbing with interactive range slider
- [x] Jump to first exception line button (`Jump to Error`)
- [x] Jump to start / end (`Home` / `End`)
- [x] Full keyboard navigation shortcuts (`Space`, `←`, `→`, `Home`, `End`) with textarea input guard
- [x] Synchronized line highlighting in Python code editor
- [x] Call stack frame viewer (`CallStackView.tsx`) displaying frame name and line number
- [x] Safe unmounting and timer cleanup preventing memory leaks

### 2. Causal Variable Evolution Interface
- [x] Causal trajectory engine (`timeline-analysis.ts:extractVariableMutations`)
- [x] Interactive variable selector dropdown displaying mutation count per variable
- [x] Sequential state evolution chain (e.g., `0 → 60 → 80 → 100` vs `0 → 60 → 140 → 240`)
- [x] Clickable mutation trajectory nodes navigating directly to corresponding trace steps
- [x] Comparison trajectory overlay when baseline/comparison runs are loaded

### 3. Before-and-After Side-by-Side Comparison
- [x] Execution run recorder tracking Run A (Baseline/Initial) and Run B (Comparison/Modified)
- [x] Side-by-side run cards displaying duration, steps, status, and stdout
- [x] Alignment & divergence detection without coupling steps by index
- [x] Variable trajectory divergence table highlighting where states decoupled
- [x] Direct "Load into Timeline" action buttons for inspecting either run

### 4. Educational Investigation & Evidence-Grounded Prediction Mode
- [x] Automated checkpoint challenge generator (`generatePredictionChallenges`)
- [x] Evidence-validated multiple-choice challenges for variable mutations, terminal outputs, and exceptions
- [x] Real-time verification against recorded trace facts (zero simulated AI hallucination)
- [x] Immediate feedback with clickable "Jump to Step in Timeline" link

### 5. Multi-Benchmark Verification
- [x] Benchmark 1: Accumulator overwrite bug (`scores = [60, 80, 100]`, `total = score` vs `total += score`)
- [x] Benchmark 2: Off-by-one boundary index error (`range(len(items) + 1)` -> `IndexError`)
- [x] Benchmark 3: Recursive factorial call stack frames (`factorial(4)` -> nested calls)

### 6. Automated Verification
- [x] Backend tests: 24/24 tests passing (pytest)
- [x] Frontend unit tests: 13/13 tests passing (vitest)
- [x] TypeScript strict type-check: 0 errors (`tsc --noEmit`)
- [x] Playwright E2E browser tests: 12/12 tests passing across Desktop and Mobile Chrome
- [x] Visual artifacts: `desktop-workspace-m3.png` and `mobile-workspace-m3.png` captured

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
