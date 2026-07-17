# Load Testing Results — Phase C

| Field | Value |
|-------|-------|
| **Purpose** | Record load test outcomes for Phase C gates |
| **Scope** | Admissions, scheduling, attendance, teacher, portals, finance, exec, reports |
| **Audience** | Eng, QA, release |
| **Version** | 1.0.0 |
| **Status** | **NOT EXECUTED** |

---

## Result summary

| Suite | Status | Throughput | Latency | Error rate |
|-------|--------|------------|---------|------------|
| Admissions CRM | **Not run** | — | — | — |
| Scheduling | **Not run** | — | — | — |
| Attendance rush | **Not run** | — | — | — |
| Teacher workspace | **Not run** | — | — | — |
| Parent portal | **Not run** | — | — | — |
| Student portal | **Not run** | — | — | — |
| Finance | **Not run** | — | — | — |
| Executive dashboards | **Not run** | — | — | — |
| Reports / exports | **Not run** | — | — | — |

**Gate: Load testing completed → FAIL**

---

## Repeatable plan (for Wave C.1 evidence)

### Prerequisites
- Staging project with seeded data approaching target scale (or synthetic).  
- Tooling: k6 or Artillery (not yet in repo).  
- Auth fixtures for role personas.  
- Capture Vercel + Supabase metrics during run.

### Suggested scenarios

| ID | Scenario | VUs | Duration | Pass criteria (initial) |
|----|----------|-----|----------|-------------------------|
| L1 | Parent portal home | 200 | 10 min | p95 &lt; 2s, error &lt; 1% |
| L2 | Teacher studio | 100 | 10 min | p95 &lt; 2s |
| L3 | Students list (paginated*) | 50 | 10 min | p95 &lt; 3s (*after fix) |
| L4 | Admissions leads list | 50 | 10 min | p95 &lt; 3s |
| L5 | Attendance submit burst | 200 | 5 min | error &lt; 1% |
| L6 | Finance board export | 10 | 5 min | complete &lt; 30s or 413/stream |
| L7 | Exec dashboard concurrent | 50 | 10 min | p95 &lt; 3s |
| L8 | Cron drain manual | 1 | — | finishes &lt; function timeout |

\*Current unbounded lists will fail L3/L4 — expected; documents need for P0.

### Outputs to attach
- Raw tool JSON  
- p50/p95/p99 tables  
- Error samples  
- DB CPU/connections charts  

## Related documents

- `08_STRESS_TESTING_RESULTS.md`
- `10_PRIORITIZED_OPTIMIZATION_ROADMAP.md`

## Version history

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-07-17 | Plan only; not executed |
