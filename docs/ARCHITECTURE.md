# ECHO — System Architecture

## 1. Architectural Philosophy

ECHO is built around a single invariant:
> **Execution evidence is authoritative. AI explanations are hypotheses until verified by evidence.**

In conventional AI coding tools, language models hallucinate runtime outputs, fabricate stack traces, or assume what code does without executing it. ECHO rejects this model. Untrusted code is executed inside an isolated sandbox, producing a verified chronological trace of events and variable mutations. Only after verified execution has occurred does the AI diagnostic engine analyze the divergence between student intent and runtime reality.

```
+-------------------------------------------------------------+
|                     Next.js Frontend                        |
|   (Code Editor, Expected Behavior Input, Timeline Scrubber, |
|           Variable Inspector, Diagnostic Findings)          |
+------------------------------+------------------------------+
                               | Typed REST API (JSON)
                               v
+-------------------------------------------------------------+
|                     FastAPI Backend                         |
|   - Request Validation & Health Probes                      |
|   - Execution Orchestrator (Docker Sandbox Manager)         |
|   - Trace Ingestion & Normalizer                            |
|   - AI Diagnostic Engine (Gemini API via Provider Adapter)  |
+------------------------------+------------------------------+
                               |
            +------------------+------------------+
            |                                     |
            v                                     v
+-----------------------+             +-----------------------+
| Isolated Runner Box   |             |  Gemini AI Engine     |
| (Docker tmpfs/non-net)|             |  (Server-side SDK)    |
| - Python sys.settrace |             |  - Root cause analysis|
| - Step trace emitter  |             |  - Micro-quizzes      |
+-----------------------+             +-----------------------+
```

---

## 2. Component Architecture

### 2.1 Frontend (`/frontend`)
- **Framework:** Next.js 14+ (App Router), React 18+, TypeScript (strict mode).
- **Styling:** Tailwind CSS with a deliberate warm-white palette (`#FAFAF8`, `#F5F5F0`), slate borders (`#E5E5E0`), and restrained indigo/violet semantic highlights (`#6366F1`, `#7C3AED`).
- **Workspace Layout:**
  - **Header:** System status indicator, backend connectivity badge, project tagline.
  - **Primary Workspace (2-Column Desktop Grid):**
    - **Left Column:** Python Code Editor (syntax highlighting, line numbering, read/write state) & Expected Behavior input card.
    - **Right Column:** Action Bar (Run/Investigate with status tooltips) & Execution Timeline Component (scrubber, step cards, variable diff preview).
  - **No Overflow / Zero Gratuitous Scroll:** Designed as a compact, responsive developer workbench that fits desktop viewports without unnecessary page scrolling.
- **API Client:** Fully typed client (`lib/api-client.ts`) using standard `fetch` with error normalization, request timeouts, and Pydantic-compatible type definitions (`lib/types.ts`).

### 2.2 Backend (`/backend`)
- **Framework:** FastAPI with Python 3.11+, ASGI (`uvicorn`), and Pydantic v2.
- **Module Structure:**
  - `app.config`: Centralized application settings using `pydantic-settings` (CORS origins, server port, timeouts, Gemini keys).
  - `app.api`: Modular route handlers (`health.py`, `execution.py` contracts).
  - `app.schemas`: Strongly typed request/response models.
  - `app.services`: Business logic separation:
    - `sandbox`: Container lifecycle, resource guardrails, and trace extraction.
    - `diagnostic`: AI analysis abstraction (`LLMProvider`).
- **Health & Readiness Endpoints:**
  - `GET /api/health`: Provides service uptime, version, sandbox status, and environment health.

---

## 3. Authoritative Trace vs. AI Hypothesis Separation

To uphold academic integrity and debugging correctness, the system enforces a strict data contract:

1. **Trace Layer (Factual):**
   - Derived strictly from execution within the isolated runner.
   - Contains immutable step indices, line numbers, variable snapshots, standard output, and exceptions.
   - The UI displays trace cards with a green/amber authoritative badge (`Verified Execution`).

2. **Diagnostic Layer (Inferential):**
   - Derived from Google Gemini reasoning over student code, expected output, and the authoritative trace.
   - Every claim must cite the specific trace step index (e.g., `divergence_step: 4, line: 6`).
   - The UI displays diagnostic cards with a violet badge (`AI Hypothesis — Evidence-Linked`).

---

## 4. Port & Networking Configuration

| Component | Default Host Port | Container Port | Protocol | Purpose |
|---|---|---|---|---|
| Frontend | `3005` | `3000` | HTTP | Next.js Developer Workspace UI |
| Backend API | `8005` | `8000` | HTTP | FastAPI REST & Orchestration Engine |
| Isolated Sandbox | *No exposed ports* | *None* | IPC / Stdio | Ephemeral execution containers |

*Note: Default ports 3005 and 8005 avoid collisions with existing Docker or system services common in developer environments.*

---

## 5. Security & Isolation Model

Detailed in [`docs/SECURITY.md`](file:///E:/Projects/ECHO/docs/SECURITY.md):
- Zero untrusted code runs on the host Python process.
- Ephemeral containers with `--network none`, `--read-only`, `--tmpfs /tmp:size=16m`, `--cap-drop ALL`, and unprivileged UID.
- Strict CPU (0.5 cores), memory (128 MB), process (max 64 pids), and wall-clock execution limits (3.0 seconds).
- In Milestone 1, execution is purposefully disabled at the API and UI level, with clear system badges indicating that the execution engine is scheduled for Milestone 2.
