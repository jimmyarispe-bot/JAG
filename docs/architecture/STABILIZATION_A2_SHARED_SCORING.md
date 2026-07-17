# Stabilization A2 — Shared Scoring Infrastructure

**Status:** Complete  
**Scope:** Extract generic scoring primitives; migrate domain wrappers. No new domains. No public API changes. No runtime behavior changes.

## Goal

Replace ~27–36 duplicated scoring helper blocks across intelligence domains with a leaf `intelligence/common` package, while keeping domain-specific baselines, lenses, and engines inside each domain.

## Shared package layout

```
src/lib/platform/intelligence/common/
  numeric.ts      # clamp, clampUnchecked, clamp01, clamp01NaNSafe, lightScore
  bands.ts        # status / priority / level / outlook mappers (multi-family)
  confidence.ts   # average / empty-half / funding / sum aggregators
  ids.ts          # defaultCreateId, period labels, emptyGraphScope
  index.ts        # barrel
```

**DAG rule:** `common/` imports nothing from domain packages. Domains import `common/`. Verified acyclic via `madge`.

## Semantic families preserved

| Family | Helper | Used by |
|--------|--------|---------|
| Low-urgent priority | `priorityFromScoreLowUrgent` | Most product/late domains |
| High-healthy priority | `priorityFromScoreHighHealthy` | board-gov, DNA, revenue, HC, funding |
| High-urgent priority | `priorityFromScoreHighUrgent` | opportunity, organizational-improvement |
| 0–1 urgency | `priorityBandFromScore01` | executive-graph / decision / predictive |
| Finite clamp | `clamp` | Late domains + several product domains |
| Unchecked clamp | `clampUnchecked` | customer, funding, board, DNA, etc. |
| Confidence avg | `buildConfidenceAverage` | Late domains |
| Confidence empty→0.5 | `buildConfidenceAverageEmptyHalf` | customer / market-style |
| Confidence funding | `buildConfidenceAverageFunding` | funding |
| Level 0.3 / 0.25 / 0.75 | `levelFromValue*` | Matching prior per-domain thresholds |
| Outlook STANDARD / ELEVATED | `outlookFromScoreConfigured` + threshold consts | Domain label maps only |

Domain `models.ts` files keep public export names (`clamp`, `statusFromScore`, …) as thin typed wrappers.

## Migration summary

Migrated wrappers in **~32** `models.ts` files plus **3** satellite scorers:

- Late outlook domains (STANDARD or ELEVATED thresholds)
- Product domains (customer through legal-compliance-risk)
- Special priority variants (board / DNA / funding / opportunity / improvement)
- `executive-graph/scorer.ts`, `executive-decision/scoring.ts`, `predictive-intelligence/scoring.ts`

**Left domain-local (by design):**

- All `derive*Baseline` / `default*Baseline` / `buildLens` / engines
- Domain-unique `defaultCreateId` variants using `Date.now` (funding, opportunity, improvement, revenue)
- `area-factory.ts` inline bands (deferred; use `signalStatusFromScore` when touched later)

## Before / after duplication metrics

| Metric | Before | After |
|--------|--------|-------|
| Cross-domain scoring package | 0 | 1 (`common/`) |
| Inline `Number.isFinite` clamp copies | ~21 | 1 (in `common/numeric.ts`) |
| Inline `score < 35 → critical` bodies | ~28 | 0 |
| Domains with independent scoring blocks | ~27–36 | 0 (wrappers only) |
| Implementation of band thresholds | N copies | 1 per semantic family |

Exact helper *export names* remain on each domain for API stability; duplicated *implementations* are centralized.

## Validation

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | Pass |
| Intelligence unit suite | **52 files / 477 tests pass** |
| Scoring output behavior | Unchanged (tests + semantic-family-preserving wrappers) |
| Circular imports (`madge`) | **None** |

## Files changed

**Added**

- `src/lib/platform/intelligence/common/numeric.ts`
- `src/lib/platform/intelligence/common/bands.ts`
- `src/lib/platform/intelligence/common/confidence.ts`
- `src/lib/platform/intelligence/common/ids.ts`
- `src/lib/platform/intelligence/common/index.ts`
- `docs/architecture/STABILIZATION_A2_SHARED_SCORING.md` (this file)

**Modified (domain wrappers + satellites)**

- Late: behavioral, competitive, cultural, economic, environmental, ethical, political, reputation, stakeholder, systems, collective, ecosystem, institutional-memory, resilience, wisdom, impact
- Product / special: customer, market, operations, innovation, knowledge, document, business-model, legal-compliance-risk, board-governance, organization-dna, revenue, human-capital, funding, opportunity, organizational-improvement
- Satellites: `executive-graph/scorer.ts`, `executive-decision/scoring.ts`, `predictive-intelligence/scoring.ts`

## Confirmation

- No new intelligence domains
- No public API renames/removals (`createIntelligenceService`, domain exports unchanged)
- Runtime scoring behavior preserved via family-specific shared primitives + typed wrappers
- Package boundaries and DAG maintained (`common` is a leaf)
