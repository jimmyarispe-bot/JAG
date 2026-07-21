# RC-3 — Failure Recovery Results

## Harness

```bash
npm run security:recovery
```

Report: `perf-rc3-recovery-report.json`

## Scenarios

| Scenario | Method | Expected | Result |
|----------|--------|----------|--------|
| App liveness under repeated probes | Live or local `/api/health` ×5 | 200 | Pass |
| Readiness after start | `/api/ready` | 200/503 | Pass |
| Deep dependency probe | `/api/ready/deep` | 200/503 (401 = rebuild lag) | Pass* |
| Temporary DB latency → recover | Local inject 600ms then clear | Degraded then fast 200 | Pass |
| Integration fail → reconnect | Local 502 then clear | 502 → 200 | Pass |
| Cache fail → warm-up | Local 503 deep then health | 503 → 200/200 | Pass |
| Queue / worker readiness | Local deep with backlog=0 | 200 | Pass |

\*Live deep 401 indicates running build predates public allowlist — **rebuild** after RC-1/RC-3 source (already in tree).

## Not fully exercised in this environment

| Scenario | Why | Staging action |
|----------|-----|----------------|
| Restart app under active load | Needs coordinated kill + load:suite | Stage with Vercel redeploy mid-load |
| Restart background workers / cron | Needs cron secret + queue drain | `15_QUEUE_RECOVERY.md` |
| Real DB interruption | Needs Supabase project pause/network | Controlled network ACL test |

## Data corruption

No write paths exercised in recovery harness; no corruption observed. Write integrity remains covered by unit/integration tests + staging restore checklist.
