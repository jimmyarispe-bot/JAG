# Opportunity Intelligence — Verification Checklist

**Sprint:** 035  
**Domain:** `opportunity`

## Static checks

- [x] Package exists at `src/lib/platform/intelligence/opportunity/`
- [x] Leaf modules (`types`, `contracts`) do not import implementations
- [x] `createOpportunityIntelligence()` returns typed stack
- [x] Platform adapter `infrastructure/modules/opportunity.ts` writes context key `opportunity`
- [x] `opportunity` appended to `INTELLIGENCE_MODULE_IDS`
- [x] Default module provider includes `createOpportunityModule`
- [x] `createIntelligenceService()` wires `opportunity` stack
- [x] OIOS registry activates `opportunity` with dependencies
- [x] Public exports available from `@/lib/platform/intelligence`
- [x] README + CHANGELOG present
- [x] Architecture + sprint + verification docs present

## Behavioral checks

- [x] Full `build()` populates all 22 categories
- [x] Exchange records include title, domain, impacts, cost, resources, timeline, confidence, priority, dependencies, risks, DNA alignment
- [x] Analysis suite produces ROI, impact, risk, confidence, dependency, resource, time-to-value, and strategic alignment rows
- [x] Seven ranking lenses are present
- [x] Dashboards: top, quick wins, strategic, mission, heat map, pipeline
- [x] Executive Opportunity Brief generated
- [x] Five-lens keys present on recommendations
- [x] Query + repository persistence works
- [x] Platform pipeline order ends with `funding → opportunity`
- [x] Existing domain packages were not regenerated

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
```
