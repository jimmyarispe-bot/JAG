# Stabilization A5 — Dead Code & Cleanup

**Status:** Complete  
**Scope:** Conservative repository cleanup. Final Architecture Stabilization task.  
**Constraint:** When uncertain, keep and report. Only remove items that are provably unused.

## Dead Code Report

### Review coverage

| Area | Finding |
|------|---------|
| Unused exports / public barrels | Retained — public API even if unused in-repo |
| Unused interfaces / DTOs / contracts | Retained — frozen domain type surfaces |
| `common/` helpers | All exports intentional; two deferred-use symbols retained |
| `registration/` + `create-service.ts` | Clean; no unused imports |
| Empty directories under `intelligence/` | None |
| Stale TODO/FIXME in A1–A4 paths | None |
| Orchestrator TODOs | 14 pre-existing — retained (future product work) |
| Duplicate `ResultLightBase` | Debt only — not deleted |
| Obsolete scripts | 6 unreferenced `_patch-*.mjs` one-offs removed |
| Empty master plan stub | Replaced with index (docs preserved) |
| Audit docs | Kept; marked superseded where A1–A4 resolved claims |
| `.bak` / `.old` artifacts | None on disk; dead `.bak` fallback branch removed from ethical part2 script |

### Items Removed

| Item | Reason |
|------|--------|
| `scripts/_patch-collective-pipeline.mjs` | Zero references; pipeline strings already in tests |
| `scripts/_patch-collective-at2.mjs` | Zero references; one-off test patch |
| `scripts/_patch-wisdom-pipeline-cleanup.mjs` | Zero references; Sprint 060 cleanup already applied |
| `scripts/_patch-wisdom-pipeline-tests.mjs` | Zero references |
| `scripts/_patch-wisdom-at-offsets.mjs` | Zero references |
| `scripts/_patch-ecosystem-tests.mjs` | Zero references |
| Dead `.bak` fallback in `scripts/generate-ethical-part2.mjs` | Referenced non-existent `generate-ethical-part2.mjs.bak`; fail-closed if areas script missing |

Approx. **~12 KB** of obsolete one-off scripts removed.

### Items Retained (with justification)

| Item | Justification |
|------|----------------|
| Domain `contracts.ts` / `types.ts` / engines / packages | Frozen intelligence packages; public API |
| `OUTLOOK_THRESHOLDS_WISDOM` | Deprecated public alias for `OUTLOOK_THRESHOLDS_ELEVATED` |
| `signalStatusFromScore` | Barrel export reserved for future area-factory adoption (A2 non-goal) |
| A4 `*Contract` reference generics | Documentation/reference; intentional |
| `generate-*-intelligence.mjs` and ethical `_write-*` chain | Domain codegen tooling for frozen packages |
| `scripts/_patch-ethical-types.mjs` | Still invoked by `generate-ethical-part2.mjs` |
| CI `validate-platform-*.mts`, probes | Wired in build / docs |
| Orchestrator TODO comments | Pre-existing product stubs — not dead code |
| Audit report set under `docs/architecture/audit/` | Historical baseline; banners added |
| All documentation | Preserved per constraints |
| Public exports (`createIntelligenceService`, repos, registries, options) | Unchanged |

### Files Cleaned

**Deleted**

- `scripts/_patch-collective-pipeline.mjs`
- `scripts/_patch-collective-at2.mjs`
- `scripts/_patch-wisdom-pipeline-cleanup.mjs`
- `scripts/_patch-wisdom-pipeline-tests.mjs`
- `scripts/_patch-wisdom-at-offsets.mjs`
- `scripts/_patch-ecosystem-tests.mjs`

**Modified**

- `scripts/generate-ethical-part2.mjs` — remove dead `.bak` fallback
- `docs/architecture/V1_STABILIZATION_MASTER_PLAN.md` — was empty; now indexes A1–A5
- `docs/architecture/audit/*.md` (7 files) — “superseded in part” banners
- `docs/architecture/STABILIZATION_A5_CLEANUP.md` (this file)

### Remaining Technical Debt

| Debt | Severity | Notes |
|------|----------|-------|
| `ResultLightBase` × ~16 domain `types.ts` | Medium | Documented in A2/A4; extract only with care |
| Area-factory / engine boilerplate duplication | Medium | Soft-read / late-domain clones; product freeze |
| `signalStatusFromScore` unused in-repo | Low | Intentional deferred hook |
| Orchestrator stage TODOs (14) | Product | Persistence, authorize, outcome measurement |
| Production gaps (UI, persistence, integrations) | Product | See `audit/PRODUCTION_GAP_ANALYSIS.md` |
| Legacy public names (Workforce / Improvement / Governance) | Low | A4 documented; no rename |

**Not architecture debt for further refactoring sprints** — next efforts should be product-facing.

## Validation

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | Pass |
| Intelligence unit suite | **52 files / 477 tests pass** |
| `madge --circular` (`common/`, `registration/`, `create-service`) | **No circular dependency** |
| Registry (`INTELLIGENCE_MODULE_IDS`) | **Identical** — 39 modules ending in `wisdom` (unchanged; wisdom pipeline tests pass) |
| Public exports smoke | Present: `createIntelligenceService`, `CreateIntelligenceServiceOptions`, `WorkforceRepository`, `CompetitiveRepository`, `InMemoryResultHistoryRepository`, etc. |
| Runtime behavior | Unchanged (scripts/docs only; no domain package regeneration) |

## Final Architecture Stabilization Summary

| Task | Document | Outcome |
|------|----------|---------|
| **A1** | [STABILIZATION_A1_DI_REGISTRATION.md](./STABILIZATION_A1_DI_REGISTRATION.md) | Modular DI registration layers; thin `createIntelligenceService` |
| **A2** | [STABILIZATION_A2_SHARED_SCORING.md](./STABILIZATION_A2_SHARED_SCORING.md) | Shared scoring primitives in `intelligence/common/` |
| **A3** | [STABILIZATION_A3_REPOSITORIES.md](./STABILIZATION_A3_REPOSITORIES.md) | Shared result+history repos + publisher registries |
| **A4** | [STABILIZATION_A4_INTERFACES.md](./STABILIZATION_A4_INTERFACES.md) | Contract conventions without API renames |
| **A5** | This file | Conservative dead-code cleanup |

### Architecture Stabilization Complete

**Stop architecture refactoring.**

From this point, major efforts should improve the **product**, not the architecture:

1. **Executive Command Center** — CEO-facing experience  
2. **Real Data Integrations** — QuickBooks, Google Workspace, Microsoft 365, banking, CRM, HRIS, etc.  
3. **Pilot Deployment** — The Academy and enrichments.org  
4. **Production Hardening** — security, monitoring, backups, CI/CD, multi-tenancy  
5. **External Beta**

Index: [V1_STABILIZATION_MASTER_PLAN.md](./V1_STABILIZATION_MASTER_PLAN.md)

## Confirmation

- Zero behavioral changes  
- Zero public API changes  
- No frozen intelligence packages regenerated  
- Cleaner repository (obsolete one-off scripts removed; docs indexed)  
- TypeScript build clean; intelligence suite green; DAG acyclic  
