# Revenue Intelligence — Verification Checklist

## Build & types

- [x] `npx tsc --noEmit` passes
- [x] No circular imports between `revenue` and infrastructure adapters
- [x] Package exports resolve from `@/lib/platform/intelligence` and `@/lib/platform/intelligence/revenue`

## Package completeness

- [x] Core: service, engine, repository, models, dashboard, health
- [x] Strategy suite (mix, diversification, recurring, risk, optimization, growth, forecast, scenarios)
- [x] Pricing suite (engine, dynamic, elasticity, competitive, discount, scholarship, contract, subscription)
- [x] Offering suite (analysis, product/service profitability, margin, lifecycle, expansion, retirement)
- [x] Customer suite (LTV, retention, expansion, cross-sell, upsell, profitability, segments)
- [x] Sales suite (pipeline, win rate, performance, capacity, territory, conversion)
- [x] Market suite (expansion, competitor, demand, opportunity, geographic, benchmarks)
- [x] Financial margin suite (gross/net/contribution, break-even, unit economics, cash, sensitivity)
- [x] Outputs: scores, dashboards, forecast, expansion, pricing recommendations, executive brief
- [x] README + CHANGELOG

## Functional scenarios

- [x] Full `build()` produces scores, suites, dashboards, brief, projection, confidence, history
- [x] Query + repository persistence (`get`, `list`, `listHistory`)
- [x] `createIntelligenceService().revenue` wired
- [x] Platform module `revenue` runs after `human-capital`
- [x] Default pipeline order includes `revenue`
- [x] OIOS domain `revenue` is active

## Tests

- [x] `tests/unit/intelligence/revenue.test.ts` passes
- [x] Pipeline order assertions include `revenue`
- [x] Infrastructure module count updated to 12

## Suggested commit message

```
feat(intelligence): add Sprint 033 Revenue Intelligence

Activate revenue lifecycle intelligence so OIOS can grow, retain,
price, and optimize sustainable revenue as a first-class domain.
```
