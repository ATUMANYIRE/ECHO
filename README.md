# ECHO — AI-Powered Educational Debugging Laboratory

> **Tagline:** *Don't just fix the mistake. Understand the moment it was made.*  
> **GLITCHATHON 2026 Submission** | Target Deadline: October 25, 2026, 13:30 GMT+2  
> **Current Status:** Milestone 4 Complete (Evidence-Grounded Gemini AI Investigator)

---

## 1. What is ECHO?

ECHO helps computer science students understand **why** and **when** their code fails. Instead of relying on simulated AI guesses or passive static analysis, ECHO operates on a non-negotiable principle:

> **Execution evidence is authoritative. AI explanations are hypotheses until supported by evidence.**

When a student submits code:
1. Untrusted code executes inside an isolated, disposable Docker container (`echo-runner`).
2. Authoritative execution events and local variable mutations are captured step-by-step using `sys.settrace`.
3. Students navigate an interactive time-travel timeline with replay controls (play/pause, speed, scrubber).
4. Students inspect causal variable state trajectories (e.g. `0 → 60 → 80 → 100` vs. `0 → 60 → 140 → 240`).
5. Students compare baseline and modified executions side-by-side with decoupled variable divergence analysis.
6. Students test their mental model with interactive prediction challenges grounded in verified trace facts.
7. AI analyzes the divergence between the student's expected outcome and the authoritative trace via an evidence-grounded engine with strict citation validation (Milestone 4).
8. AI-proposed corrections are verified exclusively inside the Docker sandbox before applying, accompanied by an explicit epistemological disclaimer.

---

## 2. Milestone 4 Scope & Capabilities

Milestone 4 delivers a complete evidence-grounded AI diagnostic and pedagogical engine:
- **Official Google GenAI SDK Provider:** Server-side `GeminiProvider` using official `google-genai` (v2.32.0), reading `GEMINI_API_KEY` exclusively from backend environment configuration. Includes `MockDeterministicProvider` for deterministic offline verification and fallback.
- **Server-Side Evidence Citation Validation:** Strictly enforces that all supporting trace steps and line numbers cited in the AI hypothesis actually exist in the container trace. Hallucinated step citations are automatically filtered with transparent diagnostic notices (zero hallucinations).
- **Sandbox Fix Verification:** Proposed code corrections are safely executed inside disposable Docker runner containers (`POST /api/investigation/verify-fix`) and checked against expected behavior with the required disclaimer: *"Passing observed checks verifies behavior for tested inputs but does not prove universal algorithm correctness."*
- **Prompt-Injection Defense:** Untrusted student code comments, string literals, and student intent strings are bounded by robust delimiter fences (`<<<STUDENT_CODE_UNTRUSTED>>>`) to prevent instruction overriding or secret exfiltration.
- **Interactive Multi-Tab Learning Challenges:** Generates 3-stage post-diagnostic challenges (Trace Prediction, Conceptual Comprehension, and Targeted Coding Exercises) with interactive option checking and explanations.
- **14-Case Evaluation Benchmark:** Comprehensive test suite covering 12 distinct bug archetypes (accumulator overwrite, off-by-one, loop termination, relational invert, integer division truncation, mutable default aliasing, missing return, recursion base case, unhandled exceptions) plus 2 ambiguous/insufficient trace cases.
- **Comprehensive Automated Test Harness (79 Tests Passing):**
  - 46 Pytest backend integration, evaluation benchmark, and prompt-injection tests
  - 19 Vitest frontend unit tests
  - 14 Playwright E2E browser tests (Desktop & Mobile Chrome)
  - 0 TypeScript compiler errors under `strict: true`

---

## 3. Technology Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript (`strict: true`), Tailwind CSS, Lucide Icons.
- **Backend:** Python 3.11+, FastAPI, Uvicorn, Pydantic v2, `pydantic-settings`.
- **Testing:** Pytest & HTTPX (backend), Vitest & React Testing Library (frontend), Playwright (E2E).
- **Isolation / Containerization:** Docker, Docker Compose, Linux namespaces/cgroups (`--network none`, `--read-only`, tmpfs, non-root UID 10001).

---

## 4. Port Configuration

To avoid port collisions on developer workstations:
- **Frontend:** Port `3005` (configurable via `PORT` in `.env.local`)
- **Backend API:** Port `8005` (configurable via `PORT` in `backend/.env`)

---

## 5. Getting Started (Windows 11 PowerShell)

### Prerequisites
- Python 3.11+
- Node.js 18+ & npm
- Docker Desktop (optional for Milestone 1 foundation, required for Milestone 2 sandbox)

### Quick Start (Parallel PowerShell Windows)

#### Window 1: Start Backend API
```powershell
cd E:\Projects\ECHO\backend

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Run FastAPI with auto-reload on port 8005
uvicorn app.main:app --host 127.0.0.1 --port 8005 --reload
```
*Health endpoint is immediately available at: `http://127.0.0.1:8005/api/health`*  
*Swagger API Docs: `http://127.0.0.1:8005/docs`*

#### Window 2: Start Frontend Workspace
```powershell
cd E:\Projects\ECHO\frontend

# Start Next.js development server on port 3005
npm run dev
```
*Open your browser at: `http://localhost:3005`*

---

## 6. Running Automated Tests

Run the automated test runner in PowerShell:

```powershell
cd E:\Projects\ECHO

# Run all test suites
.\scripts\test-all.ps1
```

Or run suites independently:

```powershell
# 1. Backend Pytest Suite (including Docker sandbox tests)
backend\venv\Scripts\pytest backend\tests -v

# 2. Frontend Vitest Suite
npm test --prefix frontend

# 3. TypeScript Strict Type-Check
npm run type-check --prefix frontend

# 4. Playwright Browser E2E Suite
cd frontend; npx playwright test

# 5. Live Acceptance Demonstration Script
backend\venv\Scripts\python scripts\acceptance-demo.py
```

---

## 7. Security Architecture

Detailed specifications are maintained in [`docs/SECURITY.md`](file:///E:/Projects/ECHO/docs/SECURITY.md):
- **Untrusted Student Code:** Never executed on the host interpreter or within the API process.
- **Physical Isolation:** Ephemeral Linux containers with dropped capabilities (`--cap-drop ALL`), non-root execution (`--user 10001:10001`), read-only rootfs, `tmpfs /tmp:size=16m`, and hard memory/CPU/PID bounds.
- **Fail-Safe Policy:** If Docker is unreachable, untrusted execution is explicitly refused rather than falling back to unsafe local execution.
- **Isolation Guarantee:** Untrusted code execution runs exclusively inside disposable, isolated Docker containers with zero network access and strict resource boundaries; all time-travel scrubbing, causal evolution analysis, and prediction challenges operate on genuine container execution traces.

---

## 8. Repository Documentation Index

- [`docs/ROADMAP.md`](file:///E:/Projects/ECHO/docs/ROADMAP.md) — 5-Milestone roadmap with measurable acceptance criteria
- [`docs/ARCHITECTURE.md`](file:///E:/Projects/ECHO/docs/ARCHITECTURE.md) — System architecture, component boundaries, and contracts
- [`docs/SECURITY.md`](file:///E:/Projects/ECHO/docs/SECURITY.md) — Security model, threat analysis, and container sandbox specs
- [`docs/TESTING.md`](file:///E:/Projects/ECHO/docs/TESTING.md) — Verification procedures and test matrices
- [`docs/PROGRESS.md`](file:///E:/Projects/ECHO/docs/PROGRESS.md) — Implementation progress and audit log
- [`AGENTS.md`](file:///E:/Projects/ECHO/AGENTS.md) — Autonomous engineer guidelines and core invariants
