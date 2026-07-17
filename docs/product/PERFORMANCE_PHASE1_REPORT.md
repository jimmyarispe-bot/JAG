# Performance Phase 1 Report — Sprint D1

**Branch:** `sprint-047-performance`  
**Status:** Complete (measure → detect → proven singleton fixes only)  
**Admin surface:** `/admin/performance`  
**Date:** 2026-07-13  

## Objective

Determine why Executive Command Center pages feel slow. Measure before optimizing. No features, no intelligence package changes, no business-logic changes, no API contract changes.

## What we measured

| Signal | How |
|--------|-----|
| Server render / loader time | `runPerformanceProbe()` times each ECC loader |
| Intelligence startup | Cold `createIntelligenceService()` vs warm process singleton |
| Integration startup | Cold platform + 10× sequential bootstrap vs warm singleton |
| Organization resolution | `resolveExecutiveContextForIdentity` span |
| Connector sync | `ensureAcademyOsSynced` + `ensureSquareSynced` |
| Cache hits / misses | Singleton already-initialized vs cold |
| Client hydration | `/admin/performance` hydration island |
| Bundle / client components | Static inventory of `app/**` + `components/exec` |
| Route surface | Count of `page.tsx` / `route.ts` files |
| Middleware | Matcher audit (`/exec` excluded) |

## Baseline findings (before process singletons)

React `cache()` only dedupes **within one request**. Every navigation still paid:

1. **Full intelligence DI rebuild** — `createIntelligenceService()` + 39-module composition  
2. **Full integration platform recreate** — new `IntegrationPersistence` + **10 sequential `bootstrap()`** calls (register → configure → authenticate → validate → connect → initialSync → monitor)

Connector **stores** (`academyOsStore`, `squareStore`) were already process-global, so sync could short-circuit, but bootstrap still ran every request.

## Measured numbers (local probe)

Captured via `npx tsx scripts/perf-probe.mts` after Phase 1 singletons landed (warm path = post-fix).

### Cold vs warm

| Subsystem | Cold | Warm (singleton) |
|-----------|------|------------------|
| Intelligence DI | **97.68 ms** | **0 ms** |
| Integrations bootstrap | **64.29 ms** | **0 ms** |

First process singleton init (this run): intelligence **6.95 ms**, integrations **12.66 ms** (second create after cold bench; production first hit ≈ cold column).

### Route timing report (warm singletons)

| Route | Total | Intelligence | Integrations | Sync | Loader | Org resolve |
|-------|------:|-------------:|-------------:|-----:|-------:|------------:|
| `/exec` Home | 93.04 | 0.05 | 0.03 | 0.91 | **85.27** | 6.78 |
| `/exec/brief` | 11.21 | 0.01 | 0.02 | 0.10 | 10.95 | 0.13 |
| `/exec/health` | 4.64 | 0.01 | 0.01 | 0.10 | 4.40 | 0.12 |
| `/exec/opportunities` | 5.65 | 0.01 | 0.01 | 0.05 | 5.47 | 0.11 |
| `/exec/wisdom` | 4.28 | 0.01 | 0.01 | 0.08 | 4.06 | 0.12 |
| `/exec/risks` | 21.79 | 0.01 | 0.01 | 0.13 | 21.51 | 0.13 |

**Interpretation:** After eliminating duplicate init, **Home loader CPU (Wisdom + OIOS + Opportunity builds)** dominates remaining server time (~85 ms). Auth/layout Supabase waterfalls are **not** included in this probe (layout runs separately in real requests).

### Bundle / route inventory

| Metric | Value |
|--------|------:|
| App route files (`page`/`route`) | **282** |
| ECC page routes | 8 |
| ECC client components (`"use client"`) | 6 |
| ECC server-ish files | 17 |

Client boundaries: `ExecShell`, `ExecNav`, `OpportunityPage`, `WisdomPage`, `IntegrationsPage`, `IntegrationDetailPage`.

## Bottleneck report

| ID | Severity | Finding |
|----|----------|---------|
| `dup-intelligence-init` | critical | Per-request DI rebuild (~98 ms cold) |
| `dup-integration-bootstrap` | critical | Per-request platform + 10× bootstrap (~64+ ms cold) |
| `large-route-surface` | medium | 282 route files — scale pressure on build/nav |
| `exec-client-bundles` | medium | Full-page client components for tabs/filters |
| `sequential-domain-builds` | medium | Home/Brief build oios → wisdom → opportunity on one thread |
| `exec-layout-auth-waterfall` | medium | Auth + identity + org resolve before children |
| `middleware-not-on-exec` | low | `/exec` auth deferred to layout |

## Proven optimizations applied (behavior unchanged)

| Change | Why proven | Where |
|--------|------------|-------|
| Process singleton for intelligence | Cold 98 ms → warm 0 ms | `src/lib/performance/singletons.ts` + `src/lib/exec/intelligence.ts` |
| Process singleton for integrations | Cold 64 ms → warm 0 ms | same + `src/lib/exec/integration-platform.ts` |

React `cache()` retained for per-request dedupe. Same service instances; no intelligence package edits; no loader output changes.

**Not applied (not proven as wall-clock wins on sync CPU):** wrapping sync `.build()` in `Promise.all` — single-threaded JS still runs them serially.

## Recommended fixes (next)

1. **Home loader cost** — profile Wisdom/OIOS build internals; consider lazy domain stacks (still no behavior change if outputs match).  
2. **Client islands** — shrink Opportunity/Wisdom/Integrations to tab islands; keep page bodies as Server Components.  
3. **Layout auth** — parallelize remaining identity queries; optional `/exec` middleware early-reject.  
4. **Route surface** — archive unused dashboards; route-group lazy loading.  
5. **Sprint D1.5 — Production Observability** — Sentry, OpenTelemetry, Vercel Analytics, Speed Insights, request/DB/integration timing.

### Phase C.1 follow-up (2026-07-17)

Applied without changing business outputs:

- Parallel connector bootstrap in `src/lib/performance/singletons.ts`  
- Parallel queue waves in `src/lib/platform/automation/process-queues.ts`  
- Next.js static cache headers + image formats  
- `/api/health` and `/api/ready` probes  

See `docs/product/PERFORMANCE_PHASE_C1_REPORT.md`.

## Deliverables

| Artifact | Location |
|----------|----------|
| Measurement harness | `src/lib/performance/**` |
| Admin dashboard | `/admin/performance` |
| Probe script | `scripts/perf-probe.mts` |
| Tests | `tests/unit/performance/phase1.test.ts` |
| This report | `docs/product/PERFORMANCE_PHASE1_REPORT.md` |

### Admin dashboard shows

- Page / route render timings  
- Cold vs warm intelligence & integrations  
- Cache hits / misses  
- Hydration meter (client island)  
- Bundle / client-component report  
- Bottleneck detections  
- Recent traces  

## Validation

```bash
npx vitest run tests/unit/performance/phase1.test.ts
npm test
npm run build
```

## Explicit non-changes

- Intelligence packages untouched  
- OIOS dependency graph untouched  
- Business logic / loader outputs unchanged  
- Public business APIs unchanged  

## Success criteria

We now know where ECC time goes: **duplicate DI/bootstrap was the primary avoidable cost**; **Home domain builds dominate remaining server time**; **282 routes and several fat client pages** are secondary scale risks. Process singletons remove the proven duplicate work without changing behavior.
