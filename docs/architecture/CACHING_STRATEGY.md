# Caching Strategy (Phase C.1 baseline + Phase D notes)

## Layers in use

| Layer | Mechanism | Scope | Invalidation |
|-------|-----------|-------|----------------|
| Process singleton | `src/lib/performance/singletons.ts` | Intelligence DI + integration management | Process recycle |
| React `cache()` | ECC loaders / request helpers | Single request | End of request |
| Intelligence module cache | Pipeline TTL (`pipeline.cacheTtlMs`) | Process | TTL / `bypassCache` |
| Connector stores | AcademyOS / Square / etc. module stores | Process | Sync freshness windows in ensure-* helpers |
| Browser / CDN | `next.config.ts` headers on `/_next/static` + static media | Client | Content hash (immutable) or max-age |

## Rules

1. **Do not cache authorization decisions** across requests without explicit TTL + user/session key.  
2. **Do not cache tenant-scoped financial or SpEd payloads** in shared process memory without org/school keys.  
3. Singleton services must remain **pure composition** — no per-tenant mutable state on the singleton itself.  
4. Prefer **short TTL or explicit invalidate** for executive aggregates once dashboard caching is added.

## Phase D note

Shared intelligence context providers load in **parallel** within a request. That is concurrency, not a new cache layer. Intelligence pipeline Kahn waves likewise parallelize independent modules only.

## Planned (not implemented)

- API response cache for read-only KPI snapshots with school-scoped keys  
- Executive Graph query cache (blocked on graph UI delivery)  
- Redis / edge KV for multi-instance rate limits and shared job leases  
