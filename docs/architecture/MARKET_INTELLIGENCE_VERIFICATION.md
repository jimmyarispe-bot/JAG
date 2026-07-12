# Market Intelligence - Verification Checklist

## Static

- [x] Package exists at `src/lib/platform/intelligence/market/`
- [x] `types.ts` / `contracts.ts` remain leaf (no implementation imports)
- [x] `MARKET_INTELLIGENCE_VERSION = "0.1.0"`
- [x] Constants: 12 capability areas, 11 signal kinds, 8-field market lens
- [x] 8-field recommendation lens on recommendations and briefs
- [x] `market` in `OIOS_INTELLIGENCE_DOMAINS` and active in `defaultRegisteredDomains()`
- [x] `market` in `INTELLIGENCE_MODULE_IDS`
- [x] Module adapter registered after `legal-compliance-risk` in `createDefaultIntelligenceModules()`
- [x] `createIntelligenceService()` exposes `.market`
- [x] Public exports present on `@/lib/platform/intelligence`
- [x] Sprint / architecture docs present
- [x] Does not regenerate Sprint 021-042 packages (Legal, Compliance & Risk frozen)

## Behavioral

- [x] `service.build()` returns health / competitive position / expansion opportunity / market risk and all 12 area scores
- [x] Market signal suite covers all `MARKET_SIGNAL_KINDS`
- [x] Market size includes TAM / SAM / SOM
- [x] Result includes Competitive Dashboard, Expansion Dashboard, Trend Dashboard
- [x] Result includes Executive Market Brief
- [x] Every recommendation includes all eight lens keys plus evidence refs, confidence score, risk score, market size / investment / expected return estimates, competitors, capabilities required, owner, due date, priority
- [x] Knowledge contribution writes drafts to `knowledgeContribution.artifacts`
- [x] Query focuses include industry / competitive / market_size / pricing / demand / demographic / geographic / economic / technology / partnership / ma / white_space / signals / recommendations / reasoning
- [x] Query + repository persistence work
- [x] Soft upstream light types: knowledge, document, legal-compliance-risk, revenue, funding, customer, business-model, operations, opportunity, predictive
- [x] `createMarketIntelligence()` returns `MarketStack`
- [x] Platform pipeline order ends with `legal-compliance-risk -> market`
- [x] All module results `ok: true`

## Commands

```bash
npx tsc --noEmit
npx vitest run tests/unit/intelligence/
```

## Expected Pipeline Order

```
organization-dna -> oios-core -> organization-health -> financial -> founder
-> executive -> executive-graph -> executive-decision -> predictive
-> board-governance -> human-capital -> revenue -> funding -> opportunity
-> organizational-improvement -> business-model -> operations -> customer
-> knowledge -> document -> legal-compliance-risk -> market
```
