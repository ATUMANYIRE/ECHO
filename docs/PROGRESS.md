# ECHO — Engineering Progress & Milestone Tracking

## Current Status: Milestone 4 Complete
- **Date Completed:** October 21, 2026
- **Lead Architect:** Principal Full-Stack & Security Engineer
- **Verdict:** PASS

---

## Milestone 4 Implementation Checklist

### 1. AI Provider Abstraction & Official Google GenAI SDK
- [x] Integrate official `google-genai` SDK v2.32.0 (`from google import genai`)
- [x] Configure server-side `GEMINI_API_KEY` via `pydantic-settings`; zero secrets committed or exposed
- [x] Verified live Google Gemini connectivity with active working model `gemini-3.5-flash-lite`
- [x] Model candidate fallback chain (`gemini-3.5-flash-lite`, `gemini-3.5-flash`, `gemini-3.6-flash`, `gemini-flash-lite-latest`) with configurable timeouts (20s) and bounded retries
- [x] Deterministic mock provider (`MockDeterministicProvider`) for offline evaluation and quota preservation
- [x] Dynamic AI provider status endpoint (`GET /api/investigation/status`)
- [x] Distinct badging in API response and UI: `is_live_ai` vs `model_identifier`

### 2. Evidence-Grounded Diagnostic API (`POST /api/investigation/analyze`)
- [x] Strongly typed Pydantic v2 schemas (`InvestigationRequest`, `InvestigationResponse`)
- [x] Server-side Evidence Citation Validator (`validate_evidence_citations`)
- [x] Strips hallucinated/out-of-range steps and non-existent line numbers
- [x] Adds transparent notices to `validation_warnings` when citations are filtered
- [x] Demotes `evidence_sufficiency` to `"insufficient"` when citations or traces are empty
- [x] Generates root-cause hypothesis, conceptual explanation, proposed correction, and learning challenges

### 3. Docker Sandbox Fix Verification (`POST /api/investigation/verify-fix`)
- [x] Executes untrusted proposed corrections strictly inside disposable Docker containers
- [x] Assesses output against student expected behavior
- [x] Mandates epistemological disclaimer: *"Passing observed checks verifies behavior for tested inputs but does not prove universal algorithm correctness."*
- [x] Zero execution on host machine

### 4. Prompt Injection Resistance
- [x] Input delimiters (`<<<STUDENT_CODE_UNTRUSTED>>>`, `<<<EXPECTED_BEHAVIOR_UNTRUSTED>>>`, `<<<EXECUTION_TRACE_DATA>>>`)
- [x] System prompt explicitly enforces untrusted handling of code comments, strings, and expected behavior
- [x] Tested against `# SYSTEM OVERRIDE`, variable leak attempts, and instruction injection

### 5. 14-Case Evaluation Benchmark (`test_ai_evaluation.py`)
- [x] 12 Bug Categories tested and passing:
  1. Accumulator Overwrite (`total = score`)
  2. Off-by-one Boundary (`range(len(items) + 1)`)
  3. Loop Condition (`while count > 0`)
  4. Relational Operator Inversion (`<` vs `>`)
  5. Integer Division Truncation (`//` vs `/`)
  6. Mutable Default / Aliasing
  7. Missing Function Return (`None`)
  8. Recursion Base Case Missing
  9. Unhandled IndexError
  10. Unhandled KeyError
  11. Unhandled ZeroDivisionError
  12. Intent Violation (Clean run, wrong business outcome)
- [x] 2 Edge Cases tested and passing:
  13. Ambiguous Intent (correctly flags `ambiguous`)
  14. Insufficient Trace Evidence (correctly flags `insufficient`)

### 6. Interactive Frontend AI Investigation Experience
- [x] "Investigate with AI" button in `ControlBar.tsx` with loading state
- [x] AI Diagnosis tab in `ExecutionTimelinePane.tsx` with dedicated `InvestigationPane.tsx`
- [x] Root-Cause Hypothesis card with model badge and sufficiency badge
- [x] Clickable evidence citation step pills (e.g., `Step #2`) jumping timeline scrubber and highlighting editor lines without tab jumping
- [x] Proposed correction with diff viewer
- [x] "Verify Fix in Sandbox" action with live Docker container execution and disclaimer banner
- [x] "Apply to Editor" action updating editor code
- [x] Multi-tab Learning Challenges: Prediction question, Conceptual comprehension question, Coding challenge with interactive selection and explanations

### 7. Automated Test Verification
- [x] Backend tests: 46/46 tests passing (pytest)
- [x] Frontend unit tests: 19/19 tests passing (vitest)
- [x] TypeScript strict type-check: 0 errors (`tsc --noEmit`)
- [x] Playwright E2E browser tests: 14/14 tests passing across Desktop and Mobile Chrome
- [x] Visual artifacts captured: `desktop-investigation-m4.png` and `mobile-investigation-m4.png`

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
