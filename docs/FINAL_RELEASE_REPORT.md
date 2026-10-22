# ECHO — Milestone 5: Final Release, Product QA & GLITCHATHON Submission Report

**Project:** ECHO — AI-Powered Educational Debugging Laboratory  
**Tagline:** *Don't just fix the mistake. Understand the moment it was made.*  
**Target:** GLITCHATHON 2026 (Deadline: October 25, 2026, 13:30 GMT+2)  
**Release Version:** `v0.5.0-rc1` (Milestone 5 Final Release Candidate)  
**Evaluated Branch / Commit:** `master` / Final Commit  
**Release Verdict:** **CONDITIONAL GO** *(100% engineering tests passing, live Gemini AI validated; pending human demo video recording and Devpost form submission)*

---

## 1. Executive Summary & Core Invariant

ECHO was built from the ground up for **GLITCHATHON 2026** to revolutionize how programming students learn from debugging failures. Unlike conventional developer tools that merely invoke an LLM to regurgitate code fixes, ECHO operates on an unyielding pedagogical and architectural foundation:

> **Execution evidence is authoritative. AI explanations are hypotheses until verified by evidence.**

Every diagnostic claim made by ECHO's AI engine is strictly anchored to authoritative execution steps recorded by a secure, non-networked Linux Docker container. Hypotheses that cannot point to real trace evidence are rejected; proposed code corrections are verified in an isolated container sandbox before being presented to the student; and the entire experience is designed as an interactive time-travel investigation.

Over the course of 5 milestones, ECHO has grown into a production-grade educational platform featuring:
1. **Isolated Disposable Sandbox Execution:** Real Python runtime tracing (`sys.settrace`) executed in disposable, unprivileged Docker containers (`echo-runner`) with hard CPU, memory, and timeout bounds.
2. **Interactive Time-Travel Replay:** Granular playback controls, scrubbing timeline, jump to exception, and dynamic line-by-line source highlighting.
3. **Causal Variable Evolution & Prediction Challenges:** Step-by-step state tracking showing exactly when invariants break, with interactive prediction challenges to reinforce student comprehension.
4. **Before-and-After Dual Trace Comparison:** Side-by-side decoupled execution comparison allowing students to observe the exact divergence between buggy and corrected runs.
5. **Evidence-Grounded Gemini AI Investigator:** Server-side Google GenAI provider (`gemini-3.5-flash-lite`), prompt-injection shielding, hallucination filters, and automated sandbox fix verification.
6. **Multi-Tab Pedagogical Learning Challenges:** 3-tier post-diagnostic exercises (Trace Prediction, Conceptual Comprehension, and Targeted Coding Practice).

---

## 2. Phase 1: Independent Engineering Audit & Defect Rectification

An exhaustive audit of the entire codebase was conducted across frontend, backend, container runner, and test suites.

### Verified Capabilities
- **Frontend / Backend Integration:** Clean REST contract with strong Pydantic v2 schemas for `/api/health`, `/api/execution/run`, `/api/investigation/analyze`, and `/api/investigation/verify-fix`.
- **Sandbox Container Isolation:** Disposable Linux containers run with `--network none`, `--read-only`, tmpfs mounted at `/tmp`, dropped Linux capabilities (`ALL`), `--security-opt=no-new-privileges`, PID limits (64), memory limit (128 MB), and non-root UID 10001.
- **Trace Grounding:** Every line execution, call, return, and variable mutation is authoritatively recorded. Unserializable Python objects are safely converted via representation fallbacks.
- **Strict Evidence Validation:** Server-side audit ensures that any line number or trace step index cited by the AI model actually exists in the container execution trace. Invalid citations are filtered with diagnostic warnings.
- **Responsive Workspace:** Workspace fits desktop viewports (1280x800+) without full-page vertical scrolling, and gracefully collapses into responsive stacked tabs on mobile screens (375x667+).

### Defects Identified & Resolved During Milestone 5
1. **Suggested Fix Incompleteness (Sandbox NameError):**
   - *Issue:* In raw LLM generations, the model occasionally returned isolated single-line replacements (e.g. `speed = distance_km / elapsed_hours`) rather than complete runnable scripts, causing the sandbox verification runner to fail with `NameError: name 'distance_km' is not defined`.
   - *Fix:* Enforced in `SYSTEM_PROMPT` that `suggested_correction` must always provide the entire self-contained, runnable Python program. Added automated markdown code fence stripping in `ai_provider.py` before executing the sandbox verification.
2. **Transient Google API 503 Latency & Candidate Fallback:**
   - *Issue:* During transient upstream API rate-limiting or maintenance, long retry loops could cause request timeouts.
   - *Fix:* Optimized the candidate model fallback loop in `ai_provider.py` (`gemini-3.5-flash-lite` -> `gemini-3.5-flash` -> `gemini-3.6-flash`), with 1 fast retry per model and an 8.0s timeout, gracefully falling back to the deterministic offline provider when network quotas are exhausted.
3. **Empty State Guidance:**
   - *Issue:* First-time users encountered a blank timeline area before running their first program.
   - *Fix:* Added an intuitive 3-step workflow guide to `ExecutionTimelinePane` ("1. Write or load code -> 2. Run in Docker Sandbox -> 3. Step through time-travel replay").
4. **Test Threshold Realignment:**
   - *Issue:* `test_sandbox_execution.py::test_infinite_loop_timeout` asserted `elapsed <= 7.0s` against a 5.0s default, which failed when the sandbox timeout was tuned to 8.0s for high-load container headroom.
   - *Fix:* Updated assertion to `assert elapsed <= settings.execution_timeout_seconds + 3.0s`.

---

## 3. Phase 2: Live AI Evaluation Across 5 Unseen Scenarios

The live AI investigation pipeline was evaluated against five completely unseen debugging scenarios spanning distinct bug categories. All evaluations executed against live Google Gemini (`gemini-3.5-flash-lite`) and were independently verified inside disposable Docker containers.

### Evaluation Results Table

| Scenario ID | Bug Archetype | Title | Citations Valid? | Suggested Fix Verified? | Verified Sandbox Output | Latency (Exec / AI / Verify / Total) |
|---|---|---|:---:|:---:|---|---|
| **UNSEEN-01** | Logical Bug (No Exception) | Discount Percentage Formula | Yes (Step #3, Line 4) | Yes (`is_verified: true`) | `Total: 45.0` | 1.25s / 4.03s / 2.19s / **7.46s** |
| **UNSEEN-02** | Runtime Exception | ZeroDivisionError in Speed Calc | Yes (Steps #2, #3, Line 3) | Yes (`is_verified: true`) | `Error: Elapsed hours cannot be zero.` | 0.89s / 5.55s / 1.90s / **8.35s** |
| **UNSEEN-03** | Function Return Bug | Early Return in For-Loop | Yes (Steps #6-9, Line 6) | Yes (`is_verified: true`) | `Evens: 4` | 1.16s / 3.90s / 2.37s / **7.43s** |
| **UNSEEN-04** | Mutable-State Bug | Aliased 2D List Replication | Yes (Steps #1, #2, Lines 2, 3) | Yes (`is_verified: true`) | `[[9, 0, 0], [0, 0, 0], [0, 0, 0]]` | 1.01s / 5.05s / 2.25s / **8.31s** |
| **UNSEEN-05** | Ambiguous Student Intent | Vague Expected Behavior | Yes (Steps #1, #2, Lines 1-3) | Yes (`is_verified: true`) | `60` | 1.01s / 3.28s / 1.91s / **6.21s** |

### Scenario Breakdown & Observations
- **UNSEEN-01 (Discount Percentage):** Code executed `subtotal - (subtotal * discount_pct)` where `discount_pct = 10`, yielding `Total: -450.0`. Gemini cited Step #3 and Line 4, diagnosed the missing `/ 100` division, and the sandbox verified the corrected output `Total: 45.0`.
- **UNSEEN-02 (ZeroDivisionError):** Code attempted `speed = distance_km / elapsed_hours` with `elapsed_hours = 0.0`. Gemini cited Step #3 and Line 3, introduced an `if elapsed_hours > 0.0:` guard, and the sandbox verified graceful error handling.
- **UNSEEN-03 (Early Return):** Code placed `return count` inside the `for` loop body, exiting after iteration 1. Gemini cited Steps #6, #7, #8, #9 and Line 6, unindented the return statement, and the sandbox verified the correct count `Evens: 4`.
- **UNSEEN-04 (Mutable State Aliasing):** Code created a 2D matrix using `[[0]*3]*3`, mutating all rows when modifying `grid[0][0]`. Gemini explained reference duplication, replaced it with a list comprehension `[[0 for _ in range(3)] for _ in range(3)]`, and the sandbox verified `[[9, 0, 0], [0, 0, 0], [0, 0, 0]]`.
- **UNSEEN-05 (Ambiguous Intent):** Code executed `res = scores[0] + scores[1]` with vague intent *"Make it work properly"*. Gemini noted that the code runs without crashing, deduced the student intended a full aggregate sum, generated `res = sum(scores)`, and verified output `60`.

**Summary:** 5 / 5 unseen scenarios passed with 100% valid evidence citations and 100% successful sandbox fix verifications. Average total end-to-end latency was **7.55 seconds**.

---

## 4. Phase 3 & 4: Security Boundaries & Operational Safety

In strict compliance with `AGENTS.md` and `docs/SECURITY.md`:

```
┌────────────────────────────────────────────────────────┐
│                   Untrusted Student                    │
└──────────────────────────┬─────────────────────────────┘
                           │ POST /api/execution/run
                           ▼
┌────────────────────────────────────────────────────────┐
│              ECHO FastAPI Host (Port 8005)             │
│  - No eval() / exec() on host                          │
│  - Gemini API key stays strictly server-side          │
│  - Prompt-injection delimiter boundary fences         │
└──────────────────────────┬─────────────────────────────┘
                           │ Disposable Docker Container
                           ▼
┌────────────────────────────────────────────────────────┐
│             echo-runner (Non-Root UID 10001)           │
│  - Network: NONE (--network none)                      │
│  - Filesystem: Read-Only root, tmpfs at /tmp           │
│  - Security: Drop ALL caps, no-new-privileges          │
│  - Resources: 128 MB RAM, 64 PIDs, 8.0s hard timeout   │
│  - Bound: 64 KB stdout/stderr, 500 trace steps max     │
└────────────────────────────────────────────────────────┘
```

- **Local Showcase Only:** ECHO is designed strictly for local judge evaluation and self-hosted educational deployment. In accordance with competition rules, the execution engine is **NOT** exposed to the public internet without an API gateway, authentication, and per-user rate limiting.
- **Secret Hygiene:** `GEMINI_API_KEY` is loaded solely through backend environment variables (`pydantic-settings`). Zero keys or tokens are baked into frontend bundles or committed to Git.
- **Prompt Injection Defense:** Student code strings and expected behavior texts are quarantined within robust delimiter tags (`<<<STUDENT_CODE_UNTRUSTED>>>`) preventing prompt leaks or instruction hijacking.

---

## 5. Comprehensive Verification Test Suite

Every tier of the system was tested end-to-end under automated harnesses.

```
======================================================================
                  ECHO AUTOMATED TEST HARNESS SUMMARY
======================================================================
1. Backend Integration & Security (Pytest):        46 / 46 PASSED (100%)
   - Sandbox execution & resource timeouts:        14 / 14 PASSED
   - AI investigation & citation filters:           6 /  6 PASSED
   - 12 Bug Archetype Benchmark Cases:             12 / 12 PASSED
   - Prompt-injection defense tests:                3 /  3 PASSED
   - Service health & configuration:                6 /  6 PASSED
   - API contract schemas & bounds:                 5 /  5 PASSED

2. Frontend Unit & Component Tests (Vitest):       19 / 19 PASSED (100%)
   - Workspace state & preset switching:            6 /  6 PASSED
   - AI investigation panel & fix verification:     5 /  5 PASSED
   - Timeline analysis & step scrubbing:            4 /  4 PASSED
   - Typed API client & error handling:             4 /  4 PASSED

3. End-to-End Browser Tests (Playwright):          14 / 14 PASSED (100%)
   - Desktop Chrome (1280x800):                     7 /  7 PASSED
   - Mobile Chrome (Pixel 5, 393x851):              7 /  7 PASSED
   - Screenshot captures verified:                  4 /  4 CAPTURED

4. Frontend Static Type Check (TypeScript strict):  0 ERRORS
5. Production Build:                                SUCCESS (106 kB JS)
======================================================================
TOTAL AUTOMATED TESTS:                             79 / 79 PASSED (100%)
======================================================================
```

---

## 6. Performance Observations & Resource Budget

- **Docker Container Startup:** Disposable container startup and execution average **0.9s – 1.3s** on Windows 11 with WSL2 backend.
- **Real-Time Python Tracing:** Tracing via `sys.settrace` adds negligible overhead (~15ms) for programs under 100 lines.
- **Gemini AI Diagnosis:** Latency on `gemini-3.5-flash-lite` averages **3.5s – 5.5s** with structured JSON output schemas.
- **Sandbox Fix Verification:** Re-executing suggested corrections in a clean disposable container takes **1.9s – 2.4s**.
- **Frontend Bundle Size:** Next.js production build First Load JS is only **106 kB**, enabling instant client hydration.

---

## 7. Known Limitations & Future Horizons

1. **Terminal Input (`input()`):** Interactive STDIN is currently disabled in the disposable runner (`sys.stdin` is empty). Programs expecting user input should use preset variable assignments.
2. **Multi-File Projects:** Current execution supports single-file Python programs up to 500 lines. Multi-module packages are reserved for post-hackathon versions.
3. **External Dependencies:** Runner includes Python 3.11 standard library. Third-party packages (e.g. `numpy`, `pandas`) can be enabled by extending the `echo-runner` Dockerfile.

---

## 8. Release Verdict

### **Verdict: CONDITIONAL GO**

**Justification:**
- **Technical Excellence:** 100% of functional requirements and security invariants across Milestones 1 through 5 are implemented and verified.
- **Test Integrity:** 79 out of 79 automated tests are passing with zero warnings or flake.
- **Evaluation Evidence:** 5 unseen real-world debugging scenarios verified against live Gemini AI with zero hallucinated citations and 100% verified sandbox fixes.
- **Condition for Full GO:** Requires human team completion of competition administrative items:
  1. Record the 3-minute video demonstration following [docs/DEMO_SCRIPT.md](file:///E:/Projects/ECHO/docs/DEMO_SCRIPT.md).
  2. Complete the Devpost submission form using [docs/DEVPOST_SUBMISSION.md](file:///E:/Projects/ECHO/docs/DEVPOST_SUBMISSION.md).
  3. Verify public repository accessibility before the October 25, 13:30 GMT+2 deadline.
