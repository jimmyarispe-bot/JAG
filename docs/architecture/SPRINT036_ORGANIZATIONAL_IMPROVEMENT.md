# Sprint 036 — Organizational Improvement Engine

**Branch:** `founder-os-beta`  
**Domain key:** `organizational-improvement`  
**Package:** `src/lib/platform/intelligence/organizational-improvement/`  
**Version:** `0.1.0`

## Vision

Create the central orchestration engine that continuously determines the highest-impact actions an organization should take. This is the brain that unifies every intelligence domain — every domain contributes opportunities; the Improvement Engine prioritizes them.

## Objective

Every recommendation answers:

1. Why now?
2. Expected ROI
3. Mission impact
4. Financial impact
5. People impact
6. Implementation effort
7. Risk
8. Confidence
9. Dependencies
10. Time to value

## Delivered

- Core: OrganizationalImprovementEngine, ImprovementService, ImprovementRepository, ImprovementModels, ImprovementDashboard, ImprovementHealth, ImprovementPlanner, ImprovementRegistry
- Ten improvement sources + full analysis and planning suites
- Continuous Improvement Loop (12 stages)
- Outputs: Improvement Score, Today's Priorities, Weekly Plan, Quarterly Roadmap, Mission/Financial/People dashboards, Heat Map, Daily Executive Brief, Executive Improvement Brief
- OIOS domain activation for `organizational-improvement`
- Platform module `organizational-improvement` (depends on `opportunity`)
- DI via `createOrganizationalImprovementIntelligence()` and `createIntelligenceService().organizationalImprovement`

## Pipeline position

```
organization-dna → oios-core → organization-health → financial → founder
  → executive → executive-graph → executive-decision → predictive
  → board-governance → human-capital → revenue → funding → opportunity
  → organizational-improvement
```

## Non-negotiables honored

- Did not regenerate Sprint 021–035 packages
- Extended architecture via new domain package + DI + platform adapter
- Leaf modules remain leaf (`types` / `contracts` import-free of implementations)
- Consumes Opportunity Exchange contracts published by OIOS domains
