# claude-ship.ps1 - one command to verify and ship what Claude staged.
#
# Claude can read, write and stage files in this repo over the device bridge, and
# can run tsc there, but it cannot delete files - and `git commit` must unlink
# .git/index.lock to finish. It also cannot run vitest on the mounted tree,
# because node_modules holds Windows-native binaries (rollup, esbuild).
#
# So Claude prepares and stages; this script verifies and ships.
#
# The test gate compares this run's failures against tests/known-failures.json
# rather than demanding a green suite. The suite carries long-standing failures
# (Studio repo scanner, command-center catalog drift, a slow-machine timeout)
# that have nothing to do with any given commit; blocking on them blocks
# everything forever. What must never pass is a failure this commit introduced.
#
#   .\claude-ship.ps1                  verify + commit + push
#   .\claude-ship.ps1 -VerifyOnly      verify only, change nothing
#   .\claude-ship.ps1 -UpdateBaseline  re-record known-failures.json, then stop
#
# ASCII ONLY. Windows PowerShell 5.1 reads a BOM-less .ps1 as CP1252, where a
# UTF-8 em dash decodes to a smart quote and silently terminates a string. This
# file is written UTF-8-with-BOM; keep it ASCII anyway.

param(
    [switch]$VerifyOnly,
    [switch]$UpdateBaseline,
    [string]$Branch = "production",
    [int]$Workers = 4
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$BaselineFile = "tests/known-failures.json"
$ResultsFile  = "vitest-results.json"

# A collapsed run (bad import, worker crash) reports zero failures because it
# reported almost nothing. Refuse to read that as a pass.
$MinTestsExpected = 2000

function Step($n) { Write-Host "`n=== $n ===" -ForegroundColor Cyan }
function Die($m)  { Write-Host "`nFAILED: $m" -ForegroundColor Red; exit 1 }

# Claude leaves this behind when a commit attempt dies on the unlink restriction.
if (Test-Path ".git\index.lock") {
    Step "Clearing stale index.lock"
    try {
        Remove-Item ".git\index.lock" -Force -ErrorAction Stop
        Write-Host "removed" -ForegroundColor Yellow
    } catch {
        # Not always stale: an editor's source-control panel or a live git
        # process holds a real handle on this file. Deleting it under a running
        # git would corrupt the index, so name the holder instead of forcing.
        Write-Host "could not remove .git\index.lock - another process holds it." -ForegroundColor Red
        $holders = Get-Process git, git-lfs, git-remote-https -ErrorAction SilentlyContinue
        if ($holders) {
            Write-Host "Live git processes:" -ForegroundColor Yellow
            $holders | ForEach-Object { Write-Host ("  PID {0}  {1}" -f $_.Id, $_.ProcessName) }
            Write-Host "Let them finish, or: Stop-Process -Id <pid>" -ForegroundColor DarkGray
        } else {
            Write-Host "No git process is running, so an editor is holding the handle." -ForegroundColor DarkGray
            Write-Host "Close the source-control panel (or reload the window) and retry." -ForegroundColor DarkGray
        }
        Die "index.lock is held - nothing committed"
    }
}

Step "Staged for commit"
$staged = git diff --cached --name-only
if (-not $staged) {
    if (-not $UpdateBaseline -and -not $VerifyOnly) {
        Write-Host "nothing staged, exiting" -ForegroundColor Yellow
        exit 0
    }
    Write-Host "nothing staged (verify / baseline only)" -ForegroundColor Yellow
} else {
    $staged | ForEach-Object { Write-Host "  $_" }
}

Step "Typecheck"
npx tsc --noEmit
if ($LASTEXITCODE -ne 0) { Die "tsc reported errors, nothing committed" }
Write-Host "clean" -ForegroundColor Green

Step "Client boundaries"
# tsc cannot see this one. A client component that imports a module which
# reaches next/headers typechecks perfectly and dies in the production build -
# which is what happened on 27 Aug, ten minutes into a deploy, with production
# left a commit behind. This walks the import graph out of every "use client"
# file in about a second.
node scripts/check-client-boundaries.mjs
if ($LASTEXITCODE -ne 0) { Die "a client component reaches server-only code, nothing committed" }

Step "Tests"
if (Test-Path $ResultsFile) { Remove-Item $ResultsFile -Force }
$env:NO_COLOR = "1"
# Capped workers, deliberately. Unbounded, vitest runs ~13 threads on this
# machine and the workers start missing their own RPC deadlines - vitest prints
# "[vitest-worker]: Timeout calling onTaskUpdate ... This might cause false
# positive tests" and then fails tests that pass in isolation. A gate that
# invents failures is a gate you learn to ignore, so trade wall-clock for a
# verdict you can trust. Raise with -Workers if the machine is idle.
npx vitest run tests/unit --reporter=json --outputFile=$ResultsFile --maxWorkers=$Workers --minWorkers=1
if (-not (Test-Path $ResultsFile)) { Die "vitest wrote no JSON report, cannot judge the run" }

$report = Get-Content $ResultsFile -Raw | ConvertFrom-Json
$total  = [int]$report.numTotalTests
if ($total -lt $MinTestsExpected) {
    Die "only $total tests ran (expected at least $MinTestsExpected). The run collapsed; this is not a pass"
}

$root = ((Get-Location).Path -replace '\\', '/').TrimEnd('/')
$current = @()
foreach ($file in $report.testResults) {
    $rel = ($file.name -replace '\\', '/')
    if ($rel.StartsWith($root)) { $rel = $rel.Substring($root.Length) }
    $rel = $rel.TrimStart('/')
    foreach ($a in $file.assertionResults) {
        if ($a.status -eq 'failed') { $current += "$rel :: $($a.fullName)" }
    }
}
$current = @($current | Sort-Object -Unique)

Write-Host "$($current.Count) failing of $total tests" -ForegroundColor Yellow

if ($UpdateBaseline) {
    # Write UTF-8 without a BOM. Set-Content -Encoding utf8 on PS 5.1 emits one,
    # and a BOM riding at the head of the file corrupts the first entry on read.
    $bodyJson = if ($current.Count -eq 0) { "[]" } else { ConvertTo-Json -InputObject $current -Depth 3 }
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText((Join-Path (Get-Location).Path $BaselineFile), $bodyJson, $utf8NoBom)
    Write-Host "`nBaseline recorded: $BaselineFile ($($current.Count) known failures)." -ForegroundColor Green
    Write-Host "Review it, then run .\claude-ship.ps1 to ship." -ForegroundColor Green
    exit 0
}

$baseline = @()
if (Test-Path $BaselineFile) {
    $raw = [System.IO.File]::ReadAllText((Resolve-Path $BaselineFile).Path)
    $raw = $raw.TrimStart([char]0xFEFF).Trim()
    if ($raw) { $baseline = @([string[]](ConvertFrom-Json $raw)) }
    # Always say what was loaded. A baseline that silently reads as empty turns
    # every known failure into a "new" one, which is exactly how this gate lies.
    Write-Host "baseline loaded: $($baseline.Count) known failures" -ForegroundColor DarkGray
} else {
    Write-Host "NO BASELINE FILE at $BaselineFile - every failure counts as new" -ForegroundColor Yellow
}

# HashSet, not -contains. Membership over a few thousand strings should not be
# a linear scan, and this keeps the comparison ordinal rather than PowerShell's
# looser operator semantics.
$baseSet = New-Object 'System.Collections.Generic.HashSet[string]' (,[string[]]$baseline)
$curSet  = New-Object 'System.Collections.Generic.HashSet[string]' (,[string[]]$current)

$newFailures = @($current  | Where-Object { -not $baseSet.Contains($_) })
$nowPassing  = @($baseline | Where-Object { -not $curSet.Contains($_) })

if ($nowPassing.Count -gt 0) {
    Step "Newly passing, baseline is stale"
    $nowPassing | ForEach-Object { Write-Host "  + $_" -ForegroundColor Green }
    Write-Host "  Prune with: .\claude-ship.ps1 -UpdateBaseline" -ForegroundColor DarkGray
}

if ($newFailures.Count -gt 0) {
    Step "NEW failures, not in the baseline"
    $newFailures | ForEach-Object { Write-Host "  x $_" -ForegroundColor Red }
    Die "$($newFailures.Count) new test failure(s), nothing committed"
}

Write-Host "no new failures ($($baseline.Count) known, pre-existing)" -ForegroundColor Green

if ($VerifyOnly) {
    Write-Host "`nVerify-only: stopping before commit." -ForegroundColor Yellow
    exit 0
}

Step "Commit"
if (-not (Test-Path ".claude-commit-message.txt")) {
    Die "no .claude-commit-message.txt, ask Claude to write one"
}
git commit -F ".claude-commit-message.txt"
if ($LASTEXITCODE -ne 0) { Die "commit failed" }
Remove-Item ".claude-commit-message.txt" -Force

Step "Push -> $Branch"
git push origin HEAD:$Branch
if ($LASTEXITCODE -ne 0) { Die "push failed" }

Write-Host "`nShipped. Vercel is building." -ForegroundColor Green
git log --oneline -1
