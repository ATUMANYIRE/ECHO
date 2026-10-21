# ECHO — Project Roadmap

> **Tagline:** *Don't just fix the mistake. Understand the moment it was made.*  
> **Target:** GLITCHATHON 2026 Submission  
> **Deadline:** October 25, 2026, 13:30 GMT+2  
> **Guiding Principle:** Execution evidence is authoritative. AI explanations are hypotheses until verified by evidence. Never fabricate traces, runtime behavior, test results, or verification claims.

---

## Milestone 1: Production-Quality Foundation (CURRENT)

**Goal:** Establish a robust, production-quality monorepo structure, responsive developer debugging workspace UI shell, typed API contracts, Docker foundations, and test suites without mocking or fabricating real code execution.

### Scope & Deliverables
1. **Repository Layout:** Clean monorepo with `frontend/`, `backend/`, `docs/`, container configuration, and test fixtures.
2. **FastAPI Backend:** Production FastAPI service running Python 3.11+ with Pydantic v2 settings, CORS, and health probe endpoint (`/api/health`).
3. **Next.js Frontend:** Next.js 14+ / React 18+ App Router in TypeScript strict mode with Tailwind CSS.
4. **Light-First Workspace UI:** Clean, warm-white interface (`#FAFAF8`) with restrained indigo/violet accents, avoiding gratuitous hero sections or unnecessary viewport scrolling.
5. **Interactive Editor & Controls:**
   - Syntax-highlighted Python editor with sample bugged program.
   - Expected behavior input area.
   - Run / Investigate action controls with explicit labels indicating execution engine status.
   - Step timeline visualization with prominently marked **illustrative sample data only** (no fabricated runtime claims).
6. **Docker Foundations:** `docker-compose.yml` and isolated container templates.
7. **Automated Testing:** Pytest unit/API tests for backend and Vitest/Testing-Library unit tests for frontend.
8. **Engineering Documentation:** Architecture, Security, Roadmap, Testing, Progress, and AGENTS guidelines.

### Acceptance Criteria
- [x] Backend starts and `/api/health` returns HTTP 200 with service status, version, and sandbox readiness.
- [x] Frontend builds cleanly with zero TypeScript errors under `strict: true`.
- [x] Frontend successfully connects to the backend health endpoint.
- [x] Workspace renders responsively without page overflow or unneeded desktop scrollbars.
- [x] Execution timeline and Run controls explicitly state they represent illustrative preview state; no simulated or fake execution claims exist.
- [x] Pytest suite passes 100%.
- [x] Frontend unit tests pass 100%.
- [x] Zero secrets in source control.

---

## Milestone 2: Isolated Execution & Tracing Service (COMPLETED)

**Goal:** Build a secure, isolated sandbox for untrusted Python execution that records real step-by-step bytecode/line execution events and local variable mutations.

### Scope & Deliverables
1. **Disposable Container Sandbox:**
   - Dedicated runner container using unprivileged user (`runner` / `uid 10001:10001`).
   - Network interface disabled (`--network none`).
   - Read-only root filesystem with ephemeral memory-backed `/tmp` (`tmpfs`).
   - Strict resource limits: 0.5 CPU, 128 MB RAM, 5-second hard timeout, max 64 processes/threads.
   - No Docker socket or host mounts mounted in execution containers.
2. **Authoritative Trace Recorder:**
   - Real Python tracer (`sys.settrace`) capturing line transitions, call/return frames, exception raises, and snapshotting JSON-serializable variable values.
   - Strict size bounds: Max 500 execution steps, max 64 KB stdout/stderr, bounded variable string lengths.
3. **Sandbox Fallback Protection:**
   - If Docker or container isolation is unavailable on the host, the API safely refuses untrusted execution (`sandbox_unavailable`) rather than executing untrusted code on the host interpreter.

### Acceptance Criteria
- [x] Safe execution of valid Python algorithms with 100% genuine trace capture.
- [x] Infinite loops terminate strictly within the configured time limit (<= 5s) with standard timeout error.
- [x] Malicious payloads (filesystem access, socket creation, fork bombs, subprocess spawning) fail safely without leaking host info.
- [x] Non-zero exit codes and runtime exceptions (`IndexError`, `ZeroDivisionError`, `TypeError`) correctly recorded at the exact line of failure.
- [x] Zero execution on host if container runtime is unavailable.
- [x] Frontend successfully submits code and renders real-time authoritative execution traces.
- [x] Live acceptance demonstration program (`scores = [60, 80, 100]`) verified.

---

## Milestone 3: Interactive Execution Timeline & Variable State Inspection (COMPLETED)

**Goal:** Empower students to visually step through recorded execution traces, inspect causal variable state mutations over time, compare two genuine executions side-by-side, and validate their mental model through evidence-grounded prediction challenges.

### Scope & Deliverables
1. **Interactive Timeline & Time-Travel Controller:**
   - Step scrubber (Play, Pause, Step Next, Step Previous, Jump to Start, Jump to Error).
   - Configurable playback speeds (0.5x, 1x, 2x, 4x) and auto-stopping boundary detection.
   - Keyboard shortcuts (`Space` for Play/Pause, `←`/`→` for stepping, `Home`/`End` for boundaries).
   - Time-travel slider synchronizing with editor source line highlighting.
2. **Causal Variable Evolution Interface:**
   - Trajectory chain visualization (`0 → 60 → 80 → 100` vs `0 → 60 → 140 → 240`).
   - Interactive variable selection and state inspection across loop iterations.
   - Clickable trajectory nodes linking back to the exact trace step and editor line.
3. **Before-and-After Side-by-Side Comparison:**
   - Simultaneous comparison of Run A (Baseline/Buggy) vs. Run B (Modified/Corrected).
   - Real stdout and stderr diffing with divergence callout.
   - Variable trajectory divergence table detecting where states decoupled without index coupling assumptions.
4. **Educational Prediction Challenges:**
   - Checkpoint-based prediction questions derived strictly from genuine execution events.
   - Deterministic validation against actual recorded runtime evidence (zero fabricated claims).
5. **Call Stack Inspection:**
   - Active function frame depth, module/function identifier, and line tracking.

### Acceptance Criteria
- [x] Replay controls step through genuine container traces with dynamic line highlighting.
- [x] Variable histories accurately reflect genuine runtime snapshots and delta transitions.
- [x] Side-by-side comparison identifies stdout differences and variable evolution divergence without assuming identical step indices.
- [x] Prediction challenges validate student predictions strictly against authoritative execution evidence.
- [x] Keyboard shortcuts (`Space`, `←`, `→`, `Home`, `End`) work seamlessly with ARIA compliance.
- [x] Responsive layout functions cleanly on desktop and mobile viewports.
- [x] Verified against three distinct educational benchmark programs:
  1. Accumulator overwrite bug (`scores = [60, 80, 100]`)
  2. Off-by-one boundary bug (`range(len(items) + 1)` -> `IndexError`)
  3. Recursive call stack frames (`factorial(4)` -> nested frames)
- [x] Automated test suite: 24 Pytest backend tests, 13 Vitest frontend unit tests, and 12 Playwright E2E browser tests pass 100%.

---

## Milestone 4: Evidence-Grounded Gemini AI Investigator (COMPLETED)

**Goal:** Integrate Google Gemini via official SDK and server-side provider abstraction to analyze real execution traces against expected student outcomes, rigorously validate evidence citations server-side, resist prompt injections, execute suggested fixes inside disposable Docker containers, and generate multi-modal learning challenges.

### Scope & Deliverables
1. **AI Provider Abstraction & Official SDK:**
   - Server-side `AIProvider` protocol with `GeminiProvider` using the official `google-genai` SDK (v2.32.0).
   - `MockDeterministicProvider` for deterministic fallback and offline evaluation test suites.
   - Server-side API key configuration (`GEMINI_API_KEY`) via `pydantic-settings`; zero secrets leaked to client, logs, or git.
   - Dynamic model availability verification and graceful quota/timeout handling.
2. **Evidence-Grounded Diagnostic API (`POST /api/investigation/analyze`):**
   - Inputs: Python code, expected student behavior, authoritative runtime trace, optional comparison execution.
   - Server-side Evidence Citation Validator: Checks every step index and line number in AI responses against the actual runtime trace. Non-existent citations are stripped and flagged with transparent notices (zero hallucinations).
   - Strict Pydantic v2 structured output schema (`InvestigationResponse`).
3. **Sandbox Fix Verification (`POST /api/investigation/verify-fix`):**
   - Safely executes untrusted AI corrections inside disposable, non-networked Docker containers.
   - Displays clear execution summary with mandatory epistemological disclaimer: *"Passing observed checks verifies behavior for tested inputs but does not prove universal algorithm correctness."*
4. **Prompt-Injection Resistance:**
   - Robust boundary delimiter fences (`<<<STUDENT_CODE_UNTRUSTED>>>`, etc.).
   - Explicit system instruction to treat all code comments, string literals, and user expected behaviors strictly as untrusted user data.
5. **Interactive Frontend Diagnosis Experience:**
   - Root-Cause Hypothesis card and evidence citations.
   - Clickable citation pills (e.g. `Step #2`, `Line 4`) jumping timeline scrubber and highlighting source editor.
   - Proposed correction with diff viewer, "Verify Fix in Sandbox" and "Apply to Editor" actions.
   - Multi-tab Learning Challenges: Prediction, Conceptual Comprehension, and Coding exercise tabs.
   - Clear AI Engine status badge distinguishing live Gemini from verified deterministic mock mode.
6. **14-Case Evaluation Benchmark:**
   - Comprehensive test suite covering 12 bug categories (accumulator overwrite, off-by-one, loop termination, relational invert, integer division truncation, mutable default/aliasing, missing return, recursion base case, unhandled IndexError, unhandled KeyError, unhandled ZeroDivisionError, intent violation) + 2 ambiguous/insufficient trace edge cases.

### Acceptance Criteria
- [x] Structured diagnostic JSON generated from authoritative execution traces.
- [x] Server-side validator filters out hallucinated citations and reports transparent warnings.
- [x] Suggested fixes verified exclusively inside disposable Docker sandboxes with required disclaimer.
- [x] Prompt-injection defenses tested and passing across code comments, string literals, and intent inputs.
- [x] 14 benchmark evaluation cases passing with 100% score against objective criteria.
- [x] AI status endpoint (`GET /api/investigation/status`) dynamically detects configuration state.
- [x] Full automated test suite passing: 46 Pytest backend tests, 19 Vitest frontend unit tests, 14 Playwright E2E browser tests (Desktop & Mobile).
- [x] Zero API keys committed or exposed. Safe mock fallback when live key is absent.

---

## Milestone 5: Comprehension Challenge & Verification Loop

**Goal:** Close the learning loop by prompting students to fix their code, re-verifying execution, and generating targeted conceptual comprehension checks.

### Scope & Deliverables
1. **Rerun & Diff Verification:**
   - Students edit code in response to diagnostic insight and rerun.
   - Side-by-side trace comparison showing how the new execution fixed the divergence point.
2. **Targeted Comprehension Checks:**
   - AI generates dynamic micro-quizzes based on the specific misconception (e.g., "What would happen if `i <= len(arr)` was evaluated with an empty list?").
   - Immediate feedback confirming whether the student truly understood the underlying bug.
3. **End-to-End Production Polish:**
   - Comprehensive Playwright E2E suite covering full user journey.
   - Performance optimizations, WCAG 2.1 AA accessibility audit, and packaging for GLITCHATHON submission.

### Acceptance Criteria
- [ ] Student can rerun modified code and verify whether the error step disappeared.
- [ ] AI generates at least one relevant comprehension question per diagnosed misconception.
- [ ] Full end-to-end user journey verified under automated Playwright tests.
- [ ] Production documentation, deployment guidelines, and video demo artifacts finalized.
