# ECHO — GLITCHATHON 2026 Submission Checklist

**Deadline:** October 25, 2026, 13:30 GMT+2  
**Final Release Version:** `v0.5.0-rc1` (Milestone 5 Final Release Candidate)  
**Overall Verdict:** **CONDITIONAL GO**

---

## 1. Automated Engineering Verification (100% Complete)

| Component | Target | Actual Result | Status |
|---|---|---|:---:|
| **Backend Unit & Integration Tests** | `backend/tests` (Pytest) | 46 / 46 Passed (100%) |  PASS |
| **Frontend Component Tests** | `frontend/src/test` (Vitest) | 19 / 19 Passed (100%) |  PASS |
| **End-to-End Browser Tests** | `frontend/e2e` (Playwright) | 14 / 14 Passed (100%) |  PASS |
| **Static Type Checking** | TypeScript `strict: true` | 0 Type Errors |  PASS |
| **Frontend Production Build** | Next.js App Router | Success (106 kB First Load JS) |  PASS |
| **Docker Execution Sandbox** | `echo-runner:latest` | Linux UID 10001, `--network none` |  PASS |
| **Live AI Evaluation (5 Unseen Scenarios)** | `gemini-3.5-flash-lite` | 5 / 5 Passed, 100% Valid Citations |  PASS |

---

## 2. Security & Policy Checklist (100% Complete)

- [x] **No Host Code Execution:** Untrusted code is never run via `eval()`, `exec()`, or `subprocess` on the host machine.
- [x] **Hardened Docker Sandbox:** Disposable containers use `--network none`, `--read-only`, tmpfs at `/tmp`, `--cap-drop=ALL`, `--security-opt=no-new-privileges`, memory limit (128 MB), PID limit (64), and execution timeout (8.0s).
- [x] **No Hardcoded Secrets:** `GEMINI_API_KEY` is loaded exclusively via server-side environment variables (`pydantic-settings`). No secrets are baked into client bundles, Git commits, or documentation.
- [x] **No Public Exposure of Raw Execution:** ECHO is configured for local judge showcase on `http://localhost:3005` (API on `http://127.0.0.1:8005`) and is not deployed to the public web without auth/rate-limiting.
- [x] **Prompt Injection Quarantine:** Untrusted student inputs and comments are enclosed in boundary delimiters (`<<<STUDENT_CODE_UNTRUSTED>>>`).
- [x] **Zero Fabricated Evidence:** All execution traces, variable diffs, and citations reflect authentic container execution.

---

## 3. Human Manual Actions (Required for Final Submission)

These 3 action items must be performed manually by the team before the October 25, 13:30 GMT+2 deadline:

### Action 1: Record the 3-Minute Video Walkthrough
- [ ] Open the application locally:
  - Backend: `backend\venv\Scripts\python -m uvicorn app.main:app --app-dir backend --port 8005`
  - Frontend: `npm run dev --prefix frontend` (or `npm start --prefix frontend` on port 3005)
- [ ] Follow the exact scene-by-scene script in [docs/DEMO_SCRIPT.md](file:///E:/Projects/ECHO/docs/DEMO_SCRIPT.md).
- [ ] Keep total video length strictly under 3 minutes (recommended: 2m 45s).
- [ ] Upload the recording to YouTube, Vimeo, or Loom (publicly accessible).

### Action 2: Devpost Project Form Submission
- [ ] Navigate to the GLITCHATHON 2026 Devpost portal.
- [ ] Copy project details from [docs/DEVPOST_SUBMISSION.md](file:///E:/Projects/ECHO/docs/DEVPOST_SUBMISSION.md):
  - **Project Title:** `ECHO — AI-Powered Educational Debugging Laboratory`
  - **Tagline:** `Don't just fix the mistake. Understand the moment it was made.`
  - **Description:** Paste sections (Inspiration, What It Does, How We Built It, Challenges, Accomplishments, Lessons Learned, What's Next).
  - **Built With:** `Python, FastAPI, Next.js, TypeScript, Tailwind CSS, Docker, Google Gemini, Playwright, Vitest, Pytest`
  - **Media:** Attach screenshots from `frontend/e2e-screenshots/`:
    - `desktop-final-release.png`
    - `mobile-final-release.png`
    - `desktop-investigation-m4.png`
    - `mobile-investigation-m4.png`
  - **Video Link:** Paste public video link from Action 1.

### Action 3: Final Git Check & Remote Push
- [ ] Review `git status` on local machine: ensure working directory is clean.
- [ ] When ready for submission, push to the public competition repository:
  ```powershell
  git push origin master
  ```
- [ ] Confirm repository is public and accessible to hackathon judges.

---

## 4. Quick Start for Judges / Local Showcase

```powershell
# 1. Build runner container (once)
docker build -t echo-runner:latest runner

# 2. Configure environment
Copy-Item backend\.env.example backend\.env
# Ensure GEMINI_API_KEY is populated in backend\.env

# 3. Start Backend API
backend\venv\Scripts\python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8005

# 4. Start Frontend UI
npm start --prefix frontend
# Navigate to http://localhost:3005
```
