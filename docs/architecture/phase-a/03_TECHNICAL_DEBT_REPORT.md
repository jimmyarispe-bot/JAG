# 03 — Technical Debt Report

**Phase:** AcademyOS 1.0 Release Phase A (read-only)  
**Date:** 2026-07-17

> This report reflects **current** debt after Stabilization A1–A5, Architecture A.1, and Security B.1.  
> Historical rankings in `docs/architecture/audit/TECHNICAL_DEBT.md` are superseded where noted.

---

## Ranking legend

**Critical** → **High** → **Medium** → **Low** → **Informational**

Each item: description · impact · recommendation · affected files

---

## Critical

### TD-C1 — Ephemeral OIOS domain results

- **Description:** Domain repositories largely use in-memory stores (shared `intelligence/common` Map-backed repositories). No org-scoped durable result tables for wisdom/collective payloads comparable to product RLS tables.
- **Impact:** Process restart or multi-instance deploy loses or partitions assessments; no durable audit trail for executive decisions grounded in OIOS outputs; tenancy isolation depends on process discipline rather than DB RLS.
- **Recommendation:** Persist org/school-scoped results with RLS **or** formally declare and enforce “session/demo intelligence” product semantics (UI banners, API contracts, no production claims).
- **Affected files:**  
  `src/lib/platform/intelligence/common/in-memory-repository.ts`  
  `src/lib/platform/intelligence/*/repository.ts` (many domains)  
  `src/lib/exec/load-wisdom.ts`  
  `src/lib/exec/intelligence.ts`

### TD-C2 — Synthetic / baseline external intelligence presented without universal provenance

- **Description:** Late/external domains score from baselines and soft lights; exec wisdom explicitly returns `dataMode: "model-baseline"` and demo org scope, but not all surfaces may make this equally obvious.
- **Impact:** Decision liability; enterprise customers may treat simulated signals as live market/political truth.
- **Recommendation:** Provenance required on every executive surface; connectors for live feeds where claimed; otherwise keep “model-baseline” as a hard product rule with acceptance tests.
- **Affected files:**  
  `src/lib/exec/intelligence.ts` (`DEFAULT_EXEC_SCOPE` / `exec-demo-org`)  
  `src/lib/exec/load-wisdom.ts`  
  `src/lib/platform/intelligence/**/area-factory*` / baseline helpers (domain packages)  
  `src/app/exec/**`

### TD-C3 — Intelligence productization still uneven vs library completeness

- **Description:** Library DAG is complete through wisdom; product wiring exists for Exec Wisdom but AIP UI remains a separate governance hub; many domains lack first-class durable product APIs.
- **Impact:** Release messaging risk (“intelligence OS complete” vs “demo/exec surfaces”); support burden; incomplete enterprise workflows (approval, retention, replay).
- **Recommendation:** Define a single product contract for “production intelligence outcomes” (which modules, persistence SLA, provenance, authz). Wire only those; keep others library-only.
- **Affected files:**  
  `src/app/exec/**`  
  `src/app/dashboard/intelligence/**`  
  `src/lib/intelligence-platform/**`  
  `src/lib/platform/intelligence/**`

---

## High

### TD-H1 — Parallel intelligence product lineages

- **Description:** OIOS, AIP, Intelligence Network, EDI, Financial Intelligence, and `platform/executive-*` overlap in naming and user mental model.
- **Impact:** Wrong dependency choices; duplicated features; unclear source of truth for executives.
- **Recommendation:** Publish a canonical surface map; deprecate or rename confusing routes; ADRs for any intentional dual stack (already started for graph/finance).
- **Affected files:**  
  `src/lib/platform/intelligence/**`  
  `src/lib/intelligence-platform/**`  
  `src/lib/intelligence-network/**`  
  `src/lib/edi/**`  
  `src/lib/financial-intelligence/**`  
  `src/lib/platform/executive-*/**`  
  `src/app/dashboard/intelligence/**`  
  `src/app/dashboard/executive/**`  
  `src/app/exec/**`

### TD-H2 — Dual stacks (executive-graph, finance)

- **Description:** Intentional duplicates documented in ADR-A1-001 / ADR-A1-002 remain in tree.
- **Impact:** Import-path defects; review cost; onboarding friction.
- **Recommendation:** Enforce path lint / package README “canonical import”; eventually converge when product allows.
- **Affected files:**  
  `src/lib/platform/executive-graph/**`  
  `src/lib/platform/intelligence/executive-graph/**`  
  `src/lib/finance/**`  
  `src/lib/platform/finance/**`  
  `src/lib/platform/accounting/**`  
  `docs/architecture/adr/ADR-A1-001-executive-graph-packages.md`  
  `docs/architecture/adr/ADR-A1-002-platform-finance-vs-operational.md`

### TD-H3 — Sequential 39-module pipeline

- **Description:** Pipeline executes modules in topo order sequentially.
- **Impact:** Full wisdom latency ≈ sum of module times; poor scale for on-demand executive runs under load.
- **Recommendation:** Parallelize independent siblings; cache durable intermediate results; async job runner for full-graph runs.
- **Affected files:**  
  `src/lib/platform/intelligence/infrastructure/pipeline.ts` (and related runtime)  
  `src/lib/performance/**`

### TD-H4 — Process-global / request-keyed in-memory repositories

- **Description:** Shared Map stores keyed primarily by request/result ids; multi-tenant safety is not DB-enforced for OIOS results.
- **Impact:** Cross-request leakage risk in long-lived Node processes if keys collide or filters fail; horizontal scale inconsistency.
- **Recommendation:** Org-scoped keys + persistence; or isolate per-request stores with hard disposal.
- **Affected files:**  
  `src/lib/platform/intelligence/common/in-memory-repository.ts`  
  `src/lib/performance/singletons.ts`

### TD-H5 — Docs / catalog drift

- **Description:** Large architecture corpus; older reports list different domain inventories and scores; OIOS dormant keys vs MODULE_IDS mismatch is intentional but poorly socialized.
- **Impact:** Incorrect release decisions; wasted engineering; auditor confusion.
- **Recommendation:** Mark historical audits clearly; keep Phase A + constitution + `INTELLIGENCE_MODULE_IDS` as current sources of truth.
- **Affected files:**  
  `docs/architecture/CURRENT_ARCHITECTURE_REPORT.md`  
  `docs/architecture/INTELLIGENCE_DOMAIN_MODEL.md`  
  `docs/architecture/audit/**`  
  `src/lib/platform/oios/**`  
  `src/lib/platform/intelligence/infrastructure/types.ts`

### TD-H6 — Dual workflow engines (`workflow` vs `workflows`)

- **Description:** Platform Workflow Engine vs Executive Workflow Engine share near-identical naming.
- **Impact:** Wrong engine imported; registry confusion.
- **Recommendation:** Rename executive engine package/public API (`executive-workflows`) or nest under `executive/`.
- **Affected files:**  
  `src/lib/platform/workflow/**`  
  `src/lib/platform/workflows/**`

### TD-H7 — CompetitiveIntelligence name collision

- **Description:** Two exported classes with the same name in market vs competitive domains.
- **Impact:** Ambiguous imports; review/tools confusion.
- **Recommendation:** Rename market submodule class to `MarketCompetitiveIntelligence` (or similar).
- **Affected files:**  
  `src/lib/platform/intelligence/market/competitive-intelligence.ts`  
  `src/lib/platform/intelligence/competitive/competitive-intelligence.ts`

### TD-H8 — Foundation adapter test gaps (residual)

- **Description:** Historical gap: dedicated unit files for some foundation adapters (`organization-health`, pipeline `financial`, `founder`) may still be thinner than late domains.
- **Impact:** Regression risk at the base of the DAG.
- **Recommendation:** Add adapter-level tests mirroring late-domain coverage.
- **Affected files:**  
  `tests/unit/intelligence/**`  
  `src/lib/platform/intelligence/infrastructure/modules/**`

### TD-H9 — Vault / secrets / env onboarding residue

- **Description:** B.1 hardened vault key requirements; `.env.example` tracking and env schema discipline still operationally sensitive.
- **Impact:** Misconfiguration in new environments.
- **Recommendation:** Track sanitized `.env.example`; fail closed in all production-like envs (align with security checklist).
- **Affected files:**  
  `src/lib/integration-hub/vault-crypto.ts`  
  `src/lib/platform/env/schema.ts`  
  `docs/launch/PRODUCTION_ENV.md`

### TD-H10 — CI/unit-suite gate gap

- **Description:** Full Vitest unit suite is not run in GitHub Actions; CI favors integration + smoke.
- **Impact:** Intelligence/IAM/security unit regressions can merge undetected.
- **Recommendation:** Gate `npm run test` on PRs (shard if needed).
- **Affected files:**  
  `.github/workflows/ci.yml`  
  `package.json`  
  `tests/unit/**`

### TD-H11 — Intelligence barrel + Mission Control hub modules

- **Description:** Mega `intelligence/index.ts` barrel and `mission-control-compose.ts` concentrate cross-domain coupling.
- **Impact:** Compile/import cost; change amplification.
- **Recommendation:** Narrow exports; split composer into facet ports.
- **Affected files:**  
  `src/lib/platform/intelligence/index.ts`  
  `src/lib/platform/automation/mission-control-compose.ts`

---

## Medium

### TD-M1 — Residual `ResultLightBase` duplication (~16 domains)

- **Description:** Shared scoring/repos extracted; light DTO base still redefined per domain `types.ts`.
- **Impact:** Drift in light shapes; copy-paste edits.
- **Recommendation:** Extract shared base carefully without breaking frozen public types (re-export strategy).
- **Affected files:**  
  `src/lib/platform/intelligence/*/types.ts` (impact…wisdom cluster)

### TD-M2 — Late-domain engine boilerplate

- **Description:** Forecast/trend/scenario/analysis/early-warning/closed-learning-loop shells remain near-copies across packages.
- **Impact:** High change cost; generator drift.
- **Recommendation:** Parameterized shared engines when packages are allowed to change; until then freeze + document.
- **Affected files:**  
  `src/lib/platform/intelligence/{behavioral,cultural,ethical,systems,resilience,ecosystem,collective,wisdom,*}/**`

### TD-M3 — Generator / package drift

- **Description:** `scripts/generate-*-intelligence.mjs` and ethical write chains can diverge from hand-edited packages.
- **Impact:** Inconsistent domains; unsafe regen.
- **Recommendation:** Single schema-driven generator or lock scripts as historical-only.
- **Affected files:**  
  `scripts/generate-*-intelligence.mjs`  
  `scripts/generate-ethical-part2.mjs`

### TD-M4 — Filename artifacts (`*-intelligence-intelligence.ts`)

- **Description:** Generator naming residue in a few packages.
- **Impact:** Searchability / professionalism.
- **Recommendation:** Rename on next intentional touch.
- **Affected files:** Files matching `*-intelligence-intelligence.ts` under `src/lib/platform/intelligence/`

### TD-M5 — Folder vs module id mismatch (`predictive-intelligence/` vs `predictive`)

- **Description:** Directory name does not match pipeline id.
- **Impact:** Cognitive load.
- **Recommendation:** Alias docs or rename folder in a dedicated cleanup PR.
- **Affected files:**  
  `src/lib/platform/intelligence/predictive-intelligence/**`

### TD-M6 — Knowledge (040) vs Institutional Memory (058) conceptual overlap

- **Description:** Adjacent memory concepts with different maturity.
- **Impact:** Dual maintenance; soft-read confusion.
- **Recommendation:** Ownership matrix in OIOS docs; forbid hard edges between them.
- **Affected files:**  
  `src/lib/platform/intelligence/knowledge/**`  
  `src/lib/platform/intelligence/institutional-memory/**`

### TD-M7 — Orchestrator stage TODOs

- **Description:** Stabilization A5 retained ~14 orchestrator TODOs (persistence, authorize, outcome measurement).
- **Impact:** Incomplete foundation stages behind the domain DAG.
- **Recommendation:** Product backlog items with explicit non-goals until scheduled.
- **Affected files:**  
  `src/lib/platform/intelligence/orchestrator/**` (and stage services)

### TD-M8 — Middleware authz snapshot cost on every gated request

- **Description:** Centralized authz loads snapshot in middleware for routes with required permissions.
- **Impact:** Latency/DB load under traffic; correctness benefit is high.
- **Recommendation:** Cache snapshot per session with invalidation; measure in Phase C.
- **Affected files:**  
  `middleware.ts`  
  `src/lib/platform/identity/load-authz-snapshot.ts`

### TD-M9 — Presentation / marketing routes inside app tree

- **Description:** Large `presentation/micms-leadership` slide deck routes coexist with ERP.
- **Impact:** Route noise; build surface area.
- **Recommendation:** Isolate or lazy-gate non-product surfaces for production builds if needed.
- **Affected files:**  
  `src/app/presentation/**`  
  `src/components/presentation/**`

### TD-M10 — Manual `database.ts` types drift

- **Description:** No generated types from Supabase schema.
- **Impact:** Silent type/schema skew after migrations.
- **Recommendation:** Adopt generated types in CI or periodic sync job.
- **Affected files:**  
  `src/types/database.ts`  
  `supabase/migrations/**`

### TD-M11 — Duplicate collaboration-engine naming across domains

- **Description:** Multiple `collaboration-engine.ts` files in behavioral/cultural/collective/ecosystem.
- **Impact:** Ambiguous navigation.
- **Recommendation:** Prefix with domain name.
- **Affected files:**  
  `src/lib/platform/intelligence/**/collaboration-engine.ts`

### TD-M12 — Admin scholarship legacy route

- **Description:** `/admin/scholarships` sits outside primary dashboard IA.
- **Impact:** Authz/matcher special cases; legacy UX.
- **Recommendation:** Migrate under dashboard admin or document as permanent exception.
- **Affected files:**  
  `src/app/admin/scholarships/page.tsx`  
  `middleware.ts`

---

## Low

### TD-L1 — Organization / organization-dna / organization-health naming proximity  
### TD-L2 — Test file naming traps (e.g. finance vs financial intelligence)  
### TD-L3 — In-memory pipeline cache not shared across instances  
### TD-L4 — Meta packages adjacent to product domains (`dashboard/`, `memory/`, `founder/`)  
### TD-L5 — Graph edges without linked durable result payloads  
### TD-L6 — Multiple `knowledge-contribution.ts` drafts across domains  
### TD-L7 — OIOS dormant catalog keys (`legal`/`compliance`/`risk`)  
### TD-L8 — Legacy public aliases retained for compatibility  

*(Details omitted for brevity; track on touch. Evidence in domain trees under `src/lib/platform/intelligence/` and `tests/unit/intelligence/`.)*

---

## Informational (resolved / non-debt)

| ID | Note |
|----|------|
| TD-I1 | Scoring helper duplication (old TD-C4) — **largely addressed** via `intelligence/common` |
| TD-I2 | God `create-service.ts` (old TD-H1) — **addressed** via modular registration |
| TD-I3 | Shared Map repository pattern — **partially addressed** (common helper exists; still in-memory) |
| TD-I4 | A.1 Critical RLS (PAJ/ULR/payroll) — **remediated in migration 171** (ops must apply) |
| TD-I5 | B.1 Critical/High security items — **remediated in code** (ops/checklist remain) |
| TD-I6 | Stabilization A5 declared architecture refactoring **complete** — further work should be product-facing unless gates require otherwise |

---

## Debt themes (2026-07-17)

1. **Productization & durability** of OIOS outcomes (not more domain packages).  
2. **Cognitive load** from parallel intelligence/finance/executive stacks.  
3. **Scale model** of the sequential in-memory pipeline.  
4. **Documentation truth** vs a very large historical corpus.  

Burn-down order: see `07_PRIORITIZED_REMEDIATION_PLAN.md`.
