# 05 — Scalability Assessment

| Field | Value |
|-------|--------|
| **Phase** | D |
| **Date** | 2026-07-17 |
| **Score** | **52 / 100** |

---

## Capacity model (not load-tested)

| Workload | Comfortable | Stress cliff |
|----------|-------------|--------------|
| Students per school (list UIs) | ≤ 2–3k | ≥ 8–10k unbounded select |
| Concurrent portal/dashboard users | 150–400 / region | Auth + DB pool saturation |
| Full intelligence DAG runs | Low tens concurrent | Depth × AI latency |
| Daily cron queue | Current school cap (~20 insights) | Fan-out without leases/DLQ |

---

## Vertical scaling

**Ready:** larger Node instances and larger Postgres help CPU-bound stages and index scans.  
**Limit:** unbounded queries and process Maps still amplify memory linearly with data.

## Horizontal scaling

**Partial ready:** stateless Next routes scale out.  
**Not ready:** process singletons, in-memory intelligence/integration stores, memory rate limits — require sticky sessions or externalize state (Redis / DB).

## Multi-tenant

RLS + `school_id` indexes support isolation. Scalability fails first on **application list shape**, not on missing school_id columns.

---

## Readiness matrix

| Capability | Ready? |
|------------|--------|
| Single-school launch (≤2k students) | **Yes** (conditional on mig 171–173) |
| Multi-school org, moderate concurrency | **Conditional** |
| 10k students / school lists | **No** |
| Multi-region active-active intelligence | **No** |
