# Stabilization A3 — Repository Classification & Consolidation

**Status:** Complete  
**Scope:** Classify and consolidate reusable in-memory repository / publisher-registry infrastructure. No runtime behavior or public API changes.

## Goal

Review duplicated repository implementations from the architecture audit, classify each as generic infrastructure vs domain-specific, and consolidate only what is genuinely reusable without weakening domain boundaries.

## Classification

### GENERIC_INFRA (extracted into `common/`)

| Primitive | File | Role |
|-----------|------|------|
| Scope matcher | `common/scope.ts` | `matchesGraphScope` — null filter fields are wildcards |
| Result + history store | `common/in-memory-repository.ts` | `InMemoryResultHistoryRepository` keyed by `requestId` |
| Array publisher registry | `common/publisher-registry.ts` | `PublisherRegistryArray` — multi-capability per domain |
| Map publisher registry | `common/publisher-registry.ts` | `PublisherRegistryMap` — one capability per domain + seed |

These are leaf helpers: no domain imports; domains extend them with typed wrappers.

### HYBRID — consolidated (thin domain wrappers)

**29 result repositories** now extend `InMemoryResultHistoryRepository`:

behavioral, business-model, collective, competitive, cultural, customer, document, economic, ecosystem, environmental, ethical, funding, human-capital (`WorkforceRepositoryStore`), impact, innovation, institutional-memory, knowledge, legal-compliance-risk, market, operations, opportunity, organizational-improvement (`ImprovementRepositoryStore`), political, reputation, resilience, revenue, stakeholder, systems, wisdom

Clear-history modes preserved:

| Mode | Domains |
|------|---------|
| `truncate` (`length = 0`) | Majority (default) |
| `replace` (`history = []`) | wisdom, systems, resilience, ecosystem, ethical, collective, cultural, institutional-memory |

**26 publisher registries** consolidated:

| Pattern | Count | Shared base |
|---------|-------|-------------|
| Array (no seed) | 16 | `PublisherRegistryArray` |
| Map + `DEFAULT_PUBLISHERS` | 10 | `PublisherRegistryMap` (seed stays in domain) |

Typed map domains preserved: `OpportunityOriginatingDomain`, `ImprovementSourceDomain`.

### DOMAIN_SPECIFIC — intentionally not consolidated

| File | Why isolated |
|------|----------------|
| `board-governance/repository.ts` | Entity is `BoardPacket` (`packet.id`); history is a Map; **different** scope semantics (truthy-only match) |
| `organization-dna/repository.ts` | Dual stores (`dnaById`, `artifactsById`) + `saveArtifact` / `listArtifacts` |
| `memory/store.ts` | Async API, deep freeze, rich filter/sort — different contract |
| `opportunity/opportunity-exchange.ts` | Domain transformation / scoring, not storage boilerplate |
| `executive-graph/repository.ts` | Scoped latest-index (`getLatest`), no history |
| `executive-decision/scenario-repository.ts` | Scoped scenario index, different API |
| `executive-decision/history.ts` | Decision history with `updateStatus` |
| `predictive-intelligence/forecast-repository.ts` | Multi-index forecast store |
| `predictive-intelligence/history.ts` | Forecast history variant |
| `oios/repository.ts` | Slightly different filter idiom; outside intelligence domain packages |
| `registry.ts` / `infrastructure/registry.ts` | Module/DAG registries — unrelated to publisher pattern |

### Deferred (HYBRID but optional)

Scoped-index cluster (`scopeKey` + by-scope maps in executive-graph / decision / predictive) can share a future `common/scoped-index-store.ts`. Left isolated in A3 to avoid mixing distinct APIs into the canonical result-store primitive.

## Consolidation summary

```
common/
  scope.ts
  in-memory-repository.ts
  publisher-registry.ts
  (+ A2 scoring files)

domain/repository.ts          → class X extends InMemoryResultHistoryRepository<...>
domain/*-registry.ts          → class X extends PublisherRegistryArray | PublisherRegistryMap
```

Public exports unchanged: `*RepositoryStore`, aliases (`CompetitiveRepository`, `WorkforceRepository`, `ImprovementRepository`, `*Registry`), constructors with optional seed, and method signatures.

## Before / after duplication metrics

| Metric | Before | After |
|--------|--------|-------|
| Near-duplicate result+history store bodies | ~31 | **1** shared + 29 thin wrappers |
| Publisher registry clones | 26 (16 array + 10 map) | **2** shared bases + 26 thin wrappers |
| Domain repos still with inline `Map` result body | ~29 canonical | **0** (board-gov / DNA / graph remain domain-specific by design) |
| Array registries still with inline publisher array | 16 | **0** (implementation in `common`) |
| Map registries with domain seed lists | 10 | 10 (seed data remains domain-local; logic shared) |
| Circular deps (`madge` on common + samples) | — | **none** |

## Validation

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | Pass |
| Intelligence unit suite | **52 files / 477 tests pass** |
| Dependency graph (`madge --circular`) | **No circular dependency** |
| Package isolation | `common/` remains a leaf; domains → common only |

## Files changed

**Added**

- `src/lib/platform/intelligence/common/scope.ts`
- `src/lib/platform/intelligence/common/in-memory-repository.ts`
- `src/lib/platform/intelligence/common/publisher-registry.ts`
- `docs/architecture/STABILIZATION_A3_REPOSITORIES.md` (this file)

**Modified**

- `src/lib/platform/intelligence/common/index.ts` (re-exports)
- 29 domain `repository.ts` files (listed above)
- 26 domain `*-registry.ts` files

**Unchanged (by design)**

- Domain-specific repositories listed in the isolation table
- Domain contracts, types, engines, DI wiring, registry module DAG behavior

## Confirmation

- Runtime store/registry behavior preserved (same keys, filters, clear modes, seed lists, typed domain keys)
- Public APIs unchanged (class names, aliases, method signatures)
- Domain boundaries preserved (types/contracts/seeds stay in domains; only storage mechanics shared)
- Dependency DAG preserved (`common` leaf; no new cycles)
- Registry routing / infrastructure module registry behavior untouched
