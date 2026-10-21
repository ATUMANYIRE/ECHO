# ECHO — AI-Powered Educational Debugging Laboratory

> **Tagline:** *Don't just fix the mistake. Understand the moment it was made.*  
> **GLITCHATHON 2026 Submission** | Target Deadline: October 25, 2026, 13:30 GMT+2  
> **Current Status:** Milestone 2 Complete (Secure Execution & Real-Time Code Tracing)

---

## 1. What is ECHO?

ECHO helps computer science students understand **why** and **when** their code fails. Instead of relying on simulated AI guesses or passive static analysis, ECHO operates on a non-negotiable principle:

> **Execution evidence is authoritative. AI explanations are hypotheses until supported by evidence.**

When a student submits code:
1. Untrusted code executes inside an isolated, disposable Docker container (`echo-runner`).
2. Authoritative execution events and local variable mutations are captured step-by-step using `sys.settrace`.
3. Students navigate an interactive execution timeline to scrub across state mutations and line executions.
4. AI analyzes the divergence between the student's expected outcome and the authoritative trace to explain the root misconception without hallucinations (Milestone 4).
5. Targeted comprehension micro-quizzes verify student understanding (Milestone 5).

---

## 2. Milestone 2 Scope & Status

Milestone 2 activates genuine, secure code execution and tracing:
- **Disposable Container Runner:** Ephemeral Docker runner (`echo-runner:latest`) running non-root (`10001:10001`), network disabled (`--network none`), read-only rootfs, `noexec` tmpfs, CPU/memory limits, and hard execution timeouts.
- **Authoritative Trace Recorder:** Real-time line events, call/return frames, runtime exceptions, stdout deltas, and local variable diffs (`is_changed`).
- **Activated API:** `POST /api/execution/run` accepts Python source code and returns verified execution traces.
- **Live Frontend Integration:** Code editor and "Run in Sandbox" button execute real student code; execution timeline updates with genuine traces; Terminal Output panel displays stdout/stderr/durations.
- **Fail-Safe Policy:** If Docker is unavailable, the API explicitly refuses execution (`sandbox_unavailable`) rather than executing untrusted code on the host.
- **Full Test Harness:** 41 passing automated tests across backend (`pytest`), frontend unit (`vitest`), and Playwright browser E2E suites.

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
- **Milestone 1 Guarantee:** Untrusted code execution is disabled by design in Milestone 1; the timeline visualizes explicitly labeled sample data.

---

## 8. Repository Documentation Index

- [`docs/ROADMAP.md`](file:///E:/Projects/ECHO/docs/ROADMAP.md) — 5-Milestone roadmap with measurable acceptance criteria
- [`docs/ARCHITECTURE.md`](file:///E:/Projects/ECHO/docs/ARCHITECTURE.md) — System architecture, component boundaries, and contracts
- [`docs/SECURITY.md`](file:///E:/Projects/ECHO/docs/SECURITY.md) — Security model, threat analysis, and container sandbox specs
- [`docs/TESTING.md`](file:///E:/Projects/ECHO/docs/TESTING.md) — Verification procedures and test matrices
- [`docs/PROGRESS.md`](file:///E:/Projects/ECHO/docs/PROGRESS.md) — Implementation progress and audit log
- [`AGENTS.md`](file:///E:/Projects/ECHO/AGENTS.md) — Autonomous engineer guidelines and core invariants
