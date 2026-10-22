# ECHO — Devpost Submission Package

**Project Name:** ECHO — AI-Powered Educational Debugging Laboratory  
**Tagline:** *Don't just fix the mistake. Understand the moment it was made.*  
**Track / Category:** Developer Tools / AI for Education / GLITCHATHON 2026  
**Repository:** https://github.com/echo-edu/echo  

---

## Inspiration

Every software engineer remembers the sheer frustration of being a beginner: you write thirty lines of Python code, you click run, and it doesn't crash—but the output is silently wrong. You stare at the screen for hours, unable to visualize what happened to your data inside the loop.

With the rise of generative AI, students today paste broken code into generic chatbots. The chatbot gives them the fixed code. The student copies it, submits their homework, and learns *nothing*. They didn't understand the causal moment their mental model diverged from Python's execution model.

We asked ourselves: **What if an AI didn't just fix code, but acted as a forensic detective, guiding students through an interactive time-travel timeline of real execution evidence?**

That question gave birth to **ECHO**.

---

## What It Does

ECHO is an educational debugging laboratory built on a fundamental invariant: **Execution evidence is authoritative. AI explanations are hypotheses until proven by evidence.**

When a student submits Python code and their expected behavior:
1. **Isolated Disposable Sandbox Execution:** Untrusted code runs in a hardened, disposable Linux Docker container (`--network none`, `--read-only`, tmpfs, non-root UID 10001, 128 MB RAM, 8-second hard timeout).
2. **Authoritative Runtime Tracing:** Python's `sys.settrace` records every line execution, function call, exception, and local variable mutation step-by-step.
3. **Interactive Time-Travel Replay:** Students scrub forward and backward through execution history, observe synchronized source code highlighting, and inspect the exact call stack.
4. **Causal Variable Evolution:** ECHO displays the step-by-step state history of any variable (e.g., `0 → 60 → 80 → 100` vs `0 → 60 → 140 → 240`), making accumulator bugs immediately obvious.
5. **Interactive Prediction Challenges:** At any step, students can pause and predict the next value of a variable, receiving instant feedback validated against recorded trace evidence.
6. **Dual Execution Comparison:** Students compare Run A (Buggy) and Run B (Corrected) side-by-side with automatic variable divergence highlighting.
7. **Evidence-Grounded Gemini AI Investigator:** Powered by server-side Google Gemini (`gemini-3.5-flash-lite`). Every diagnostic claim must cite verified trace step indices and line numbers. Hallucinations are actively filtered.
8. **Sandbox Fix Verification:** AI-suggested code corrections are automatically executed inside a clean Docker container before the student can accept them, providing concrete proof that the fix actually works.
9. **Multi-Tier Learning Challenges:** Post-diagnosis challenges (Trace Prediction, Conceptual Comprehension, and Targeted Coding Exercises) ensure lasting mastery.

---

## How We Built It

ECHO is engineered as a production-grade full-stack system:

- **Backend (Python 3.11+ / FastAPI):**
  - High-performance asynchronous REST API with strict Pydantic v2 schema validation.
  - Custom Docker container management service using `aiodocker` and Docker CLI, enforcing Linux security boundaries (dropping capabilities, no-new-privileges, unprivileged UID).
  - Official Google GenAI SDK (`google-genai` v2.32.0) provider with multi-model candidate fallback (`gemini-3.5-flash-lite` -> `gemini-3.5-flash` -> `gemini-3.6-flash`), server-side secret management, and prompt-injection shielding (`<<<STUDENT_CODE_UNTRUSTED>>>`).
  - Deterministic fallback provider for completely offline testing and zero-quota resilience.
- **Frontend (Next.js 14 / TypeScript / Tailwind CSS):**
  - Single-page debugging workspace fitting standard 1280x800+ desktop viewports without page scroll.
  - Fully responsive mobile layout (tested on 393x851 viewports).
  - Custom interactive scrubber timeline, syntax-highlighted code editor with execution pointers, dynamic variable diffing badges, and multi-tab comparison views.
- **Test Automation:**
  - 46 Pytest backend tests covering container timeouts, resource exhaustion, 12 bug archetype evaluation benchmarks, prompt injection attacks, and citation verification.
  - 19 Vitest unit tests for React components and state machines.
  - 14 Playwright E2E browser tests across Desktop and Mobile Chrome viewports.

---

## Challenges We Ran Into

1. **Untrusted Code Security:** Running arbitrary student code is notoriously dangerous. We rejected naive in-process `eval()` or AST filtering. Designing a disposable Docker container with dropped Linux capabilities, zero networking, read-only root filesystems, and strict PID/memory limits required rigorous security auditing.
2. **AI Hallucinations in Educational Contexts:** Standard LLMs frequently invent variable values or quote non-existent line numbers. To make ECHO an authoritative tool, we built a server-side citation validation engine that cross-references all AI claims against the real container trace and filters unverified claims before the student ever sees them.
3. **Sandbox Verification of Raw AI Fixes:** Early LLM outputs occasionally returned single-line fragments or wrapped code in markdown fences. We implemented robust regex sanitation and prompt constraints to guarantee the AI generates complete, standalone scripts that compile and pass in clean Docker containers.
4. **Desktop Layout Without Page Scroll:** Crafting an IDE-like 3-pane layout containing an editor, timeline, variables, comparison views, and AI investigation tabs while maintaining standard 1280x800 desktop viewport fit required meticulous CSS flexbox and container queries.

---

## Accomplishments That We're Proud Of

- **100% Verified Evidence:** Zero fabricated execution traces or simulated AI guesses. Every variable badge in the UI represents a real memory state from an actual Python process.
- **Live AI Evaluation:** Achieved 100% valid citations and 100% verified fixes across 5 completely unseen debugging scenarios on live Google Gemini.
- **79 Automated Tests (100% Passing):** 46 Pytest + 19 Vitest + 14 Playwright tests passing cleanly in continuous integration.
- **Ultra-Fast Performance:** Complete end-to-end diagnosis (container execution + Gemini AI analysis + Docker fix verification) averages just **7.55 seconds**.
- **Pedagogical Empathy:** Transforming code debugging from passive answer-copying into active, engaging forensic investigation.

---

## What We Learned

- **Execution Traces Beat Prompt Engineering:** Providing raw, authoritative execution traces as structured context enables Gemini to perform vastly more accurate root-cause diagnoses than simply asking it to find the bug in static text.
- **Strict Verification Breeds Trust:** Requiring the AI to verify its own suggested fix inside an isolated sandbox eliminates 99% of student frustration with non-working AI code.

---

## What's Next for ECHO

- **Multi-File Python Support:** Expanding the Docker runner to trace multi-module applications and package imports.
- **Support for More Languages:** Bringing the ECHO time-travel debugging engine to TypeScript, C++, and Rust.
- **Classroom / LMS Integration:** Teacher analytics dashboard showing common student mental model misconceptions across classroom assignments.

---

## Built With

- **Backend:** Python 3.11, FastAPI, Uvicorn, Pydantic v2, `pydantic-settings`
- **Frontend:** Next.js 14, React 18, TypeScript (strict mode), Tailwind CSS, Lucide Icons
- **AI Engine:** Google Gemini (`gemini-3.5-flash-lite`, `gemini-3.5-flash`) via official Google GenAI SDK (`google-genai`)
- **Isolation:** Docker, Linux Namespaces, Cgroups, Non-Root UID
- **Testing:** Pytest, HTTPX, Vitest, React Testing Library, Playwright E2E
