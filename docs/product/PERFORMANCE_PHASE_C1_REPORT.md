# Performance Optimization & Scalability Hardening — Phase C.1

**Status:** Partial completion (Critical/High engineering optimizations applied)  
**Date:** 2026-07-17  
**Scope:** Optimize existing implementations only — no new business features  

## Input status

Formal **Release Phase C** artefacts now live at [`docs/performance/phase-c/`](../performance/phase-c/README.md) (Executive Performance Report, bottleneck inventory, load/stress plans, roadmap). **This C.1 document records optimizations applied before that package existed.** Further C.1 work should follow the Phase C roadmap after approval.

Authoritative input used at time of original C.1:

| Source | Location |
|--------|----------|
| Performance Phase 1 (ECC measure + singletons) | `docs/product/PERFORMANCE_PHASE1_REPORT.md` |
| Prior production readiness findings (queues, headers, probes) | Epic 15 assessment (session) |

## Priority order followed

1. Critical — remaining avoidable wall-clock on integration cold start  
2. High — serial platform job runner; missing probes; empty Next performance config  
3. Medium/Low — deferred (see Remaining Opportunities)

---

## Optimizations completed

### 1. Parallel integration connector bootstrap

| Field | Detail |
|-------|--------|
| Issue | Cold integration init bootstrapped 10 connectors **sequentially** |
| Root cause | `for…of await bootstrap` in process singleton |
| Files | `src/lib/performance/singletons.ts` |
| Before | Wall time ≈ sum of 10 connector bootstraps (Phase 1 cold integrations **64.29 ms**) |
| After | Wall time ≈ max(connector bootstrap) under parallel `Promise.all` (same work, lower latency) |
| Validation | `tests/unit/performance/phase-c1.test.ts`, Phase 1 singleton tests |
| Impact | Faster ECC / exec first-hit warm-up after process recycle |

### 2. Parallel platform queue waves

| Field | Detail |
|-------|--------|
| Issue | `processAllPlatformQueues` ran 25+ jobs **strictly serially** |
| Root cause | Sequential `await` chain with no concurrency |
| Files | `src/lib/platform/automation/process-queues.ts` |
| Before | Wall time ≈ sum of all job durations |
| After | Independent jobs in `Promise.allSettled` waves; ordered pairs (instruction sync→process, finance sync→process) preserved; school insights/KPI snapshots parallelized |
| Validation | `tests/unit/platform/process-queues-parallel.test.ts` |
| Impact | Higher cron throughput; one failing job no longer blocks entire wave (resiliency) |

### 3. Next.js network / asset caching

| Field | Detail |
|-------|--------|
| Issue | Empty `next.config.ts` — no static cache headers / image format prefs |
| Root cause | Defaults unused |
| Files | `next.config.ts` |
| Before | No explicit static asset caching policy |
| After | `compress: true`, `poweredByHeader: false`, AVIF/WebP image formats, long-cache `/_next/static`, short-cache public images/fonts |
| Validation | Config compiles under `next build` / typecheck |
| Impact | Smaller image payloads when `next/image` used; better browser/CDN cache for hashed assets |

### 4. Health / readiness probes

| Field | Detail |
|-------|--------|
| Issue | No liveness/readiness endpoints for load balancers |
| Root cause | Observability gap |
| Files | `src/app/api/health/route.ts`, `src/app/api/ready/route.ts`, `src/lib/auth/must-reset-password.ts` (public API allowlist) |
| Before | No probe routes |
| After | `/api/health` (liveness), `/api/ready` (env readiness), both public + `Cache-Control: no-store` |
| Validation | Manual GET; unit path membership via public API set |
| Impact | Enables orchestration health checks without auth |

---

## Deliverables index

| # | Deliverable | Location |
|---|-------------|----------|
| 1 | Performance Optimization Report | this document |
| 2 | Scalability Hardening Report | `docs/product/SCALABILITY_HARDENING_C1.md` |
| 3 | Updated Benchmark Results | Section below + Phase 1 baselines retained |
| 4 | Before vs After | Per-optimization tables above |
| 5 | Database Optimization Summary | Deferred — no Phase C slow-query evidence |
| 6 | API Optimization Summary | Queue runner + probes |
| 7 | Frontend Optimization Summary | Static asset / image config only |
| 8 | Infrastructure Improvements | Probes + cache headers |
| 9 | Remaining Opportunities | See below |
| 10 | Production Performance Readiness | See quality gates |

---

## Updated benchmarks

### Retained Phase 1 baselines (local probe)

| Subsystem | Cold | Warm |
|-----------|------|------|
| Intelligence DI | 97.68 ms | 0 ms |
| Integrations bootstrap | 64.29 ms | 0 ms |

### C.1 expected delta (integrations cold)

Parallel bootstrap reduces **wall-clock** cold integrations toward the slowest single connector rather than the sum. Re-run:

```bash
npx tsx scripts/perf-probe.mts
npx vitest run tests/unit/performance/
```

Record new cold integrations ms in admin `/admin/performance` after deploy.

### Queue runner

No production load harness in-repo. Structural concurrency validated by unit test. Recommend instrumenting wall-clock around `processAllPlatformQueues` in the cron route next.

---

## Remaining optimization opportunities (not done)

| Priority | Item | Why deferred |
|----------|------|--------------|
| Critical* | Live DB slow-query + index campaign | Needs Phase C EXPLAIN / APM evidence |
| High | ECC Home loader (~85 ms Wisdom/OIOS CPU) | Needs profiled domain-lazy strategy without output drift |
| High | Distributed rate limiting / job leases / DLQ | Ops redesign beyond pure optimize |
| High | Load + stress test suites | Artefacts missing from Phase C |
| Medium | Shrink ECC client islands | UI structure change; measure first |
| Medium | Executive Graph query caching | Graph UI still placeholder |
| Medium | Cron cadence (daily → more frequent) | Product/ops decision |
| Low | Mobile performance | No native app (Epic 14) |
| High | Sentry / OpenTelemetry / dashboards | Sprint D1.5 still open |

\*If Phase C later supplies query plans, treat index work as Critical.

---

## Quality gates (Phase D entry)

| Gate | Status |
|------|--------|
| All Critical performance issues resolved | **Partial** — engineering Critical from Phase 1 backlog addressed; DB Critical unknown without Phase C |
| All High bottlenecks resolved or mitigated | **Partial** — queues + probes + Next config done; Home loader / load tests open |
| Database performance validated | **Not met** — no EXPLAIN suite |
| Load tests completed | **Not met** |
| Stress tests completed | **Not met** |
| Benchmarks improved | **Partial** — parallel bootstrap/queues; re-measure in prod |
| No functional regressions | **In progress** — unit tests added; run full CI |
| Monitoring/alerting validated | **Not met** — probes only |
| Documentation updated | **Met** for C.1 scope |

**Phase D readiness: NO** — proceed only after Phase C load/DB evidence is produced or accepted as risk, and remaining High items have owners.

---

## Explicit non-changes

- No new business features or workflow redesigns  
- Intelligence package domain logic untouched  
- Queue job **sets** unchanged (same processors invoked)  
- Public business API contracts unchanged  
