# Scalability Hardening Report — Phase C.1

**Date:** 2026-07-17  
**Companion:** `docs/product/PERFORMANCE_PHASE_C1_REPORT.md`

## Target scale (from Release Phase C.1 brief)

| Dimension | Target |
|-----------|--------|
| Organizations | 100+ |
| Schools | 500+ |
| Students | 100,000+ |
| Employees | 25,000+ |
| Parents | 100,000+ |
| Peaks | Attendance morning, enrollment, billing, executive reporting |

## What C.1 improved toward scale

| Area | Change | Scalability effect |
|------|--------|-------------------|
| Background jobs | Parallel waves + per-school fan-out | Cron window shrinks as school count grows (up to limit 20 today) |
| Integration cold start | Parallel connector bootstrap | Faster worker/process recycle under multi-instance deploy |
| Edge caching | Static asset Cache-Control | Reduces origin load for hashed assets |
| Probes | `/api/health`, `/api/ready` | Safe horizontal scale behind LB |

## Hardening still required before claiming target scale

1. **Raise/remove `schools.limit(20)`** in queue insights/KPI only after DB + job lease design — current hard limit is a silent scalability ceiling.  
2. **Connection pool / Supabase** — parallel waves increase concurrent queries; validate pool size under load.  
3. **Live RLS + tenant isolation tests** at multi-org volume (security + correctness at scale).  
4. **Load/stress suites** for attendance, portal, grading, finance, executive — **missing**.  
5. **Job idempotency + DLQ + leases** — parallel waves tolerate failure better but do not retry with backoff.  
6. **Materialized / reporting views** — `rpt_*` exist; refresh strategy under 100k students unproven.  
7. **In-memory rate limiter** — not multi-instance safe (Epic 15).  

## Production scale readiness

**Not validated.** C.1 removes avoidable serial bottlenecks but does **not** demonstrate 100k-student / 100-org operation. Do not enter Release Phase D solely on C.1 changes.
