# Stabilization A1 — Modular Intelligence DI Registration

**Status:** Complete  
**Scope:** Pure maintainability refactor — no domain, API, or runtime behavior changes.

## Goal

Replace the monolithic `createIntelligenceService()` registration body with a modular registration architecture while preserving 100% runtime wiring.

## Architecture (after)

```
create-service.ts                    # thin orchestrator (~126 lines)
  └─ registration/
       options.ts                    # CreateIntelligenceServiceOptions (public API)
       cognitive.ts                  # success / executive / strategic / decision adapters
       foundation.ts                 # graph → decision → predictive → board → DNA → OIOS
       product.ts                    # human-capital → … → legal-compliance-risk
       external.ts                   # market → … → environmental
       relationship.ts               # stakeholder → … → ethical
       systems.ts                    # systems → resilience → ecosystem
       memory.ts                     # institutional-memory → collective
       wisdom.ts                     # wisdom (terminal)
       compose.ts                    # intelligencePlatform aggregation
       index.ts                      # composeIntelligenceStacks()
```

`createIntelligenceService()` now:

1. Builds registry / orchestrator / resolvers / shared context (unchanged)
2. Calls `composeIntelligenceStacks(options)` (layered factories, same order & wiring flags)
3. Calls `registerCognitiveDomains(...)` (same four domain modules)
4. Initializes registry, creates router, returns `Object.assign(service, stacks)`

## Before / after metrics

| Metric | Before | After |
|--------|--------|-------|
| `create-service.ts` lines | 1,267 | 126 |
| Registration modules | 1 file | 11 files under `registration/` |
| Registration LOC (split) | — | ~1,470 (moved + thin compose layer) |
| Public API surface | unchanged | unchanged |
| Circular deps (`madge`) | — | **none** |
| `npx tsc --noEmit` | — | **pass** |
| Intelligence unit tests | — | **52 files / 477 tests pass** |

Factory size reduced by ~90% for the orchestrator entrypoint; wiring logic is partitioned by dependency layer.

## Files changed / added

**Modified**

- `src/lib/platform/intelligence/create-service.ts`

**Added**

- `src/lib/platform/intelligence/registration/options.ts`
- `src/lib/platform/intelligence/registration/cognitive.ts`
- `src/lib/platform/intelligence/registration/foundation.ts`
- `src/lib/platform/intelligence/registration/product.ts`
- `src/lib/platform/intelligence/registration/external.ts`
- `src/lib/platform/intelligence/registration/relationship.ts`
- `src/lib/platform/intelligence/registration/systems.ts`
- `src/lib/platform/intelligence/registration/memory.ts`
- `src/lib/platform/intelligence/registration/wisdom.ts`
- `src/lib/platform/intelligence/registration/compose.ts`
- `src/lib/platform/intelligence/registration/index.ts`
- `docs/architecture/STABILIZATION_A1_DI_REGISTRATION.md` (this file)

## Preserved behavior

- `createIntelligenceService()` / `runIntelligence()` / `CreateIntelligenceServiceOptions` (re-exported from create-service)
- Override injection for every stack (`options.<stack>` and `options.<stack>Options`)
- Soft DNA/OIOS wiring flags (`wireOrganizationDna: false`, `wireOios: false`, etc.)
- Improvement → opportunity soft wire
- Platform stack aggregation of all domains
- Cognitive registry keys: `success`, `executive`, `strategic`, `decision`
- Platform module pipeline order through `wisdom` (covered by existing unit tests, e.g. wisdom / funding pipeline assertions)

## Explicit non-goals (not done)

- No new intelligence domains
- No package behavior changes inside domain folders
- No public API renames or removals
- No scoring / engine / repository refactors

## Validation checklist

- [x] `npx tsc --noEmit`
- [x] All intelligence unit tests (`tests/unit/intelligence` — 477 passed)
- [x] Registry / pipeline identity (existing moduleOrder assertions)
- [x] No circular dependencies in registration + create-service (`madge --circular`)
