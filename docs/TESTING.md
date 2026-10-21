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
