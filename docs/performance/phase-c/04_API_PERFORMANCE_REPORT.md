# API & Server Performance Report — Phase C

| Field | Value |
|-------|-------|
| **Purpose** | Profile API routes, Server Actions, authz, workers (static) |
| **Scope** | `src/app/api`, actions, automation |
| **Audience** | Backend eng |
| **Version** | 1.0.0 |

---

## Measurement status

Latency / memory / CPU / concurrency under load: **not measured** (no harness). Structural risks below.

---

## Findings

| ID | Sev | Finding | Evidence |
|----|-----|---------|----------|
| API-01 | Critical | Server Action can invoke full `processAllPlatformQueues` | `admissions/automation/server-actions.ts` |
| API-02 | High | Work/compliance report routes unbounded | `api/work/reports`, `api/compliance/reports` |
| API-03 | High | Configuration export full org JSON | `api/configuration/export` |
| API-04 | High | Executive board export fans out 8+ loaders | `executive/reporting.ts` |
| API-05 | Medium | EDP export capped 5000 — still large | `enterprise-data/export-engine.ts` |
| API-06 | Medium | Rate limit in-memory; scholarship-only | `api-rate-limit.ts` |
| API-07 | Medium | Authz may add round-trips per request | identity guards |
| API-08 | Low | Auth client React `cache()` — good | `server-auth.ts` |
| API-09 | Low | Health/ready fast but ready shallow | `api/health`, `api/ready` |

---

## Background / AI / uploads

| Area | Note |
|------|------|
| Queue cron | Daily; parallel waves (prior C.1) |
| AI context API | Builds secure context; no provider call in route — CPU light today |
| File uploads | Storage via Supabase; signed URL cost not profiled |
| Auth | Supabase-hosted latency |

## Related documents

- `docs/operations/phase-f/03_API_DOCUMENTATION.md`
- `07_LOAD_TESTING_RESULTS.md`

## Version history

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-07-17 | Static |
