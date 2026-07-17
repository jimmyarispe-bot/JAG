# Prioritized Optimization Roadmap — Phase C → C.1

| Field | Value |
|-------|-------|
| **Purpose** | Rank remediations; **no code changes until approval** |
| **Scope** | Performance/scalability only — no features |
| **Audience** | Release + eng |
| **Version** | 1.0.0 |

---

## Rule

Phase C = measure/document.  
Implement only after **`proceed Wave C.1`** (or listed IDs).  
Prefer evidence: seed staging → load test → then optimize where metrics prove need (except obvious unbounded lists which are code-proven).

---

## Wave C.1 — Critical / High (blockers)

| Order | ID | Action | Done when |
|-------|-----|--------|-----------|
| 1 | LOAD-01 | Add k6/Artillery harness + seed script; run L1–L8 on staging | Results attached to `07_*` |
| 2 | DB-01/02/03 | Paginate + project columns for students/leads/families | Limits enforced; list UX pageable |
| 3 | DB-05/06 | Eliminate N+1 (batch queries) | Query count O(1) per page |
| 4 | API-02/03/04 | Cap/stream exports; rate-limit export routes | Hard max rows + 429 |
| 5 | API-01 | Remove/guard Server Action full-queue run (cron-only) | Action cannot run 25+ jobs casually |
| 6 | DB-04/07/08 | Bound compliance/scheduling/rpt dashboard queries | Limits or server aggregates |
| 7 | OBS-01 | Deep ready (DB ping) + basic APM (Sentry or OTel) | Outage detected; errors visible |
| 8 | JOB-01/02 | Raise school cap with chunking; job leases/DLQ | 100 schools; failed jobs retryable |
| 9 | FE-01/02 | Server shell + client islands; `loading.tsx` on top modules | Smaller hydration; perceived speed |
| 10 | RES-01 | Timeouts on external calls; circuit breaker for connectors | Failures shed load |
| 11 | STRESS | Execute stress plan; document break/recovery | `08_*` filled |

## Wave C.2 — Medium

- Trigram/search index strategy for `ilike`  
- `next/dynamic` for heavy charts/panels  
- Table virtualization for large grids  
- Parallelize AI context providers  
- Redis rate limit  
- Cron cadence review (ops product decision)  
- Bundle analyzer CI  

## Wave C.3 — Hardening

- Materialized view strategy for heavy `rpt_*`  
- Connection pooler runbook validation under load  
- Mobile/PWA only if product prioritizes  
- Continuous perf budgets in CI  

---

## Explicit non-goals for C.1

- New business features  
- SpEd product build  
- Native mobile app  
- Redesigning executive IA (UX Phase D)

---

## Approval gate

Reply **`proceed Wave C.1`** to implement P0/P1 optimizations and/or execute load harness.

## Related documents

- `00_EXECUTIVE_PERFORMANCE_REPORT.md`
- `docs/product/PERFORMANCE_PHASE_C1_REPORT.md` (prior partial work)

## Version history

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-07-17 | Roadmap only |
