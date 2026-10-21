# ECHO — AI-Powered Educational Debugging Laboratory

> **Tagline:** *Don't just fix the mistake. Understand the moment it was made.*  
> **GLITCHATHON 2026 Submission** | Target Deadline: October 25, 2026, 13:30 GMT+2  
> **Current Status:** Milestone 3 Complete (Interactive Time-Travel Debugger & Causal Analysis)

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
7. AI analyzes the divergence between the student's expected outcome and the authoritative trace (Milestone 4).

---

## 2. Milestone 3 Scope & Capabilities

Milestone 3 delivers a complete interactive time-travel debugging laboratory:
- **Time-Travel Replay Engine:** Play/Pause with customizable playback speed (`0.5x`, `1.0x`, `2.0x`, `4.0x`), Step Next/Prev, Jump to Error, Jump to Start, timeline scrubber, and keyboard accessibility (`Space`, `←`, `→`, `Home`, `End`).
- **Causal Variable Evolution:** Visual progression of variable mutations across execution steps with clickable nodes jumping directly to the corresponding editor line and trace step.
- **Before-and-After Side-by-Side Comparison:** Compares Run A (Baseline) and Run B (Modified) side-by-side without assuming identical step indices, identifying stdout differences and variable trajectory divergence.
- **Evidence-Grounded Prediction Mode:** Multiple-choice checkpoints derived from recorded execution events, verified deterministically against container trace facts (zero hallucinations).
- **Call Stack Frame Inspector:** Real-time visibility into active function names, recursion depth, and line positions.
- **Educational Benchmark Presets:**
  1. *Accumulator Overwrite:* `scores = [60, 80, 100]`, `total = score` vs `total += score`.
  2. *Off-by-One Boundary:* `range(len(items) + 1)` leading to `IndexError`.
  3. *Recursive Factorial:* `factorial(4)` demonstrating nested frame transitions.
- **Comprehensive Automated Test Harness:** 49 automated tests passing:
  - 24 Pytest backend integration & security tests
  - 13 Vitest frontend unit tests
  - 12 Playwright E2E browser tests (Desktop & Mobile Chrome)
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
