# claude-testreport.ps1 — run the unit suite and leave a plain-text report
# Claude can read (vitest can't run on the mounted tree; node_modules is win32-native).
Set-Location $PSScriptRoot
$env:NO_COLOR = "1"
$env:FORCE_COLOR = "0"
$env:CI = "1"
Write-Host "Running tests/unit -> vitest-report.txt ..." -ForegroundColor Cyan
npx vitest run tests/unit --reporter=default --no-color 2>&1 |
  ForEach-Object { $_ -replace "\x1b\[[0-9;]*[A-Za-z]", "" } |
  Tee-Object -FilePath vitest-report.txt
$code = $LASTEXITCODE
Add-Content vitest-report.txt "`nVITEST_EXIT=$code"
Write-Host "`nDone. VITEST_EXIT=$code  (report: vitest-report.txt)" -ForegroundColor Yellow
