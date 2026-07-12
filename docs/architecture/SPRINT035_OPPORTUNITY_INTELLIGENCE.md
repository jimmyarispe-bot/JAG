# Sprint 035 — Opportunity Intelligence

**Branch:** `founder-os-beta`  
**Domain key:** `opportunity`  
**Package:** `src/lib/platform/intelligence/opportunity/`  
**Version:** `0.1.0`

## Vision

Create the world's first Organizational Opportunity Intelligence platform. Continuously discover, evaluate, prioritize, score, and recommend opportunities that make organizations healthier, stronger, more profitable, more impactful, and more sustainable — proactively, before leadership even asks.

## Objective

Every recommendation answers:

1. How does this improve the organization?
2. How does this improve financial sustainability?
3. How does this improve mission impact?
4. How does this improve long-term value?
5. How quickly can we realize the benefit?

## Delivered

- Core: OpportunityIntelligenceService, OpportunityEngine, OpportunityRepository, OpportunityModels, OpportunityDashboard, OpportunityHealth, OpportunityExchange, OpportunityRegistry
- 22 opportunity categories + full analysis and ranking suites
- Outputs: Top Opportunities / Quick Wins / Strategic Investment / Mission Opportunity dashboards, Opportunity Pipeline, Heat Map, Opportunity Score, Executive Opportunity Brief
- OIOS domain activation for `opportunity`
- Platform module `opportunity` (depends on `funding`)
- DI via `createOpportunityIntelligence()` and `createIntelligenceService().opportunity`

## Pipeline position

```
organization-dna → oios-core → organization-health → financial → founder
  → executive → executive-graph → executive-decision → predictive
  → board-governance → human-capital → revenue → funding → opportunity
```

## Non-negotiables honored

- Did not regenerate Sprint 021–034 packages
- Extended architecture via new domain package + DI + platform adapter
- Leaf modules remain leaf (`types` / `contracts` import-free of implementations)
