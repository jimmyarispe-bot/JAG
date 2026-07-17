# 02 — Database Optimization

| Field | Value |
|-------|--------|
| **Phase** | D |
| **Date** | 2026-07-17 |

---

## Applied

### Migration `173_phase_d_list_query_indexes.sql`

| Index | Purpose |
|-------|---------|
| `idx_students_school_id_last_name` | School-scoped student directory `ORDER BY last_name` |
| `idx_admissions_leads_school_id_created_at` | School-scoped lead lists `ORDER BY created_at DESC` |
| `idx_families_school_id_family_name` | Family directory sort under tenancy |

**Ops:** apply with migrations `171`+`172` on every environment. Additive `CREATE INDEX IF NOT EXISTS` only.

---

## Residual Critical / High (not changed — behavior risk)

| ID | Issue | Why not changed in D |
|----|-------|----------------------|
| DB-01 | `getStudents()` unbounded wide select | Hard limit would truncate UI lists (business behavior) |
| DB-02 | `getLeads()` unbounded | Same |
| DB-03+ | Families / compliance / scheduling unbounded | Same class |
| DB-05/06 | N+1 funding / medical | Requires query rewrite with behavior-preserving batching review |

---

## Recommended next indexes (not shipped)

| Candidate | Rationale |
|-----------|-----------|
| `pg_trgm` on identity search columns | Leading-wildcard `ilike` |
| Partial indexes on active enrollment / open leads | Hot filters |
| Covering indexes for report `rpt_*` drivers | After EXPLAIN |

---

## RLS performance note

RLS policies correctly enforce tenancy; at large row counts, **always pair policies with matching `(school_id, …)` indexes** (Phase D composites help list paths). No policy changes in Phase D.

---

## Measurement gap

No production `EXPLAIN ANALYZE` / pg_stat_statements capture in this phase. Treat index benefit as **expected**, not measured.
