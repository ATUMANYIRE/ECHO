# ECHO — Security Architecture & Sandbox Specification

## 1. Threat Model & Untrusted Code Execution

ECHO is designed to execute Python code submitted by students. Student code is inherently **untrusted**. A user might submit:
- Infinite loops or recursion designed to exhaust CPU or stack memory (`while True: pass`).
- Fork bombs or process flooding (`os.fork()`).
- Host filesystem probes (`open('/etc/passwd')` or Windows SAM/registry traversal).
- Network socket exfiltration (`urllib.request`, `socket.connect`, crypto miners).
- Memory-exhaustion payloads (`"A" * (10**9)`).
- Introspection / sandbox escape attempts (`__subclasses__()`, `ctypes`, `os.system`).

---

## 2. Fundamental Security Invariant

> **Never execute submitted Python code directly in the API process or host interpreter.**

### Why In-Process Sandboxing is Rejected
AST validation, restricted `builtins`, monkey-patched `__import__`, or Python-level timeouts (`signal.alarm`, threading timers) **DO NOT** constitute a secure sandbox. In Python, bytecode manipulation, C-extension invocation, memory manipulation via `ctypes`, and descriptor lookups render in-process sandboxing fundamentally insecure.

ECHO enforces a physical boundary: untrusted code execution occurs exclusively inside **ephemeral, isolated Linux container instances** with multi-layered OS-level containment.

---

## 3. Container Isolation Blueprint (Milestone 2 Specification)

When execution is active (Milestone 2 onwards), each execution request executes in a disposable runner container with the following non-negotiable security flags:

```bash
docker run --rm \
  --network none \
  --user 10001:10001 \
  --read-only \
  --tmpfs /tmp:rw,noexec,nosuid,size=16m \
  --cpus 0.5 \
  --memory 128m \
  --memory-swap 128m \
  --pids-limit 64 \
  --cap-drop ALL \
  --security-opt no-new-privileges:true \
  --volume <code_file_read_only>:/workspace/script.py:ro \
  echo-runner:latest python3 /tracer/trace_runner.py /workspace/script.py
```

### Key Security Controls
1. **Network Isolation:** `--network none` disables all network access (no external exfiltration, no local network port scanning).
2. **Non-Root Execution:** `--user 10001:10001` ensures the process runs without root privileges.
3. **Read-Only Filesystem:** The container root filesystem is mounted strictly read-only (`--read-only`). The only writable location is an in-memory `tmpfs` mounted with `noexec,nosuid`.
4. **No Docker Socket Access:** The host Docker socket (`/var/run/docker.sock` or `\\.\pipe\docker_engine`) is NEVER mounted or exposed to the execution container.
5. **No Host Filesystem Mounts:** Host directories are never mounted into untrusted execution containers. Only the single ephemeral source file is mounted read-only.
6. **Hard Limits:**
   - **CPU:** 0.5 vCPU maximum.
   - **Memory:** 128 MB RAM maximum (no swap).
   - **Processes:** Maximum 64 PIDs to mitigate fork bombs.
   - **Execution Time:** 3.0 seconds hard wall-clock timeout enforced by the host orchestrator.
   - **Output Size:** Max 64 KB stdout/stderr buffer.
   - **Trace Steps:** Max 500 execution events; excess steps abort with `TraceLimitExceeded`.
7. **Immediate Cleanup:** `--rm` ensures containers are destroyed upon completion or timeout.

---

## 4. Sandbox Failure Policy

If container isolation is unavailable (e.g. Docker daemon unreachable, container runner image not built):
- **ECHO will explicitly refuse to execute code.**
- It will return an informative error: `"Execution disabled: container sandbox unavailable"`.
- It will **NEVER** fall back to executing untrusted code on the host interpreter.

---

## 5. Secrets Management & API Protection

1. **Gemini API Keys:** Stored in backend `.env` or system environment variables (`GEMINI_API_KEY`).
2. **Never Committed:** `.gitignore` excludes all `.env` files. Only `.env.example` templates with empty placeholders are committed.
3. **Server-Side Only:** The Gemini API is called strictly by the FastAPI backend. Keys are never transmitted to or embedded in the Next.js frontend client bundle.
4. **CORS:** Configured explicitly to allow only authorized frontend origins (e.g., `http://localhost:3005`, `http://127.0.0.1:3005`).

---

## 6. Milestone 1 Security Stance

In Milestone 1:
- Code execution is **fully disabled** by design.
- The UI controls are visibly marked with informative badges indicating the execution engine status.
- The health endpoint (`/api/health`) inspects Docker readiness honestly and returns `sandbox_ready: false` (or `true` if Docker daemon is detected, with `execution_enabled: false` for M1).
- No simulated execution is passed off as real execution.
