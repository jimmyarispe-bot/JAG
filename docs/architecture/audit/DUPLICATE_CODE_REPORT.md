# Duplicate Code Report — JAG v1.0

> **HISTORICAL (H-A8).** Prefer [../phase-a/04_DUPLICATION_ANALYSIS.md](../phase-a/04_DUPLICATION_ANALYSIS.md). **Current truth:** [../README.md](../README.md).

> **Superseded in part by Stabilization A1–A4 (July 2026).**  
> Scoring helpers and in-memory repositories/registries were consolidated into `intelligence/common/`.  
> Claims that `common/` does not exist, or that `create-service.ts` remains a ~1,300-line god factory, are historical.  
> This file is retained as the pre-stabilization baseline. See `../STABILIZATION_A5_CLEANUP.md`.

**Branch:** `v1.0-stabilization`  
**Date:** July 13, 2026  
**Constraint:** Reports only; no consolidations applied (at time of writing).

---

## Summary

Duplication is concentrated in the **intelligence domain layer**, especially Sprints **046–060**. Orchestration infrastructure (`infrastructure/`, OIOS, router) is relatively shared; domain primitives are not.

Approximate scale of near-copy surface:

| Pattern | Approx. copies | Severity |
|---------|----------------|----------|
| `clamp` / scoring helpers | 27–36 | Critical |
| `ResultLightBase` | 16 | Critical |
| In-memory `RepositoryStore` | ~33 | Critical |
| `RegistryStore` | ~26 | High |
| `area-factory.ts` | 15 | High |
| `closed-learning-loop.ts` | ~16 | High |
| `projection.ts` | ~33 | High |
| `knowledge-contribution.ts` | ~20 | Medium |
| Scenario/trend/forecast engines | 13–15 each | High |
| `early-warning-engine.ts` | ~13 | Medium |

There is **no** `src/lib/platform/intelligence/common/` (or equivalent) package.

---

## 1. Scoring and model helpers (Critical)

**Duplicated symbols:** `clamp`, `statusFromScore`, `priorityFromScore`, `levelFromValue` / outlook helpers, `defaultCreateId`, `defaultPeriodLabel`, `buildLens`, `buildConfidence`.

**Locations:** Nearly every domain `models.ts` under `src/lib/platform/intelligence/*/models.ts`, plus some `scoring.ts` / `scorer.ts` files.

**Consolidation recommendation:**

```
src/lib/platform/intelligence/common/
  scoring.ts      # clamp, statusFromScore, priorityFromScore, ...
  ids.ts          # defaultCreateId, defaultPeriodLabel
  confidence.ts   # buildConfidence, levelFromValue
```

Migrate late packages first (046–060) via re-exports to avoid behavior churn.

---

## 2. ResultLightBase and light DTO shells (Critical)

**Duplicated:** Private `interface ResultLightBase` plus many `*ResultLight` extensions in 16 `types.ts` files (impact through wisdom).

**Consolidation recommendation:**

```
common/result-lights.ts
  ResultLightBase
  # optional shared MarketResultLight, DecisionResultLight, etc.
```

Keep domain-specific lights in domain `types.ts` extending the shared base.

---

## 3. In-memory repository / registry (Critical / High)

**Pattern:** `Map<string, Result>` + history array + scope `matches()` — cloned ~33 times.

**Registry pattern:** publisher array with `register` / `list` / `isRegistered` / `clear` — ~26 copies.

**Consolidation recommendation:**

```
common/in-memory-repository.ts  # generic RepositoryStore<TResult, THistory, TScope>
common/publisher-registry.ts    # generic RegistryStore
```

Parameterize id prefixes and types only.

---

## 4. Area factory and area stubs (High)

**15 packages** define `area-factory.ts` with nearly identical `createAreaIntelligence(area, titles, label)` returning a class.

**Area modules** are often one-liners extending the factory.

**Consolidation recommendation:** Shared parameterized factory accepting lens builder + id prefix. Domains supply titles/lens text only.

---

## 5. Engine boilerplate (High)

Repeated across late domains:

- `*-forecast-engine.ts`
- `*-trend-engine.ts`
- `*-scenario-engine.ts`
- `*-analysis-engine.ts`
- `early-warning-engine.ts`

Logic is structurally identical; only constants and lens field names differ.

**Consolidation recommendation:** Generic engines parameterized by area enum, scenario list, analysis kinds, and lens builder.

---

## 6. Closed learning loop + knowledge queries (High / Medium)

- `closed-learning-loop.ts` (~16): destination arrays + lesson extraction.  
- `projection.ts` (~33): focus-based Q&A over result fields.  

**Consolidation:** Shared `ClosedLearningLoopBuilder` and `FocusQueryRouter` with domain config maps.

---

## 7. Named collisions (Critical / High)

| Duplicate | Locations | Recommendation |
|-----------|-----------|----------------|
| Class `CompetitiveIntelligence` | `market/competitive-intelligence.ts`, `competitive/competitive-intelligence.ts` | Rename market class to `MarketCompetitiveAssessor` (or similar) |
| Concept cluster Knowledge | `knowledge/` (full) vs `institutional-memory/` (stubs + synthesis) | Keep both; document ownership; avoid duplicate area names in public exports |
| Class `ValuesAlignmentIntelligence` | `ethical/`, `wisdom/` | Prefix with domain (`EthicalValuesAlignmentIntelligence`) |
| `collaboration-engine.ts` | behavioral, cultural, collective, ecosystem | Domain-prefix exports |

---

## 8. DI wiring duplication (High)

`create-service.ts` repeats the same block ~35 times:

```ts
const x = options.x ?? createXIntelligence({ ...options.xOptions, organizationDna, oios, wire*: false });
```

**Consolidation:** Registry of factories + loop, or per-layer `wireFoundation()`, `wireProduct()`, `wireExternal()`, `wireTerminal()`.

---

## 9. Documentation duplication / drift (Medium)

| Topic | Multiple docs | Issue |
|-------|---------------|-------|
| Domain inventory | `INTELLIGENCE_DOMAIN_MODEL.md`, `JAG_V1_INTELLIGENCE_GRAPH.md`, `INTELLIGENCE_LAYER_MODEL.md` | Domain model stale |
| Sprint completion | Package README/VERIFICATION + `docs/architecture/SPRINT*.md` | Incomplete for 045–060 in architecture folder |

**Consolidation:** Treat `INTELLIGENCE_MODULE_IDS` + `JAG_V1_INTELLIGENCE_GRAPH.md` as source of truth; mark older docs deprecated.

---

## 10. Product vs platform “intelligence” naming (Medium)

Overlapping product surfaces:

- AIP `dashboard/intelligence/*` (governance / simulated AI)  
- Financial `dashboard/finance/intelligence/`  
- OIOS pipeline domains (`wisdom`, etc.)  

**Recommendation:** Naming glossary in docs; avoid implying AIP runs the 39-module pipeline.

---

## Consolidation roadmap (recommended)

| Phase | Target | Risk |
|-------|--------|------|
| 1 | `common/scoring.ts` + re-exports | Low |
| 2 | Generic repository/registry | Medium |
| 3 | Shared area-factory + engines | Medium–High |
| 4 | Split create-service | Medium |
| 5 | Rename CompetitiveIntelligence collision | Low–Medium |
| 6 | Doc truth alignment | Low |

Do **not** regenerate frozen domain packages wholesale — extract shared modules and thin domain wrappers instead.
