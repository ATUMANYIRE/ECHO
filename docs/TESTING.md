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
- **Scope:**
  - Health check endpoint verification (`GET /api/health`).
  - CORS headers validation.
  - Configuration loading and default fallback.
  - Execution request validation schema (verifying code length, syntax guards, and error formats).
  - Sandbox readiness probe verification.

### 2.2 Frontend Tests (`/frontend`)
- **Tooling:** `vitest`, `@testing-library/react`, `@testing-library/jest-dom`
- **Scope:**
  - `WorkspaceShell`: Renders header, status bar, editor, and timeline cards.
  - `CodeEditorPane`: Renders Python code with syntax styling, line numbers, and character counters.
  - `ExecutionTimelinePane`: Renders sample steps and confirms the **illustrative sample data** disclaimer is visibly rendered.
  - `ExpectedBehaviorPane`: Accepts student expectations and provides clean input feedback.
  - `ApiClient`: Confirms typed API client methods handle success and failure responses gracefully.

### 2.3 End-to-End (E2E) Browser Verification (`/frontend/e2e` or Playwright)
- **Tooling:** Playwright
- **Scope:**
  - Desktop viewports (1280x800, 1920x1080) verifying workspace fit and absence of unintended page scroll.
  - Mobile viewports (375x667, 768x1024) verifying responsive stacking.
  - Real API probe confirming frontend-to-backend communication.

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
