# claude-testreport.ps1 - run tests and leave a plain-text report Claude can read.
# (vitest cannot run on the mounted tree; node_modules is win32-native.)
#
#   .\claude-testreport.ps1
#   .\claude-testreport.ps1 -Path tests/unit/studio/js003-governance.test.ts
#   .\claude-testreport.ps1 -Path tests/unit/studio/js003-governance.test.ts -Name "maintains certification"
#
# ASCII ONLY - see the note in claude-ship.ps1.

param(
    [string[]]$Path = @("tests/unit"),
    [string]$Name = "",
    [switch]$Serial
)

Set-Location $PSScriptRoot
$env:NO_COLOR  = "1"
$env:FORCE_COLOR = "0"
$env:CI = "1"

$vitestArgs = @("vitest", "run") + $Path + @("--reporter=default", "--no-color")
if ($Name)   { $vitestArgs += @("-t", $Name) }
# -Serial removes cross-file contention. Use it when results move between runs:
# a suite that fails differently each time is measuring the machine, not the code.
if ($Serial) { $vitestArgs += "--no-file-parallelism" }

Write-Host "npx $($vitestArgs -join ' ')  ->  vitest-report.txt" -ForegroundColor Cyan

npx @vitestArgs 2>&1 |
  ForEach-Object { $_ -replace "\x1b\[[0-9;]*[A-Za-z]", "" } |
  Tee-Object -FilePath vitest-report.txt

$code = $LASTEXITCODE
Add-Content vitest-report.txt "`nVITEST_EXIT=$code"
Write-Host "`nDone. VITEST_EXIT=$code  (report: vitest-report.txt)" -ForegroundColor Yellow
