# 04 — Backend Performance

| Field | Value |
|-------|--------|
| **Phase** | D |
| **Date** | 2026-07-17 |

---

## Applied

| Area | Change |
|------|--------|
| Shared intelligence context | Parallel provider loads (`Promise.all`) |
| Intelligence pipeline | Concurrent Kahn waves via `resolveWaves` |
| Prior C.1 (still in force) | Parallel connector bootstrap; parallel queue waves; compress/cache headers; health/ready |

---

## Middleware

`middleware.ts` runs `supabase.auth.getUser()` then `loadAuthzSnapshot` + `authorizeRoute` for protected pages/APIs. Cost is intentional for security (Phase C). **Do not** cache authz across users without TTL + session key (see `CACHING_STRATEGY.md`).

---

## API / Server Actions

| Class | Status |
|-------|--------|
| Health / ready | Present; production ready checks expanded in Phase C |
| Cron `/api/...` | Secret-gated |
| Uncapped exports/reports | Residual High — do not widen without caps |
| Admissions actions that process all queues | Residual Critical pattern |

---

## Concurrency model

| Layer | Model |
|-------|-------|
| Request handlers | Node async; Vercel serverless instances |
| Platform queues | Wave `Promise.allSettled` |
| Intelligence modules | Wave `Promise.all` (siblings only) |
| Rate limits | Upstash → RPC → memory |

---

## Memory / CPU hotspots (modeled)

| Hotspot | Notes |
|---------|-------|
| Unbounded list materialization | Heap + JSON serialize |
| Full intelligence platform composition | Cold path |
| Connector ensure-* fan-out | Mitigated by parallel ensure on exec home |
| In-memory OIOS / demo stores | Process growth; multi-instance divergence |
