# ECHO — Testing Strategy & Verification Guide

## 1. Testing Philosophy

ECHO follows a strict testing discipline:
1. **Never fabricate test results.** Every test must be executed against running or compiled artifacts.
2. **Deterministic & Fast.** Foundation unit and integration tests must run in seconds.
3. **Contract-Driven.** Schema changes between FastAPI and Next.js must be caught by automated tests.

---

## 2. Test Suites Overview

### 2.1 Backend Tests (`/backend/tests`)
- **Tooling:** `pytest`, `httpx`, `pytest-asyncio`
- **Scope (22 tests passing):**
  - Health check endpoint verification (`GET /api/health`).
  - CORS headers validation.
  - Configuration loading and default fallback.
  - Execution request validation schema.
  - Live Docker container runner execution:
    - Standard execution & authoritative trace capture
    - Acceptance test case (`scores = [60, 80, 100]`) buggy and corrected runs
    - Syntax error reporting (line and message)
    - Runtime exceptions (`ZeroDivisionError`, `IndexError`)
    - Function calls and returns
    - Variable delta mutation tracking (`is_changed`)
    - Infinite loop hard timeouts
    - Excessive output truncation (64 KB bound)
    - Step limit cap (500 steps)
    - Network isolation verification (`socket` blocked)
    - Read-only filesystem write verification (blocked)
    - Concurrent execution handling
    - Docker unavailable fallback refusal

### 2.2 Frontend Tests (`/frontend`)
- **Tooling:** `vitest`, `@testing-library/react`, `@testing-library/jest-dom`
- **Scope (9 tests passing):**
  - `WorkspaceShell`: Renders header, status bar, editor, and timeline cards.
  - `CodeEditorPane`: Renders Python code with syntax styling, line numbers, and character counters.
  - `ExecutionTimelinePane`: Renders real authoritative container traces and step scrubber.
  - `ExpectedBehaviorPane`: Accepts student expectations and provides clean input feedback.
  - `ControlBar`: "Run in Sandbox" is enabled in Milestone 2 and triggers real executions.
  - `ApiClient`: Confirms typed API client methods handle success and failure responses gracefully.

### 2.3 End-to-End (E2E) Browser Verification (`/frontend/e2e` or Playwright)
- **Tooling:** Playwright
- **Scope (10 tests passing):**
  - Live execution of buggy acceptance code in sandbox from the UI.
  - Live verification of Output tab showing `33.333333333333336`.
  - Application of fix (`total += score`) from UI and execution verification showing `80.0`.
  - Step-by-step scrubbing and variable delta inspection.
  - Desktop viewports (1440x900) verifying workspace fit and absence of unintended page scroll.
  - Mobile viewports (390x844) verifying responsive stacking.

### Milestone 3: Interactive Replay, Causal Evolution & Side-by-Side Comparison
- **Backend Pytest (24 tests):**
  - All Milestone 2 sandbox isolation and security limits preserved.
  - Added benchmark tests:
    - `test_off_by_one_benchmark_program`: verifies `IndexError` at list boundary with captured output before crash.
    - `test_recursive_factorial_benchmark_program`: verifies nested function frame calls, arguments, and return value `24`.
- **Frontend Vitest (13 tests):**
  - `extractVariableHistories`: verifies extraction of full variable state snapshots across execution.
  - `extractVariableMutations`: verifies sequential deduplication and mutation delta tracking.
  - `compareExecutions`: verifies outcome and trajectory divergence detection without step index coupling.
  - `generatePredictionChallenges`: verifies evidence-grounded interactive challenges derived directly from trace events.
  - Workspace components tests (header, editor, controls, workbench tabs, replay controls).
- **Playwright E2E Browser Suite (12 tests across Desktop & Mobile Chrome):**
  - Workspace loads with Milestone 3 badge and controls active.
  - Replay controls: Play/pause timer, speed selection (0.5x, 1x, 2x, 4x), stepping (Next/Prev), scrub slider, call stack frame viewer.
  - Causal Evolution tab: variable selection dropdown, mutation trajectory nodes (`0 → 60 → 80`), clickable nodes jumping to editor lines.
  - Prediction mode: interactive multiple-choice question validated against trace evidence with immediate feedback.
  - Before-and-After Comparison view: side-by-side Run A (Initial) vs Run B (Modified) cards, terminal stdout diff (`33.333333333333336` vs `80.0`), variable divergence table (`0 → 60 → 80 → 100` vs `0 → 60 → 140 → 240`).
  - Benchmark Preset 2 (Off-by-One Boundary): preset selection, execution in Docker, output `Item 0: alpha` before `IndexError`.
  - Benchmark Preset 3 (Recursive Factorial): preset selection, execution, recursive `factorial` call stack inspection, output `4! = 24`.
  - Mobile responsiveness: clean adaptive layout on 390x844 viewport with verified controls.

---

## 3. Windows PowerShell Test Commands

### Running Backend Tests
```powershell
# Navigate to backend directory
cd E:\Projects\ECHO\backend

# Activate virtualenv (if using venv)
.\venv\Scripts\Activate.ps1

# Run pytest
pytest -v
```

### Running Frontend Tests
```powershell
# Navigate to frontend directory
cd E:\Projects\ECHO\frontend

# Run vitest unit tests
npm test

# Run type-check & lint
npm run type-check
npm run lint
```

### Running Full Foundation Verification
```powershell
# Run from repository root
.\scripts\test-all.ps1
```
