# 06 — Architecture Risk Register

**Phase:** AcademyOS 1.0 Release Phase A (read-only)  
**Date:** 2026-07-17

Severity scale: **Critical · High · Medium · Low · Informational**

---

## Critical

### C-A1 — Non-durable OIOS intelligence results

| Field | Content |
|-------|---------|
| **Severity** | Critical |
| **Description** | Domain assessment repositories are in-memory (shared Map infrastructure). Wisdom/collective outputs are not durable org-scoped records with RLS. |
| **Impact** | Loss on restart; multi-instance inconsistency; weak auditability for executive decisions; tenancy not enforced at persistence layer. |
| **Recommendation** | Persist with org/school scope + RLS, or formally ship as session/demo intelligence with contractual UI/API labeling and no production durability claims. |
| **Affected files** | `src/lib/platform/intelligence/common/in-memory-repository.ts`; `src/lib/platform/intelligence/*/repository.ts`; `src/lib/exec/load-wisdom.ts`; `src/lib/performance/singletons.ts` |

### C-A2 — Synthetic intelligence / demo tenant default on executive surfaces

| Field | Content |
|-------|---------|
| **Severity** | Critical |
| **Description** | Exec DI helper defaults to `organizationId: "exec-demo-org"`; wisdom loader returns `dataMode: "model-baseline"`. External domains are largely baseline/template driven. |
| **Impact** | Enterprise decision risk if operators treat outputs as live tenant truth; compliance/trust failure. |
| **Recommendation** | Bind to authenticated tenant; require provenance banners; gate demo mode; connect live data where product claims live intelligence. |
| **Affected files** | `src/lib/exec/intelligence.ts`; `src/lib/exec/load-wisdom.ts`; `src/app/exec/**`; late domain baseline/area factories under `src/lib/platform/intelligence/**` |

### C-A3 — Incomplete enterprise product contract for “production intelligence”

| Field | Content |
|-------|---------|
| **Severity** | Critical |
| **Description** | Library DAG is complete, but durable product contract (retention, replay, approvals, authz, SLA) for terminal intelligence is not fully defined/implemented across surfaces. AIP remains a separate governance hub. |
| **Impact** | Release overclaim risk; support and liability exposure; fragmented executive workflows. |
| **Recommendation** | Write and implement a single Production Intelligence Contract; map modules to prod vs library-only. |
| **Affected files** | `src/app/exec/**`; `src/app/dashboard/intelligence/**`; `src/lib/intelligence-platform/**`; `src/lib/platform/intelligence/**`; `docs/architecture/PLATFORM_CONTRACT.md` |

---

## High

### H-A1 — Parallel intelligence product lineages

| Field | Content |
|-------|---------|
| **Severity** | High |
| **Description** | OIOS, AIP, Intelligence Network, EDI, Financial Intelligence, and executive platform services overlap conceptually. |
| **Impact** | Wrong source of truth; duplicated dashboards; slow delivery. |
| **Recommendation** | Canonical surface map + IA consolidation; ADRs for intentional splits. |
| **Affected files** | `src/lib/platform/intelligence/**`; `src/lib/intelligence-platform/**`; `src/lib/intelligence-network/**`; `src/lib/edi/**`; `src/lib/financial-intelligence/**`; `src/lib/platform/executive-*/**`; `src/app/dashboard/intelligence/**`; `src/app/dashboard/executive/**`; `src/app/exec/**` |

### H-A2 — Dual workflow packages

| Field | Content |
|-------|---------|
| **Severity** | High |
| **Description** | `platform/workflow` and `platform/workflows` both exist with similar names and different purposes. |
| **Impact** | Incorrect engine usage; registry confusion. |
| **Recommendation** | Rename executive workflows package; update imports and docs. **Done (Phase B H-A2):** `executive-workflows` is canonical; `workflows/index.ts` re-exports. |
| **Affected files** | `src/lib/platform/workflow/**`; `src/lib/platform/workflows/**` |

### H-A3 — CompetitiveIntelligence class name collision

| Field | Content |
|-------|---------|
| **Severity** | High |
| **Description** | Two classes share the export name `CompetitiveIntelligence`. |
| **Impact** | Ambiguous imports; defect risk under barrel re-exports. |
| **Recommendation** | Rename market submodule class. |
| **Affected files** | `src/lib/platform/intelligence/market/competitive-intelligence.ts`; `src/lib/platform/intelligence/competitive/competitive-intelligence.ts` |

### H-A4 — Sequential 39-module pipeline scalability

| Field | Content |
|-------|---------|
| **Severity** | High |
| **Description** | Full pipeline runs modules sequentially in process. |
| **Impact** | Latency and cost scale poorly; exec UX may timeout under full runs. |
| **Recommendation** | Sibling parallelism, caching, async jobs for full-graph execution. |
| **Affected files** | `src/lib/platform/intelligence/infrastructure/pipeline.ts`; `src/lib/performance/**`; `src/app/api/platform/process-queues/route.ts` |

### H-A5 — Process-scoped intelligence memory model

| Field | Content |
|-------|---------|
| **Severity** | High |
| **Description** | Singleton DI + in-memory repos assume single-process semantics. |
| **Impact** | Horizontal scale and tenant isolation hazards. |
| **Recommendation** | Externalize state or pin sticky single-instance + explicit product limits. |
| **Affected files** | `src/lib/performance/singletons.ts`; `src/lib/exec/intelligence.ts`; `src/lib/platform/intelligence/common/in-memory-repository.ts` |

### H-A6 — Dual executive-graph stacks

| Field | Content |
|-------|---------|
| **Severity** | High |
| **Description** | Two executive-graph implementations coexist (ADR-A1-001). |
| **Impact** | Onboarding defects; divergent evolution. |
| **Recommendation** | Enforce canonical imports; plan convergence epic. |
| **Affected files** | `src/lib/platform/executive-graph/**`; `src/lib/platform/intelligence/executive-graph/**`; `docs/architecture/adr/ADR-A1-001-executive-graph-packages.md` |

### H-A7 — Dual finance stacks

| Field | Content |
|-------|---------|
| **Severity** | High |
| **Description** | Operational finance vs platform finance/accounting (ADR-A1-002). |
| **Impact** | Features land in wrong stack; inconsistent controls. |
| **Recommendation** | Ownership matrix in code review checklist; eventual convergence. |
| **Affected files** | `src/lib/finance/**`; `src/lib/platform/finance/**`; `src/lib/platform/accounting/**`; `docs/architecture/adr/ADR-A1-002-platform-finance-vs-operational.md` |

### H-A8 — Architecture documentation drift

| Field | Content |
|-------|---------|
| **Severity** | High |
| **Description** | Historical audits/scorecards disagree with post-stabilization/post-remediation reality. |
| **Impact** | Bad release decisions; auditor confusion. |
| **Recommendation** | Prefer Phase A + constitution + MODULE_IDS; banner historical docs. |
| **Affected files** | `docs/architecture/CURRENT_ARCHITECTURE_REPORT.md`; `docs/architecture/audit/**`; `docs/architecture/INTELLIGENCE_DOMAIN_MODEL.md` |

### H-A9 — Ops dependency for security architecture integrity

| Field | Content |
|-------|---------|
| **Severity** | High |
| **Description** | Architecture A.1 / Security B.1 remediations require migrations `171`+`172` applied in every environment; live cross-tenant suite still partial. |
| **Impact** | Codebase may be safer than deployed DBs; enterprise readiness blocked. |
| **Recommendation** | Treat migration apply + live RLS tests as release gates (security checklist). |
| **Affected files** | `supabase/migrations/171_a1_architecture_security_rls.sql`; `supabase/migrations/172_b1_security_remediation.sql`; `docs/security/phase-b1/**` |

### H-A10 — CI does not gate the unit test suite

| Field | Content |
|-------|---------|
| **Severity** | High |
| **Description** | `.github/workflows/ci.yml` runs lint, typecheck, build (with registry validators), integration tests, and Playwright smoke — but not `npm run test` (full Vitest unit suite, ~800+ intelligence/IAM/security tests). |
| **Impact** | Largest automated quality investment is not a merge gate; regressions can land despite local “890 green” claims. |
| **Recommendation** | Add unit job to CI (or document intentional omission with compensating gates). Prefer `npm run test` on PRs with shard/timeout strategy if needed. |
| **Affected files** | `.github/workflows/ci.yml`; `package.json` (`test` script); `tests/unit/**`; `vitest.config.ts` |

### H-A11 — Intelligence mega-module / barrel concentration

| Field | Content |
|-------|---------|
| **Severity** | High |
| **Description** | `src/lib/platform/intelligence/` is ~1,255+ files (~40+ subdomains). Public barrel `intelligence/index.ts` is a mega re-export (~1,700+ lines), dominating the compile/import graph. |
| **Impact** | Slow tooling, unclear public API, accidental deep coupling via barrel imports. |
| **Recommendation** | Narrow public exports; prefer subpath imports (`intelligence/wisdom`, `registration`, `common`); treat full barrel as deprecated for app code. |
| **Affected files** | `src/lib/platform/intelligence/index.ts`; `src/lib/platform/intelligence/**`; consumers under `src/lib/exec/**`, `src/app/exec/**` |

### H-A12 — Mission Control cross-domain composer hub

| Field | Content |
|-------|---------|
| **Severity** | High |
| **Description** | `mission-control-compose.ts` aggregates executive, EDI, automation, operational-loop, and JAG work into one hub — a classic god-composer. |
| **Impact** | Circular/soft dependency risk; change amplification; hard to test in isolation. |
| **Recommendation** | Split by facet with facade ports; compose at the page boundary with explicit DTOs. |
| **Affected files** | `src/lib/platform/automation/mission-control-compose.ts`; `src/lib/executive/**`; `src/lib/edi/**`; `src/lib/platform/operational-loop/**`; `src/lib/platform/jag-work/**`; `src/app/dashboard/mission-control/**` |

---

## Medium

### M-A1 — Residual ResultLightBase duplication

| Field | Content |
|-------|---------|
| **Severity** | Medium |
| **Description** | ~16 domains still redefine light DTO bases. |
| **Impact** | Drift; maintainability tax. |
| **Recommendation** | Extract to `intelligence/common`. |
| **Affected files** | `src/lib/platform/intelligence/*/types.ts` (late-domain set listed in `04_DUPLICATION_ANALYSIS.md`) |

### M-A2 — Late-domain engine boilerplate

| Field | Content |
|-------|---------|
| **Severity** | Medium |
| **Description** | Forecast/trend/scenario/learning-loop shells remain near-copies. |
| **Impact** | Expensive changes across frozen packages. |
| **Recommendation** | Parameterized shared engines when freeze allows. |
| **Affected files** | `src/lib/platform/intelligence/**/*-forecast-engine.ts`; `**/*-trend-engine.ts`; `**/closed-learning-loop.ts`; `**/projection.ts` |

### M-A3 — Fragile organization-health DAG edge

| Field | Content |
|-------|---------|
| **Severity** | Medium |
| **Description** | Adapter declares `dependencies: []`. |
| **Impact** | Order fragility if registration changes. |
| **Recommendation** | Explicit dependency on `organization-dna` or `oios-core`. |
| **Affected files** | `src/lib/platform/intelligence/infrastructure/modules/organization-health.ts` |

### M-A4 — Leaf type boundary exceptions

| Field | Content |
|-------|---------|
| **Severity** | Medium |
| **Description** | Some `types.ts` import context builder modules. |
| **Impact** | Future cycle risk. |
| **Recommendation** | Move shared context types to a leaf module. |
| **Affected files** | `src/lib/platform/intelligence/organization/types.ts`; `src/lib/platform/intelligence/decision/types.ts` |

### M-A5 — OIOS catalog vs MODULE_IDS mismatch

| Field | Content |
|-------|---------|
| **Severity** | Medium |
| **Description** | Dormant legal/compliance/risk keys; `oios-core` platform-only. |
| **Impact** | Catalog confusion. |
| **Recommendation** | Single comparison table in OIOS docs; keep intentional. |
| **Affected files** | `src/lib/platform/oios/**`; `src/lib/platform/intelligence/infrastructure/types.ts` |

### M-A6 — Knowledge vs institutional-memory overlap

| Field | Content |
|-------|---------|
| **Severity** | Medium |
| **Description** | Adjacent memory concepts. |
| **Impact** | Dual maintenance. |
| **Recommendation** | Ownership matrix; soft-read only. |
| **Affected files** | `src/lib/platform/intelligence/knowledge/**`; `src/lib/platform/intelligence/institutional-memory/**` |

### M-A7 — Codegen drift risk

| Field | Content |
|-------|---------|
| **Severity** | Medium |
| **Description** | Generate scripts can diverge from packages. |
| **Impact** | Unsafe regeneration. |
| **Recommendation** | Lock or unify generator schema. |
| **Affected files** | `scripts/generate-*-intelligence.mjs`; `scripts/generate-ethical-part2.mjs` |

### M-A8 — Middleware authz snapshot cost

| Field | Content |
|-------|---------|
| **Severity** | Medium |
| **Description** | Authz snapshot loaded on gated routes in middleware. |
| **Impact** | Latency/DB load. |
| **Recommendation** | Session-scoped cache with invalidation; measure in performance phase. |
| **Affected files** | `middleware.ts`; `src/lib/platform/identity/load-authz-snapshot.ts` |

### M-A9 — Manual database type mirror

| Field | Content |
|-------|---------|
| **Severity** | Medium |
| **Description** | `src/types/database.ts` is hand-maintained. |
| **Impact** | Schema/type skew. |
| **Recommendation** | Generate types in CI. |
| **Affected files** | `src/types/database.ts`; `supabase/migrations/**` |

### M-A10 — Presentation routes in production app tree

| Field | Content |
|-------|---------|
| **Severity** | Medium |
| **Description** | Large presentation slide routes coexist with product. |
| **Impact** | Surface area / noise. |
| **Recommendation** | Isolate or exclude from production deploy if unused. |
| **Affected files** | `src/app/presentation/**`; `src/components/presentation/**` |

### M-A11 — Orchestrator foundation TODOs

| Field | Content |
|-------|---------|
| **Severity** | Medium |
| **Description** | Persisted TODOs for authorize/persistence/outcomes in orchestrator stages. |
| **Impact** | Incomplete cognitive foundation behind DAG. |
| **Recommendation** | Schedule product backlog or mark non-goals. |
| **Affected files** | `src/lib/platform/intelligence/orchestrator/**`; related stage services |

### M-A12 — Layout vs middleware permission drift

| Field | Content |
|-------|---------|
| **Severity** | Medium |
| **Description** | Defense-in-depth exists but catalogs can diverge over time (A.1 fixed several). |
| **Impact** | Over/under authorization. |
| **Recommendation** | Single derived route policy table + tests (extend a1-remediation tests). |
| **Affected files** | `middleware.ts`; `src/lib/platform/identity/route-authorization.ts`; `src/app/**/layout.tsx`; `tests/unit/architecture/a1-remediation.test.ts` |

### M-A13 — Dual IAM layers (`identity` vs `iam`)

| Field | Content |
|-------|---------|
| **Severity** | Medium |
| **Description** | App-facing `platform/identity` and foundation `platform/iam` (delegation, break-glass) coexist; middleware uses the identity path with overlays merged in `load-authz-snapshot`. |
| **Impact** | Onboarding confusion; risk of bypassing overlays if callers use the wrong entry. |
| **Recommendation** | Document canonical call path; forbid direct IAM engine use from feature code except via identity adapters. |
| **Affected files** | `src/lib/platform/identity/**`; `src/lib/platform/iam/**`; `src/lib/platform/identity/load-authz-snapshot.ts`; `src/lib/platform/identity/index.ts` |

### M-A14 — Authz model inconsistency across product shells

| Field | Content |
|-------|---------|
| **Severity** | Medium |
| **Description** | Middleware applies coarse catalog gates; dashboard uses `requireAuthorizedRoute` / granular layout permissions; cloud/operations/portal lean on domain `access.ts` helpers outside `route-authorization.ts`. |
| **Impact** | Uneven assurance; harder to prove least privilege across surfaces. |
| **Recommendation** | Map every shell to catalog permissions in `route-authorization.ts` (or generate from one policy table). |
| **Affected files** | `middleware.ts`; `src/lib/platform/identity/route-authorization.ts`; `src/app/cloud/layout.tsx`; `src/app/operations/layout.tsx`; `src/app/portal/layout.tsx`; `src/lib/cloud-platform/access.ts`; `src/lib/operations-platform/**`; `src/lib/platform/identity/portal-access.ts` |

### M-A15 — Local Supabase seed missing / config drift

| Field | Content |
|-------|---------|
| **Severity** | Medium |
| **Description** | `supabase/config.toml` references `./seed.sql`, but seed file is not present in-repo. No Edge Functions directory. |
| **Impact** | Local reset/onboarding friction; inconsistent dev tenants. |
| **Recommendation** | Add sanitized seed or remove seed path from config; document intentional absence. |
| **Affected files** | `supabase/config.toml`; `supabase/seed.sql` (missing); `supabase/migrations/**` |

### M-A16 — Ops/docs migration count drift

| Field | Content |
|-------|---------|
| **Severity** | Medium |
| **Description** | Live tree has migrations through **172**; some ops/cert scripts and older docs still cite earlier counts (e.g. 131 / 154). |
| **Impact** | Incomplete hardening apply; false confidence in env readiness. |
| **Recommendation** | Reconcile `certification-run-instructions.mjs`, README, and launch docs to **172**; treat `supabase/migrations/` as authority. |
| **Affected files** | `scripts/certification-run-instructions.mjs`; `docs/launch/**`; `README.md`; `supabase/migrations/` |

### M-A17 — Thin HTTP API vs large server-action surface

| Field | Content |
|-------|---------|
| **Severity** | Medium |
| **Description** | ~28 `app/api` handlers vs broad `lib/*/actions.ts` mutation surface (finance actions alone ~779 lines). |
| **Impact** | Harder centralized rate-limit, versioning, and external audit of mutations. |
| **Recommendation** | Keep RSC actions for UX; route privileged/external mutations through guarded API patterns where auditability matters. |
| **Affected files** | `src/app/api/**`; `src/lib/finance/actions.ts`; `src/lib/*/actions.ts`; `src/lib/platform/identity/api-guard.ts` |

---

## Low

### L-A1 — `*-intelligence-intelligence.ts` filenames  
### L-A2 — `predictive-intelligence/` folder vs `predictive` module id  
### L-A3 — Duplicate `collaboration-engine.ts` names  
### L-A4 — Legacy `/admin/scholarships` route  
### L-A5 — Test naming traps (finance vs financial intelligence)  
### L-A6 — organization / organization-dna / organization-health naming proximity  
### L-A7 — In-memory pipeline cache multi-instance misses  
### L-A8 — Graph edges without durable result payload links  
### L-A9 — Legacy artifacts in tree (`.old` components, SQL beside app routes)

*(Each Low item: polish/on-touch; see `03_TECHNICAL_DEBT_REPORT.md` TD-L\* and `04_DUPLICATION_ANALYSIS.md`.)*

**Representative affected paths:** `src/lib/platform/intelligence/**`, `src/app/admin/scholarships/page.tsx`, `tests/unit/intelligence/**`, `src/lib/platform/intelligence-graph/**`, `src/components/admissions/LeadForm.old.tsx`, `src/app/dashboard/scholarships.sql`.

---

## Informational

### I-A1 — Stabilization A1–A5 completed  
Shared scoring, repos, modular DI, cleanup done — do not re-open large architecture refactors without product need.  
**Files:** `docs/architecture/STABILIZATION_A*.md`; `src/lib/platform/intelligence/common/**`; `src/lib/platform/intelligence/registration/**`

### I-A2 — Architecture A.1 remediations landed  
Critical PAJ/ULR/payroll RLS and layout authz issues addressed in code/migrations.  
**Files:** `docs/architecture/audit/ARCHITECTURE_REMEDIATION_REPORT.md`; `supabase/migrations/171_*.sql`

### I-A3 — Security B.1 remediations landed  
Critical/High app security items addressed; CONDITIONAL GO pending ops.  
**Files:** `docs/security/phase-b1/**`

### I-A4 — Lean production dependency graph  
Next/React/Supabase only — supply-chain strength.  
**Files:** `package.json`

### I-A5 — Build-time registry validators  
Strong architectural fitness functions.  
**Files:** `package.json`; `scripts/validate-*.mts`

### I-A6 — No hard circular dependency evidence in intelligence core  
Leaf/soft-light pattern working.  
**Files:** `src/lib/platform/intelligence/**`; prior madge results in A5 notes

---

## Count summary

| Severity | Count |
|----------|------:|
| Critical | 3 |
| High | 12 |
| Medium | 17 |
| Low | 9 |
| Informational | 6 |
| **Total** | **47** |

### Addendum (deep-dive reconciliation)

Additional High/Medium items **H-A10–H-A12** and **M-A13–M-A17** (plus **L-A9**) were incorporated after full-tree exploration of `src/`, `supabase/`, `tests/`, CI, and prior phase scorecards — without changing Phase A scores or the **CONDITIONAL GO** verdict.
