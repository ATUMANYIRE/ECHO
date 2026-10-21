# ECHO Full Milestone 4 Test Runner
Write-Host "=== Running ECHO Milestone 4 Automated Test Suites ===" -ForegroundColor Cyan

Write-Host "`n[1/4] Running Backend Tests (pytest: evaluation benchmark, prompt-injection, sandbox, contracts)..." -ForegroundColor Yellow
Push-Location backend
if (Test-Path ".\venv\Scripts\pytest.exe") {
    & ".\venv\Scripts\pytest.exe" -v
} else {
    pytest -v
}
$backendCode = $LASTEXITCODE
Pop-Location

if ($backendCode -ne 0) {
    Write-Host "Backend tests failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n[2/4] Running Frontend Unit Tests (vitest: api, timeline analysis, investigation, workspace)..." -ForegroundColor Yellow
npm test --prefix frontend

if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend unit tests failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n[3/4] Checking Frontend TypeScript Types (strict mode)..." -ForegroundColor Yellow
npm run type-check --prefix frontend

if ($LASTEXITCODE -ne 0) {
    Write-Host "TypeScript check failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n[4/4] Running Playwright E2E Browser Suite (replay, evolution, comparison, AI investigation, verification)..." -ForegroundColor Yellow
Push-Location frontend
npx playwright test
$playwrightCode = $LASTEXITCODE
Pop-Location

if ($playwrightCode -ne 0) {
    Write-Host "Playwright E2E tests failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== All ECHO Milestone 4 Tests (79 automated tests) Passed Successfully! ===" -ForegroundColor Green
