# Load Testing Results — Phase C / RC-2

| Field | Value |
|-------|-------|
| **Purpose** | Record load test outcomes |
| **Scope** | Auth, ECC, intelligence, admissions, SIS, scheduling, teacher, finance, HR, integrations |
| **Audience** | Eng, QA, release |
| **Version** | 2.0.0 |
| **Status** | **EXECUTED (RC-2 harness)** — see `docs/performance/rc2/` |

---

## Framework

- Runner: `npm run load:suite` (`scripts/load/`)
- Reports: `perf-load-report.json`, `perf-load-baselines.json`
- Narrative: `docs/performance/rc2/LOAD_RESILIENCE_REPORT.md`

## Result summary (latest local RC-2 run)

See generated JSON for exact numbers. Typical live auth-gate findings:

| Suite | Status | Notes |
|-------|--------|-------|
| Domain scenarios (10 VU) | Executed | Protected routes measured as 307 auth-gate without credentials |
| Concurrency ramp 10/50/100 | Executed | Health canary; 250/500 require `LOAD_MAX_VUS` + staging |
| Endurance | Executed (short default) | Set `LOAD_ENDURANCE_MS` for 6–24h staging soak |
| Failure injection | Executed | Local target + live health probes |
| Authenticated page load | Gap | Needs `LOAD_TEST_COOKIE` or email/password on staging |

**Gate: Load testing completed → PASS (harness) / READY_WITH_GAPS (staging auth + long soak)**

## Version history

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-07-17 | Plan only; not executed |
| 2.0.0 | 2026-07-19 | RC-2 Node/tsx harness executed |
