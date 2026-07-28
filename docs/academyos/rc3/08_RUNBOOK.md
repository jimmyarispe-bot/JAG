# AcademyOS RC-3 — Operations Runbook

## Daily

1. Review health: `GET /api/academyos/operations/health`
2. Skim monitoring trends for error-rate / latency regressions
3. Confirm connector catalog status remains Healthy/Warning

## Incident

1. Run diagnostics (`POST .../diagnostics`)
2. Triage actionable findings
3. If data corruption suspected → follow backup/recovery restore verification
4. Record outcomes in Studio release notes / PERs if Platform gaps appear

## Background jobs / queues

Queues are host-managed. Operators should monitor notification throughput and queue latency metrics from the monitoring API. Restart workers per host runbooks; AcademyOS pack does not ship a proprietary worker.

## Troubleshooting

| Symptom | First check |
|---------|-------------|
| Auth failures | Supabase URL / anon key |
| Email not sending | `RESEND_API_KEY` |
| Studio not Ready for RC-4 | `evaluateReleaseGates` blockers |
| Config warnings | `validateConfiguration()` recommendations |
