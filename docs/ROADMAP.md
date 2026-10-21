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

## Milestone 3: Interactive Execution Timeline & Variable State Inspection

**Goal:** Empower students to visually step through the recorded execution trace, inspect variable state mutations over time, and correlate code lines with runtime occurrences.

### Scope & Deliverables
1. **Interactive Timeline Controller:**
   - Step scrubber (Play, Pause, Step Next, Step Previous, Jump to Error).
   - Time-travel slider linking directly to line highlighting in the code editor.
2. **Variable State Inspector:**
   - Table and diff view showing which variables changed at each step.
   - Highlighting of mutated values (e.g., indices, accumulator variables, lists).
3. **Execution Call Stack View:**
   - Visualization of active function frames, arguments, and return values.

### Acceptance Criteria
- [ ] Stepping through the timeline highlights the exact Python source line that produced the event.
- [ ] Variable mutations between step $N-1$ and step $N$ are clearly differentiated.
- [ ] Exception events prominently mark the crashing step with stack trace details.
- [ ] Timeline supports keyboard shortcuts (Left/Right arrows, Spacebar) with ARIA compliance.

---

## Milestone 4: AI Root-Cause Diagnostic Engine (Gemini Integration)

**Goal:** Integrate Google Gemini via a server-side provider abstraction to analyze real execution traces against expected student outcomes and generate hypotheses tied directly to trace evidence.

### Scope & Deliverables
1. **Provider Abstraction:** Clean interface (`LLMProvider`) supporting Google Gemini (`gemini-2.5-flash` or `gemini-1.5-pro`) with configurable timeouts and token limits.
2. **Evidence-Grounded Prompting:**
   - Feed only verified execution trace events, student code, and expected behavior.
   - Enforce structured JSON schema output containing:
     - Root-cause summary.
     - Divergence point (exact step index and line number where intent diverged from execution).
     - Conceptual explanation (why the student's mental model diverged).
     - Suggested fix direction without giving away the full answer immediately.
3. **Hypothesis vs. Fact Distinction:**
   - UI clearly separates Authoritative Execution Trace from AI Diagnostic Hypothesis.
   - Every AI statement references a concrete trace step or code line.

### Acceptance Criteria
- [ ] Structured diagnostic JSON generated from real execution traces.
- [ ] AI explanation identifies the divergence step accurately in standard educational bug benchmark cases.
- [ ] Gemini API key stored exclusively server-side, never returned to client.
- [ ] Graceful fallback and user notification if LLM service is offline or rate-limited.

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
