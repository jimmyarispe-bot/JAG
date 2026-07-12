# Business Model Intelligence — Verification Checklist

## Static

- [x] Package exists at `src/lib/platform/intelligence/business-model/`
- [x] `types.ts` / `contracts.ts` remain leaf (no implementation imports)
- [x] `business-model` in `OIOS_INTELLIGENCE_DOMAINS` and active in `defaultRegisteredDomains()`
- [x] `business-model` in `INTELLIGENCE_MODULE_IDS`
- [x] Module adapter registered after `organizational-improvement` in `createDefaultIntelligenceModules()`
- [x] `createIntelligenceService()` exposes `.businessModel`
- [x] Public exports present on `@/lib/platform/intelligence`
- [x] README + CHANGELOG + sprint/architecture docs present
- [x] Does not regenerate DNA `BusinessModelEngine`

## Behavioral

- [x] `service.build()` returns scores, canvases, design, simulations, scenarios, dashboard, brief
- [x] BMC covers all 9 blocks; Lean Canvas covers all 9 blocks
- [x] Organization design includes current + alternatives + recommended
- [x] Scenarios cover all 8 `BUSINESS_MODEL_SCENARIO_KINDS`
- [x] Simulation forecasts cover all 8 `SIMULATION_FORECAST_DIMENSIONS`
- [x] Every recommendation includes all six `BusinessModelLensImpact` keys
- [x] Query + repository persistence work
- [x] Platform pipeline order ends with `business-model`
- [x] All module results `ok: true`

## Commands

```bash
npx tsc --noEmit
npx vitest run tests/unit/intelligence/
```

## Expected pipeline order

```
organization-dna → oios-core → organization-health → financial → founder
→ executive → executive-graph → executive-decision → predictive
→ board-governance → human-capital → revenue → funding → opportunity
→ organizational-improvement → business-model
```
