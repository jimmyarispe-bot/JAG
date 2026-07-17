# 06 — Query Analysis

| Field | Value |
|-------|--------|
| **Phase** | D |
| **Date** | 2026-07-17 |

---

## Slowest query classes (static ranking)

| Rank | Query / loader | Why slow at scale |
|------|----------------|-------------------|
| 1 | `getStudents()` | `select *` + joins + funding batch over **all** rows |
| 2 | `getLeads()` | Full table order by `created_at` |
| 3 | `getFamilies()` | Unbounded directory |
| 4 | Compliance / scheduling list scans | Unbounded |
| 5 | Executive `rpt_*` `select("*")` | Wide reporting rows |
| 6 | State funding reconciliation | N+1 per award |
| 7 | Family medical profiles | N+1 per student |
| 8 | Identity `ilike %term%` | Cannot use BTREE efficiently |
| 9 | Graph edge sequential writes | Latency × edge count |
| 10 | Stage history “all rows” analytics | Full history pull |

---

## Duplicate / N+1 patterns

| Pattern | Mitigation status |
|---------|-------------------|
| Funding codes after student/lead lists | Already batched by ID list (good) |
| Medical / funding award loops | Still N+1 |
| React request duplicates | `cache()` + singletons |

---

## Phase D index alignment

List queries that filter by `school_id` and sort by name/date now have matching composite indexes in migration **173** (pending apply).

---

## Recommended query shape (future — not applied)

```ts
// Illustrative — do not treat as shipped API
.eq("school_id", schoolId)
.order("last_name")
.range(offset, offset + pageSize - 1)
```

Preserve caller contracts via explicit pagination parameters in a dedicated follow-on phase.
