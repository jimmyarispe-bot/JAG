# Stabilization A4 — Interface & Contract Standardization

**Status:** Complete  
**Scope:** Intelligence platform contracts, DTOs, options, factories, repositories, and service interfaces.  
**Constraints:** No runtime behavior changes. No public API renames. No new domains. No business-logic changes. Frozen packages preserved.

## Goal

Improve maintainability and consistency of exported type surfaces while preserving **100% backward compatibility**. Prefer the convention already used most often in the codebase when two approaches are equally valid.

## Interface Standardization Summary

### What was reviewed

| Surface | Approx. count | Location pattern |
|---------|--------------:|------------------|
| Domain `contracts.ts` | 34 + root + infrastructure | `intelligence/*/contracts.ts` |
| Domain `types.ts` | ~46 | DTOs, baselines, lenses, lights |
| Repository interfaces | ~34 | Mostly `{Domain}Repository` |
| Canonical 7-method repos | 29 | Aligns with A3 implementations |
| Domain-specific repos | 5 | Graph / Governance / DNA / Forecast / Scenario |
| `Create*Options` | ~37 | Mostly domain `index.ts` |
| `*IntelligenceService` façades | ~28 | Plus legacy short names |
| Late-domain `*EngineContract` | 200+ | Sub-engines in Family C |
| Publisher registries | 26 | Array or Map (A3) |
| DI options | 1 aggregate | `CreateIntelligenceServiceOptions` |

Also reviewed for consistency (no renames): OIOS soft-coupling types, registration options, and `common/` reference contracts introduced in A2–A3.

### Majority conventions (preferred)

When choosing a standard, A4 followed the pattern used by the **largest cluster** (late area-suite / Family C + A3 canonical repos):

| Concern | Majority convention |
|---------|---------------------|
| Repository methods | `save → get → list → remove → saveHistory → listHistory → clear` |
| contracts.ts order | Engine → sub-engines → **Repository → Registry** → Service → Dependencies |
| Service naming | `{Domain}IntelligenceService` + `type {Domain}Service = …` |
| Options naming | `Create{Domain}Options` extending `{Domain}Dependencies` |
| DTO naming | `{Domain}Request` / `Result` / `Baseline` / `HistoryRecord` / `Query*` |
| Leaf files | Header stating contracts/types only + no engine imports |
| Import style (late) | `import type * as T from ".../types"` |

Legacy Family A/B names that diverge (`WorkforceRepository`, `GovernanceService`, `generate` vs `build`) were **documented, not renamed**.

### Three contract families (preserved)

| Family | Sprints | Traits |
|--------|---------|--------|
| **A — Early rich** | 025–032, 039 | Full headers, named imports, section JSDoc; `*Contract` aliases mainly in `index.ts` |
| **B — Mid product** | 034–038, 041–042 | Compact or mixed; `BaselineInput` helpers; Engine+Service aliases |
| **C — Late area-suite** | external → wisdom | `import type * as T`; `*EngineContract` in contracts; uniform stack |

### Conventions established

**`contracts.ts` declaration order**

```
Engine → sub-engines/analyzers → Repository → Registry → Queries → Service → Dependencies
```

**Canonical repository method order**

```
save → get → list → remove → saveHistory → listHistory → clear
```

**DTO / options naming**

| Pattern | Example |
|---------|---------|
| Request / Result | `CompetitiveRequest`, `CompetitiveResult` |
| Baseline / History | `CompetitiveBaseline`, `CompetitiveHistoryRecord` |
| Query | `CompetitiveQueryRequest`, `CompetitiveQueryResult` |
| Publisher | `CompetitivePublisher` |
| Options | `CreateCompetitiveOptions` (in `index.ts`) |
| Service | `{Domain}IntelligenceService` + `type {Domain}Service = …` |
| Leaf header | “contracts / interfaces only” + “Leaf module…” |

**Reference generics** (documentation only — not public renames):

`src/lib/platform/intelligence/common/contract-conventions.ts`

- `ResultHistoryRepositoryContract<TResult, THistory, TScope>`
- `PublisherRegistryContract<TPublisher>`
- `IntelligenceServiceFacadeContract<…>`

Domains keep their own named interfaces; these generics document the shared shape for maintainers.

### Safe changes applied

1. **Leaf headers** on 16 late-domain `contracts.ts` (+ funding header align) and matching `types.ts` headers.
2. **Registry after Repository** declaration order in 7 files: customer, knowledge, innovation, operations, document, market, legal-compliance-risk.
3. **Formatting** — expanded compact Repository / Registry / Service interfaces in `impact` and `funding` to match majority multi-line style; funding Engine→Repository→Service order.
4. **Legacy-name JSDoc** (no renames) on `WorkforceRepository`, `ImprovementRepository` / `ImprovementIntelligenceService`, `GovernanceRepository` / `GovernanceService`.
5. **Reference contract conventions** module under `common/`.

### Explicit non-changes

- No export renames / no public API changes
- No method or property signature changes
- No `Create*Options` shape changes
- No business logic or engine behavior changes
- No merge of duplicated `ResultLightBase` / `BaselineInput` (public collision risk)
- No domain-specific repository API unification (board-gov, DNA, graph, forecast, scenario)
- No mass formatting rewrites of large Family B analyzer lists (funding)

### Simplification opportunities considered (not applied)

| Opportunity | Why deferred |
|-------------|--------------|
| Make domain repos `extends ResultHistoryRepositoryContract<…>` | Would alter declaration style across 29 files; no runtime gain; optional later |
| Merge `ResultLightBase` into `common/` | Cross-domain soft-read DTOs; export churn risk |
| Unify `BaselineInput` name across packages | Same export name, different baseline types — breaking if merged |
| Rename legacy Workforce / Improvement / Governance APIs | Explicitly forbidden (public API) |

## Naming Improvements

| Improvement | Detail |
|-------------|--------|
| Canonical order documented | Engine → … → Repository → Registry → Service → Dependencies |
| Mid-domain order fixed | Registry no longer declared before Repository in 7 files |
| Repository method order | Documented + aligned in expanded funding/impact interfaces |
| Leaf module headers | Consistent contracts/types headers across late domains |
| Legacy names annotated | Workforce / Improvement / Governance documented as intentional |
| Reference generics | Shared shape in `contract-conventions.ts` without replacing domain exports |
| `*Contract` convention clarified | Early: plain names in contracts, aliases in index; Late: `*EngineContract` on sub-engines |
| Majority-first rule | Prefer Family C / canonical repo conventions when choosing |

## Remaining Inconsistencies

Intentional or require a future **breaking** release — documented only:

| Item | Current | Why deferred |
|------|---------|--------------|
| `WorkforceRepository` | Not `HumanCapitalRepository` | Public API + root index consumers |
| `ImprovementRepository` / `ImprovementEngine` | Not `OrganizationalImprovement*` | Public API + pipeline wiring |
| `GovernanceRepository` / `GovernanceService` | Mixed with `BoardPacket` / `BoardIntelligenceEngine` | Dual Board/Governance product vocabulary |
| Service short names | `HumanCapitalService`, `OrganizationService`, `PredictionService`, `ExecutiveDecisionService` | Established sprint exports |
| `BoardIntelligenceEngine.generate` | Most engines use `build` | Domain-specific entrypoint |
| `CreateOrganizationDnaOptions` | Does not extend `Dependencies` the same way | Factory shape divergence |
| Duplicate `BaselineInput` export name | funding / opportunity / organizational-improvement | Same name, different `T.*Baseline` |
| Duplicated `ResultLightBase` | Many late `types.ts` | Soft-read DTOs; optional future types pass |
| Registry `register(domain)` typing | `string` vs typed originating domains | Map registries typed where needed |
| `index.ts` export style | Curated lists vs `export * from types` | Both valid public surfaces |
| Domain-specific repos | Graph / Governance / DNA / Forecast / Scenario | Different entity models (A3) |
| Late `*EngineContract` vs early plain names | Family C vs A | Compatible via index aliases |

## Compatibility Report

| Check | Result |
|-------|--------|
| Public interface / type **names** | Unchanged (legacy names retained) |
| Method / property **signatures** | Unchanged |
| `Create*Options` / DI bags | Unchanged |
| Factory entrypoints (`createIntelligenceService`, `create*Intelligence`) | Unchanged |
| Repository / registry **runtime** classes | Unchanged in A4 (A3 wrappers remain) |
| Barrel re-exports (`intelligence/index.ts`, domain `index.ts`) | Compatible — no renames |
| Structural assignability | Preserved (declaration reorder is type-only) |
| Package boundaries / DAG | Preserved (`common/` remains a leaf) |
| Frozen intelligence packages | Not regenerated; only headers/docs/order on contracts/types |
| OIOS / registration options | Untouched |

**Export-name smoke check** (still present under `src/lib/platform/intelligence/`):

| Symbol | Still referenced |
|--------|------------------|
| `WorkforceRepository` | Yes |
| `ImprovementRepository` | Yes |
| `GovernanceRepository` | Yes |
| `CreateIntelligenceServiceOptions` | Yes |
| `CompetitiveRepository` | Yes |
| `CustomerIntelligenceService` | Yes |
| `InMemoryResultHistoryRepository` | Yes (A3) |
| `ResultHistoryRepositoryContract` | Yes (A4 reference) |

## Files Changed

**Added**

- `src/lib/platform/intelligence/common/contract-conventions.ts`
- `docs/architecture/STABILIZATION_A4_INTERFACES.md` (this file)

**Modified**

- `src/lib/platform/intelligence/common/index.ts` (re-export conventions)
- Late-domain `contracts.ts` + `types.ts` headers (16): competitive, wisdom, systems, behavioral, cultural, ethical, political, environmental, reputation, stakeholder, economic, impact, collective, ecosystem, resilience, institutional-memory
- Registry/Repository order: customer, knowledge, innovation, operations, document, market, legal-compliance-risk `contracts.ts`
- Formatting / order: `funding/contracts.ts`, `impact/contracts.ts`
- Legacy JSDoc: `human-capital/contracts.ts`, `organizational-improvement/contracts.ts`, `board-governance/contracts.ts`

## Validation

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | Pass |
| Intelligence unit suite | **52 files / 477 tests pass** |
| `madge --circular` (common + sample contracts) | **No circular dependency** |
| Exported API compatibility | Pass (see Compatibility Report) |
| Runtime behavior | Unchanged |

## Confirmation — zero runtime behavior changes

A4 touched **TypeScript interface declarations, file headers, JSDoc, and declaration order only**. No implementation files (`repository.ts`, engines, services, scoring, DI wiring) were modified for behavior. Structural typing means interface member order does not affect assignability or runtime. Business logic, registry routing, and OIOS architecture are unchanged.

## Success criteria

| Criterion | Met |
|-----------|:---:|
| Improved consistency | Yes |
| Reduced cognitive overhead | Yes (headers, order, documented conventions) |
| No behavioral changes | Yes |
| No API changes | Yes |
| Clean TypeScript build | Yes |
| All intelligence tests passing | Yes |
| No circular dependencies | Yes |

## Stabilization status

| Task | Status |
|------|--------|
| A1 — DI registration | Complete |
| A2 — Shared scoring | Complete |
| A3 — Repositories | Complete |
| A4 — Interfaces | Complete |
| **A5 — Dead code & cleanup** | **Complete** |

**Architecture Stabilization is complete.** See [STABILIZATION_A5_CLEANUP.md](./STABILIZATION_A5_CLEANUP.md) and [V1_STABILIZATION_MASTER_PLAN.md](./V1_STABILIZATION_MASTER_PLAN.md).
