# Production Gap Analysis — JAG v1.0

> **Still relevant for product/ops gaps** (UI, persistence, integrations).  
> Architecture duplication items were reduced by Stabilization A1–A4. See `../STABILIZATION_A5_CLEANUP.md`.

**Branch:** `v1.0-stabilization`  
**Date:** July 13, 2026  
**Question:** What prevents production deployment of JAG as an organizational intelligence product?

---

## Scope clarification

JAG contains multiple product surfaces:

| Surface | Production readiness (relative) |
|---------|----------------------------------|
| School platform (admissions, identity, dashboards) | Closer — Supabase + RLS + env checklist |
| Executive / Financial Intelligence product tables | Closer — migrations + RLS exist |
| AIP (AI readiness hub) | Architecture-only / simulated providers |
| OIOS 39-module intelligence pipeline (→ wisdom) | Library-complete; **not productized** |

This report emphasizes gaps for **shipping OIOS intelligence outcomes** and notes platform-wide blockers.

---

## Critical blockers

### 1. Domain intelligence results are not durable

- Repositories under `src/lib/platform/intelligence/**/repository.ts` use in-memory `Map`s.  
- No migrations for wisdom/collective/domain assessment payloads.  
- Process restart / multi-instance deploy loses or isolates results.  

**Required for production:** Persist results with `organization_id` (+ school scope) and RLS, or explicitly ship as non-durable session intelligence.

### 2. External / late domains are synthetic

- Area factories score from baselines and soft upstream lights.  
- No connectors for market, political, environmental, competitive live feeds.  
- Generator scripts encode template behavior.  

**Risk:** Presenting outputs as authoritative operational truth without labels/provenance.

**Required:** Live connectors + provenance, or UI labeling (“simulated / model-based”).

### 3. No product UI/API for terminal intelligence

- `src/app` has no routes consuming wisdom/collective.  
- `dashboard/intelligence/*` is AIP governance, not the OIOS pipeline.  

**Required:** Executive wisdom brief UI and/or authenticated API that runs/caches pipeline results.

---

## High gaps

| Gap | Evidence | Production impact |
|-----|----------|-------------------|
| Sequential 39-module pipeline | `pipeline.ts` for-loop | Latency / cost for full wisdom run |
| Multi-tenant isolation at repo layer | Global Map keyed by requestId | Cross-request leakage risk in shared Node process |
| Missing foundation adapter tests | organization-health, financial, founder | Regression risk |
| Secret fallback patterns | Vault key → service role | Key reuse / blast radius |
| AIP simulated providers | UI architecture notices | Cannot claim production AI routing |
| Catalog/docs drift | Stale domain model docs | Operator confusion |

---

## Medium gaps

| Gap | Notes |
|-----|-------|
| `.env.example` not tracked | Onboarding depends on PRODUCTION_ENV copy-paste |
| organization-health empty hard deps | Fragile DAG ordering |
| No Redis/shared cache for pipeline | Multi-instance cache miss |
| Graph edges persist without result payloads | Incomplete audit trail |
| Codegen maintenance | Drift between scripts and packages |
| SendGrid/cron env required for full platform | Documented in PRODUCTION_ENV.md |

---

## Low gaps

| Gap | Notes |
|-----|-------|
| Naming collisions | CompetitiveIntelligence dual class |
| Test file naming | finance.test.ts confusion |
| Dormant OIOS keys | legal/compliance/risk reserved |

---

## What is production-ready (partial)

These areas have stronger production foundations than the late OIOS domains:

- Supabase auth patterns (`@supabase/ssr`)  
- Extensive RLS migrations for product domains  
- Platform registry validators in `npm run build`  
- Production env documentation (`docs/launch/PRODUCTION_ENV.md`)  
- Stabilization checklist for founder dashboard routes (historical)  
- Lean dependency set (Next/React/Supabase)  

---

## Production readiness matrix

| Capability | Status |
|------------|--------|
| Auth | Present (Supabase) |
| Multi-tenant org model | Present in product tables |
| Intelligence result persistence | **Missing** |
| Intelligence RLS | **Missing** |
| Live external data | **Missing** |
| Wisdom UI | **Missing** |
| Pipeline observability (latency, cost) | Limited (in-memory metrics/cache) |
| Typecheck / unit tests | Strong for library |
| E2E smoke | Playwright present; not full intelligence E2E |
| Secrets management | Documented; vault fallback concern |
| Horizontal scale of pipeline | Weak (sequential + in-memory) |

---

## Minimum viable production paths

### Path A — Session intelligence (faster)

1. Label all late-domain outputs as model-based / non-durable.  
2. Run pipeline on demand for authenticated org leaders.  
3. Cache results per org for TTL only.  
4. Ship wisdom brief UI.  

### Path B — Durable intelligence (recommended)

1. Persist `*Result` summaries + briefs with org scope + RLS.  
2. Add provenance fields (sources, confidence, generatedAt).  
3. Connect priority external signals incrementally (start with market/competitive).  
4. Async job runner for full 39-module runs (avoid request-thread blocking).  
5. Executive dashboard + board report PDF/export.  

---

## Exit criteria for “intelligence production”

- [ ] Results durable with org RLS  
- [ ] Provenance + simulation labels where data is synthetic  
- [ ] Wisdom/collective exposed in product UI or public API contract  
- [ ] Pipeline SLA measured; fail-soft for non-critical modules  
- [ ] Secrets without service-role fallback for vault  
- [ ] Docs match `INTELLIGENCE_MODULE_IDS`  
- [ ] Multi-instance safe stores/cache strategy  

Until these are met, treat OIOS late domains as **architecture-complete library**, not production intelligence SaaS.
