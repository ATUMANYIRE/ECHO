# ECHO Full Foundation & Milestone 2 Test Runner
Write-Host "=== Running ECHO Milestone 2 Automated Test Suites ===" -ForegroundColor Cyan

Write-Host "`n[1/3] Running Backend Tests (pytest with isolated Docker sandbox)..." -ForegroundColor Yellow
if (Test-Path ".\backend\venv\Scripts\pytest.exe") {
    & ".\backend\venv\Scripts\pytest.exe" backend\tests -v
} else {
    pytest backend\tests -v
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

Write-Host "`n=== All ECHO Milestone 2 Tests Passed Successfully! ===" -ForegroundColor Green
