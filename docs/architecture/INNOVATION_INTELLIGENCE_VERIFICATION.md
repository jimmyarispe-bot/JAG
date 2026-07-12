# Innovation Intelligence - Verification Checklist

## Static

- [x] Package exists at `src/lib/platform/intelligence/innovation/`
- [x] `types.ts` / `contracts.ts` remain leaf (no implementation imports)
- [x] `INNOVATION_INTELLIGENCE_VERSION = "0.1.0"`
- [x] Constants: 13 capability areas, horizons, radar rings, 8-field innovation lens
- [x] 8-field recommendation lens on recommendations and briefs
- [x] `innovation` in `OIOS_INTELLIGENCE_DOMAINS` and active in `defaultRegisteredDomains()`
- [x] `innovation` in `INTELLIGENCE_MODULE_IDS`
- [x] Module adapter registered after `market` in `createDefaultIntelligenceModules()`
- [x] `createIntelligenceService()` exposes `.innovation`
- [x] Public exports present on `@/lib/platform/intelligence`
- [x] Sprint / architecture docs present (including layer model)
- [x] Does not regenerate Sprint 021-043 packages (Market frozen)

## Behavioral

- [x] `service.build()` returns health / pipeline / experiment / portfolio / radar and all area scores
- [x] Technology radar covers all `TECHNOLOGY_RADAR_RINGS`
- [x] Innovation portfolio covers all `INNOVATION_HORIZONS`
- [x] Result includes Innovation Pipeline, Idea Backlog, Experiment Dashboard, Innovation Portfolio, Technology Radar
- [x] Result includes Executive Innovation Brief
- [x] Every recommendation includes all eight lens keys plus evidence refs, confidence score, risk score, impact / investment estimates, experiment refs, capabilities required, owner, due date, priority
- [x] Knowledge contribution writes drafts to `knowledgeContribution.artifacts`
- [x] Query focuses include ideas / rd / product / process / ai / adoption / emerging / portfolio / experiments / poc / ip / improvement / roadmap / recommendations / reasoning
- [x] Query + repository persistence work
- [x] Soft upstream light types: market, opportunity, knowledge, document, business-model, organizational-improvement, decision, predictive
- [x] `createInnovationIntelligence()` returns `InnovationStack`
- [x] Platform pipeline order ends with `market -> innovation`
- [x] All module results `ok: true`

## Commands

```bash
npx tsc --noEmit
npx vitest run tests/unit/intelligence/innovation.test.ts
npx vitest run tests/unit/intelligence/
```

## Expected Pipeline Order

```
organization-dna -> oios-core -> organization-health -> financial -> founder
-> executive -> executive-graph -> executive-decision -> predictive
-> board-governance -> human-capital -> revenue -> funding -> opportunity
-> organizational-improvement -> business-model -> operations -> customer
-> knowledge -> document -> legal-compliance-risk -> market -> innovation
```
