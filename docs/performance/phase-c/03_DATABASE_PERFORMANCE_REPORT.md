# Database Performance Report — Phase C

| Field | Value |
|-------|-------|
| **Purpose** | Document query/index risks from static analysis |
| **Scope** | Migrations + query modules |
| **Audience** | DBAs, eng |
| **Prerequisites** | Supabase access for EXPLAIN (not run in this phase) |
| **Version** | 1.0.0 |

---

## Measurement status

| Metric | Status |
|--------|--------|
| Average query time | **Not measured** (no APM) |
| p95 / p99 | **Not measured** |
| EXPLAIN plans | **Not captured** |

Indexes: **200+** `CREATE INDEX` statements across migrations (positive). Application list loaders often ignore pagination.

---

## Critical / High findings

| ID | Sev | Finding | Evidence |
|----|-----|---------|----------|
| DB-01 | Critical | `getStudents()` unbounded `select(*, schools, campuses, families)` + funding fan-in | `src/lib/students/queries.ts` |
| DB-02 | Critical | `getLeads()` unbounded | `src/lib/admissions/queries.ts` |
| DB-03 | High | `getFamilies()` pattern unbounded (same module family) | `students/queries.ts` |
| DB-04 | High | Executive network dashboard loads five `rpt_*` with `select("*")` no limit | `executive/network-dashboard.ts` |
| DB-05 | High | N+1 state funding reconciliation per award | `admissions/state-funding.ts` |
| DB-06 | High | N+1 family medical profiles per student | `families/profile/sections.ts` |
| DB-07 | High | Compliance dashboard/overdue scans unbounded | `compliance/queries.ts`, `reports.ts` |
| DB-08 | High | Scheduling courses/sections/sessions unbounded | `scheduling/queries.ts` |
| DB-09 | Medium | Leading-wildcard `ilike %term%` search | `platform/identity/search.ts` |
| DB-10 | Medium | Sequential graph edge writes | `intelligence-graph/persistence/records.ts` |
| DB-11 | Medium | Widespread `select("*")` | Many modules |
| DB-12 | Low | Strong index coverage on core FKs | migrations |

---

## Pagination / materialized views

| Opportunity | Notes |
|-------------|-------|
| Cursor/limit on students/leads/families | **Required** before 10k scale |
| Server-side search indexes (trigram) | For `%term%` searches |
| Materialized `rpt_*` refresh | Views may already be heavy; validate with EXPLAIN |
| Keyset pagination for attendance/scheduling day views | Morning rush |

---

## Procedures (for C.1 measurement — not executed here)

1. Enable Supabase slow query logging.  
2. EXPLAIN ANALYZE top loaders with synthetic 10k rows.  
3. Record p50/p95 from Vercel + DB.  
4. Only then add indexes / rewrite queries.

## Troubleshooting

| Symptom | Likely |
|---------|--------|
| Dashboard blank/timeout | Unbounded list |
| Slow search | Leading `%` ilike |

## Related documents

- `10_PRIORITIZED_OPTIMIZATION_ROADMAP.md`
- `docs/security/phase-b/03_RLS_VALIDATION_REPORT.md` (RLS cost interacts with queries)

## Version history

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-07-17 | Static analysis |
