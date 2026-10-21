# ECHO Full Foundation Test Runner
Write-Host "=== Running ECHO Milestone 1 Foundation Tests ===" -ForegroundColor Cyan

Write-Host "`n[1/3] Running Backend Tests (pytest)..." -ForegroundColor Yellow
if (Test-Path ".\backend\venv\Scripts\pytest.exe") {
    & ".\backend\venv\Scripts\pytest.exe" backend\tests
} else {
    pytest backend\tests
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend tests failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n[2/3] Running Frontend Unit Tests (vitest)..." -ForegroundColor Yellow
npm test --prefix frontend

if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend unit tests failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n[3/3] Checking Frontend TypeScript Types..." -ForegroundColor Yellow
npm run type-check --prefix frontend

if ($LASTEXITCODE -ne 0) {
    Write-Host "TypeScript check failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== All Milestone 1 Foundation Tests Passed Successfully! ===" -ForegroundColor Green
