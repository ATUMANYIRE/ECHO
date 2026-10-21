# ECHO — AI-Powered Educational Debugging Laboratory

> **Tagline:** *Don't just fix the mistake. Understand the moment it was made.*  
> **GLITCHATHON 2026 Submission** | Target Deadline: October 25, 2026, 13:30 GMT+2  
> **Current Status:** Milestone 1 Complete (Production-Quality Foundation)

---

## 1. What is ECHO?

ECHO helps computer science students understand **why** and **when** their code fails. Instead of relying on simulated AI guesses or passive static analysis, ECHO operates on a non-negotiable principle:

> **Execution evidence is authoritative. AI explanations are hypotheses until supported by evidence.**

When a student submits code:
1. Untrusted code executes inside an isolated, disposable container environment (Milestone 2).
2. Authoritative execution events and local variable mutations are captured step-by-step.
3. Students navigate an interactive execution timeline to scrub back and forth across every state change.
4. AI analyzes the divergence between the student's expected outcome and the authoritative trace to explain the root misconception without hallucinations (Milestone 4).
5. Targeted comprehension micro-quizzes verify student understanding (Milestone 5).

---

## 2. Milestone 1 Scope & Status

Milestone 1 establishes the production-grade engineering foundation:
- **Repository Architecture:** Monorepo with typed FastAPI backend and Next.js frontend.
- **Backend Service:** FastAPI with Pydantic v2 settings, CORS, and `/api/health` system readiness probes.
- **Frontend Workspace:** Modern, light-first workbench (warm-white palette, zero gratuitous scroll, responsive 2-column layout).
- **Code Editor:** Python editor with line number gutter, character counters, and active execution line highlights.
- **Intent Card:** Structured input for student expectations.
- **Execution Timeline:** Step scrubber and variable state diff viewer displaying an explicitly marked **illustrative sample trace** (off-by-one boundary demo) without falsely claiming live execution.
- **Execution Controls:** Run and Investigate buttons cleanly labeled with Milestone 2 & Milestone 4 badges.
- **Docker Compose:** Production containerization definitions and isolated runner specifications.
- **Full Test Harness:** 100% passing Pytest suite, Vitest component suite, and TypeScript strict checks.

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
# 1. Backend Pytest Suite
backend\venv\Scripts\pytest backend\tests -v

# 2. Frontend Vitest Suite
npm test --prefix frontend

# 3. TypeScript Strict Type-Check
npm run type-check --prefix frontend

# 4. Production Build Verification
npm run build --prefix frontend
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
