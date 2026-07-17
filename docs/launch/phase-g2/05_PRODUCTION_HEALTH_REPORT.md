# 5. Production Health Report

| Field | Value |
|-------|-------|
| **Status** | **NOT MEASURED** — no production cutover |

## Probe design (repo)

| Probe | Path | Behavior |
|-------|------|----------|
| Liveness | `GET /api/health` | Process up; no dependency checks |
| Readiness | `GET /api/ready` | Requires `NEXT_PUBLIC_SUPABASE_URL` + `ANON_KEY`; **no DB ping** |

> Phase C / F note: readiness is shallow — may report Ready during Supabase outage. Tracked as residual observability risk.

## Metrics (target at go-live)

| Metric | Target | Actual |
|--------|--------|--------|
| Availability | ≥ agreed SLO | N/A |
| Error rate | Within budget | N/A |
| API p95 | Within budget | N/A |
| Queue lag | Within budget | N/A |
