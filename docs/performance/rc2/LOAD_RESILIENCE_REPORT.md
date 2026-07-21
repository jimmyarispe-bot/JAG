# RC-2 Load, Scalability & Resilience Report

Generated: 2026-07-19T00:50:22.742Z
Mode: mixed · Base URL: http://127.0.0.1:3000
Auth configured: false
Release readiness: **ready_with_gaps** — Public/auth-gate load + failure injection passed; authenticated page latency baselines need LOAD_TEST credentials on staging.

## Scenario latency

| Scenario | Domain | VU | Req | RPS | p50 | p95 | p99 | Error |
|----------|--------|----|-----|-----|-----|-----|-----|-------|
| auth.login | authentication | 10 | 242 | 53.78 | 138.73 | 610.57 | 750.94 | 0 |
| auth.health | authentication | 10 | 1495 | 371.34 | 25.32 | 38.73 | 54.51 | 0 |
| exec.home | executive_command_center | 10 | 2705 | 673.05 | 14.02 | 22.6 | 31.45 | 0 |
| exec.brief | executive_command_center | 10 | 2393 | 595.27 | 15.5 | 26.54 | 32 | 0 |
| intel.executive | executive_intelligence | 10 | 3536 | 881.8 | 10.8 | 17.12 | 23.41 | 0 |
| intel.decisions | executive_intelligence | 10 | 3123 | 778.41 | 11.74 | 21.15 | 28.03 | 0 |
| admissions.home | admissions | 10 | 3477 | 867.3 | 11.02 | 17.53 | 25.46 | 0 |
| sis.students | sis | 10 | 3875 | 966.82 | 9.92 | 16.66 | 21.89 | 0 |
| scheduling.home | scheduling | 10 | 3992 | 997.25 | 9.61 | 16.57 | 23.44 | 0 |
| teacher.home | teacher | 10 | 3534 | 881.3 | 10.82 | 17.93 | 25.65 | 0 |
| finance.home | finance | 10 | 3664 | 913.49 | 10.23 | 17.55 | 26.74 | 0 |
| hr.home | hr | 10 | 3529 | 880.05 | 10.98 | 17.46 | 23.1 | 0 |
| integrations.home | integrations | 10 | 3914 | 977.03 | 9.5 | 16.94 | 23.52 | 0 |
| integrations.exec | integrations | 10 | 4045 | 1008.98 | 9.45 | 16.04 | 23.06 | 0 |
| ops.ready | ops | 10 | 2034 | 506.47 | 18.11 | 30.06 | 42.22 | 0 |

## Concurrency ramp

| VU | p50 | p95 | p99 | RPS | Error |
|----|-----|-----|-----|-----|-------|
| 10 | 18.22 | 27.84 | 41.66 | 510.7 | 0 |
| 50 | 93.2 | 139.64 | 158.2 | 501.22 | 0 |
| 100 | 185.1 | 229.74 | 254.09 | 519.71 | 0 |

## Endurance

Duration: 30000 ms
Requests: 8392, p95: 264.62 ms, error: 0
- Heap used Δ -42.45 MB (62.28 → 19.83)
- RSS Δ 3.12 MB (251.37 → 254.49)
- Heap growth within expected warm-up band
- CPU time accumulated on runner: 7219 ms

## Failure injection

- PASS **Integration timeout** — status=504 duration=5008.33ms (Upstream timeout simulated; caller should degrade without crashing process)
- PASS **Temporary database latency** — status=200 duration=811.01ms (Deep health reflects DB latency; liveness should remain ok)
- PASS **Liveness during DB latency** — status=200 (Graceful degradation: liveness independent of deep deps)
- PASS **Queue backlog** — status=200 (Queue pressure surfaced in deep health (not process crash))
- PASS **Cache failure** — status=503 (Cache failure visible to readiness; cheap /api/ready still usable for LB)
- PASS **External API failure** — integration=502 alerts=200 (Failure propagates to alert evaluation endpoint)
- PASS **Retry then recovery** — statuses=503,503,200 (Models integration retry recovery behavior)
- PASS **Live liveness** — status=200 (Production health endpoint responding)
- PASS **Live readiness** — status=200 (Readiness probe reachable)
- PASS **Live deep readiness** — status=401 (401: running build has not published /api/ready/deep as public — rebuild after RC-1 allowlist)

## Database

Source: live
Deep ready: 401
DB p95 (metrics): n/a
Slow queries: n/a
Connection pool utilization and lock contention: use Supabase dashboard during load.

## Issues

- [info] Authenticated load not configured (LOAD_TEST_COOKIE or email/password) → Set credentials against staging for full page baselines
- [warning] Live /api/ready/deep returned 401 — running build predates public deep-ready allowlist → Rebuild and restart so middleware public paths include /api/ready/deep
- [info] `next start` requires production env (APP_URL, CRON_SECRET, RESEND_API_KEY, VAULT_ENCRYPTION_KEY) or instrumentation fails and the server accepts no traffic → Ensure production secrets are present before load tests against `next start`
- [info] Endurance duration 30000ms (< 1h). For RC soak set LOAD_ENDURANCE_MS to 6–24h on staging.
