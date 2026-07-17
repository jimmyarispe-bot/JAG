# 02 — Refactoring Log

**Phase:** B · **Date:** 2026-07-17  
**Rule:** No product behavior change; backward-compatible where public imports existed.

---

## H-A1 — Intelligence Surfaces Map

- **Added:** `docs/architecture/INTELLIGENCE_SURFACES_MAP.md`
- **Linked from:** `docs/architecture/README.md`

## H-A2 — Rename executive workflows

- **Canonical:** `src/lib/platform/executive-workflows/**`
- **Shim:** `src/lib/platform/workflows/index.ts` → re-exports executive-workflows
- **Untouched:** `src/lib/platform/workflow` (singular platform engine)
- **Tests:** `tests/unit/intelligence/workflows.test.ts` → new path

## H-A3 — Market CompetitiveIntelligence rename

- **Class:** `MarketCompetitiveIntelligence` (+ deprecated alias `CompetitiveIntelligence`)
- **Contract:** `MarketCompetitiveIntelligence` (+ type alias)
- **Files:** `market/competitive-intelligence.ts`, `market/contracts.ts`, `market/market-engine.ts`, `market/index.ts`, mega-barrel export list

## H-A11 — Narrow mega-barrel coupling

- Deprecation guidance on `intelligence/index.ts`
- Subpath imports in:
  - `executive-workflows/pipeline.ts`
  - `jag/workspace/load-executive-workspace.ts`

## H-A12 — Mission Control compose split

- `mission-control-types.ts` — DTOs
- `mission-control-facets.ts` — pure helpers
- `mission-control-compose.ts` — orchestrator + re-exports (public path unchanged)

## M-A1 — ResultLightBase

- **Added:** `intelligence/common/result-lights.ts`
- **Updated:** 16 domain `types.ts` files to import shared base
- **Exported from:** `intelligence/common/index.ts`

## M-A3 — organization-health dependencies

- `dependencies: ["oios-core"]` in infrastructure module adapter
- Test expectation updated for transitive module order

## Supporting

- `getExecRuntime()` demo fallback outside Next request scope (probes/scripts) when demo allowed — preserves Phase A.1 gates in production
