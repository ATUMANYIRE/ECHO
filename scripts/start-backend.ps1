# Start ECHO FastAPI Backend on Windows
Write-Host "Starting ECHO Backend on port 8005..." -ForegroundColor Cyan

$env:PORT = "8005"
$env:HOST = "127.0.0.1"

if (Test-Path ".\backend\venv\Scripts\uvicorn.exe") {
    & ".\backend\venv\Scripts\uvicorn.exe" app.main:app --app-dir backend --host 127.0.0.1 --port 8005 --reload
} else {
    python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8005 --reload
}
