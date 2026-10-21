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
- In Milestone 2, real isolated execution is activated using disposable Docker containers.

---

## 6. Milestone 3: Causal Timeline Analysis & Comparison Engine

### 6.1 State Evolution Extraction (`frontend/src/lib/timeline-analysis.ts`)
- **`extractVariableHistories(steps: TraceStep[])`**: Maps all recorded variable names to their sequential values and step metadata.
- **`extractVariableMutations(steps: TraceStep[])`**: Identifies state changes where $V_t \neq V_{t-1}$, producing a causal mutation trajectory (e.g. `0 → 60 → 80 → 100`).

### 6.2 Side-by-Side Execution Comparison
- **Divergence Detection without Step-Index Coupling**: Step indices in two runs rarely correspond directly because fixing a bug or adding statements alters line counts and iteration counts. The comparison engine computes:
  1. Outcome diff (terminal output, return status, and runtime exceptions).
  2. Variable trajectory alignment (matching variable names across runs and detecting where value sequences diverge).
  3. First divergence step citation in Run A where the variable first separated from Run B.

### 6.3 Evidence-Grounded Prediction Mode
- Derives interactive prediction challenges from verified execution snapshots:
  - Loop variable intermediate mutations.
  - Final terminal output values.
  - Runtime exception events.
- Evaluates student predictions deterministically against container trace facts without relying on simulated AI responses.

---

## 7. Milestone 4: Evidence-Grounded Gemini AI Investigator

### 7.1 Provider Abstraction & Official Google GenAI SDK (`backend/app/services/ai_provider.py`)
- **Protocol**: `AIProvider` defining `async def generate_investigation(code, expected_behavior, execution, comparison_execution) -> InvestigationResponse`.
- **Live Implementation (`GeminiProvider`)**:
  - Uses the official `google-genai` SDK (`from google import genai`).
  - Reads `GEMINI_API_KEY` exclusively server-side via `pydantic-settings`.
  - Configurable model priority (`gemini-2.5-flash`, `gemini-1.5-pro`) with timeout bounds (default 15s) and bounded retries.
  - Enforces structured JSON output matching `InvestigationResponse` schema.
- **Deterministic Mock Implementation (`MockDeterministicProvider`)**:
  - Activated whenever `GEMINI_API_KEY` is omitted or in offline evaluation test environments.
  - Generates deterministic, trace-grounded root-cause hypotheses, citations, proposed corrections, and 3-stage learning challenges.
  - Explicitly reports `is_live_ai: False` and `model_identifier: "deterministic-evidence-engine-v1"`.
- **Factory Pattern (`get_ai_provider`)**: Automatically initializes the live `GeminiProvider` when configured, or cleanly falls back to `MockDeterministicProvider` with clear status messaging.

### 7.2 Evidence Citation Validation Engine (`backend/app/services/investigation.py`)
To prevent LLM hallucination and ensure strict fidelity to the Core Invariant:
1. Every supporting step cited in `supporting_step_indices` is checked against `0 <= idx < len(execution.steps)`.
2. Every cited line in `supporting_line_numbers` is verified against the actual lines executed in the trace.
3. Any cited step outside trace bounds is filtered out server-side, and an informative diagnostic notice is appended to `validation_warnings`.
4. If no citations remain or the trace is empty, `evidence_sufficiency` is demoted to `"insufficient"`.

### 7.3 Sandbox Fix Verification (`POST /api/investigation/verify-fix`)
- Untrusted AI-generated corrections are never trusted blindly or executed on the host.
- The proposed code is executed inside a disposable Docker runner container (`RunnerService.run_code`).
- Output is verified against the student's expected behavior.
- Mandatory Epistemological Guardrail: The API response includes the explicit disclaimer:
  > *"Passing observed checks verifies behavior for tested inputs but does not prove universal algorithm correctness."*

### 7.4 Prompt Injection Resistance
- Student Python code, code comments, string literals, and student expected behavior text are treated as strictly untrusted user inputs.
- Fenced with unique delimiter blocks (`<<<STUDENT_CODE_UNTRUSTED>>>`, `<<<EXPECTED_BEHAVIOR_UNTRUSTED>>>`, `<<<EXECUTION_TRACE_DATA>>>`).
- Explicit system prompting instructs the model to ignore any instructions embedded within code comments or user intent strings.
- Rigorously verified by test suite: comment injections (`# SYSTEM OVERRIDE`), expected behavior injections, and string literal prompt hacks fail to hijack diagnostic output or leak environment keys.
