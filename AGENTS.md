# ECHO — Agent Instructions & Engineering Rules

Welcome to the **ECHO** codebase. As an autonomous engineer working on this repository, you must strictly abide by the following technical, architectural, and ethical rules.

---

## 1. The Core Invariant

> **Execution evidence is authoritative. AI explanations are hypotheses until verified by evidence.**

- **NEVER** fabricate execution traces, variable mutations, runtime outputs, or test results.
- **NEVER** present simulated execution as real execution.
- If execution is unavailable or container isolation is down, fail fast and notify the user with a transparent error message.
- AI diagnostic models (Gemini) must only analyze verified runtime traces and must link every diagnostic claim to an exact trace step index and line number.

---

## 2. Security Boundaries

- **Student code is untrusted.**
- **NEVER** use `eval()`, `exec()`, or `subprocess` to run user code on the host machine or within the main API process.
- In-process validation (AST checking, custom `__builtins__`) is **NOT** a sandbox.
- Untrusted execution must run exclusively within disposable, non-root, read-only, non-networked Docker containers with hard resource limits (Milestone 2+).
- **Gemini API keys must stay server-side.** Never expose secret tokens to the frontend client bundle or commit them to Git.

---

## 3. Visual & UX Standards

- **Design Philosophy:** Premium developer education tool. Not a generic chatbot.
- **Color Palette:** Warm-white surfaces (`#FAFAF8`, `#F5F5F0`), neutral zinc/slate borders, restrained violet/indigo accents (`#6366F1`, `#7C3AED`).
- **Layout:** The primary debugging workspace must fit standard desktop viewports (1280x800+) without unnecessary page scroll.
- **Honesty:** Disabled or preview features must be visibly badged with informative tooltips (e.g., *"Execution engine scheduled for Milestone 2"*).

---

## 4. Code Standards

### Backend (FastAPI / Python 3.11+)
- Strict type hints on all functions and methods.
- Strong Pydantic v2 validation for all API inputs and outputs.
- Comprehensive unit tests using `pytest` for all routes and services.
- Never hardcode environment variables or port numbers; use `pydantic-settings`.

### Frontend (Next.js / TypeScript)
- TypeScript strict mode (`"strict": true`) with zero `any` types where possible.
- Functional React components with cleanly decomposed subcomponents.
- Tailwind CSS utility classes; avoid inline styles.
- Unit testing with Vitest and `@testing-library/react`.

---

## 5. Development Environment (Windows 11 / PowerShell)

- Commands run in Windows PowerShell. Use forward slashes or escaped backslashes appropriately.
- Avoid port collisions: Default Backend port is `8005`, Frontend port is `3005`.
