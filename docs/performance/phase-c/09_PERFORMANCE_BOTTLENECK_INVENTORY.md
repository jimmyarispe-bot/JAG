# Performance Bottleneck Inventory — Phase C

| Field | Value |
|-------|-------|
| **Purpose** | Master list of ranked bottlenecks with evidence |
| **Scope** | Entire platform (static + prior probes) |
| **Audience** | Eng leads, release |
| **Version** | 1.0.0 |

---

## Critical

| ID | Bottleneck | Evidence |
|----|------------|----------|
| DB-01 | Unbounded `getStudents()` wide select | `src/lib/students/queries.ts` |
| DB-02 | Unbounded `getLeads()` | `src/lib/admissions/queries.ts` |
| API-01 | Server Action runs full platform queue processor | `admissions/automation/server-actions.ts` |

## High

| ID | Bottleneck | Evidence |
|----|------------|----------|
| DB-03–08 | Unbounded families/compliance/scheduling; N+1 funding/medical; rpt_* full scans | See DB report |
| API-02–04 | Uncapped reports/exports; exec board fan-out | API report |
| FE-01–02 | Client dashboard shell; missing loading states | Frontend report |
| JOB-01 | Daily cron + school insight cap 20 | `process-queues.ts`, `vercel.json` |
| JOB-02 | No orchestrator DLQ / lease | `process-queues.ts` |
| RES-01 | No circuit breakers / global timeouts | Grep negative |
| OBS-01 | Ready probe no DB ping; no APM | `api/ready` |
| LOAD-01 | Load/stress suites absent | This package |

## Medium

| ID | Bottleneck | Evidence |
|----|------------|----------|
| DB-09–11 | `ilike %x%`, sequential graph edges, `select("*")` | DB report |
| FE-03–05 | Client density, no dynamic import, no virtualization | Frontend |
| API-05–07 | 5k export cap, in-memory rate limit, authz RTTs | API |
| AI-01 | Sequential context providers | `intelligence/context/builder.ts` |
| NET-01 | No HTML cache policy documentation | next.config |

## Low

| ID | Bottleneck | Evidence |
|----|------------|----------|
| DB-12 | Index coverage good — residual | migrations |
| FE-06 | Server Component pages | Positive |
| MOB-01 | No mobile API (out of scope) | — |

## Already mitigated (prior work — do not re-count as open Critical)

| Item | Doc |
|------|-----|
| Parallel integration bootstrap | PERFORMANCE_PHASE_C1_REPORT |
| Parallel queue waves | same |
| Next compress/static cache | `next.config.ts` |
| Health/ready endpoints | `api/health`, `api/ready` |
| Intelligence DI singleton | Phase 1 report |

## Related documents

- `10_PRIORITIZED_OPTIMIZATION_ROADMAP.md`

## Version history

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-07-17 | Initial |
