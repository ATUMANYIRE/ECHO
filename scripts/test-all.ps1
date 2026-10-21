# ECHO Full Milestone 3 Test Runner
Write-Host "=== Running ECHO Milestone 3 Automated Test Suites ===" -ForegroundColor Cyan

Write-Host "`n[1/4] Running Backend Tests (pytest with isolated Docker sandbox & benchmarks)..." -ForegroundColor Yellow
if (Test-Path ".\backend\venv\Scripts\pytest.exe") {
    & ".\backend\venv\Scripts\pytest.exe" backend\tests -v
} else {
    pytest backend\tests -v
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend tests failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n[2/4] Running Frontend Unit Tests (vitest: api, timeline analysis & workspace)..." -ForegroundColor Yellow
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

Write-Host "`n[4/4] Running Playwright E2E Browser Suite (replay, evolution, comparison, benchmarks)..." -ForegroundColor Yellow
Push-Location frontend
npx playwright test
$playwrightCode = $LASTEXITCODE
Pop-Location

if ($playwrightCode -ne 0) {
    Write-Host "Playwright E2E tests failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== All ECHO Milestone 3 Tests (49 automated tests) Passed Successfully! ===" -ForegroundColor Green
