# Sprint 032 — Human Capital Intelligence

**Branch:** `founder-os-beta`  
**Domain key:** `human-capital`  
**Package:** `src/lib/platform/intelligence/human-capital/`

## Vision

Build the world's most comprehensive Human Capital Intelligence platform — not HR software. Maximize organizational capability by identifying, recruiting, hiring, developing, coaching, retaining, recognizing, evaluating, and growing extraordinary people across the employee lifecycle.

## Objective

Every recommendation answers:

1. How does this improve the organization?
2. How does this improve employees?
3. How does this improve leaders?
4. How does this improve mission outcomes?
5. How does this improve financial sustainability?

## Delivered

- Core: HumanCapitalService, HumanCapitalEngine, WorkforceIntelligence, WorkforceRepository, WorkforceModels, HumanCapitalDashboard
- Recruiting, Employee, Leadership, Retention, Learning, Compensation, and Planning intelligence suites
- Outputs: Workforce / Leadership / Engagement / Talent Risk scores, Hiring Priority Dashboard, Burnout Risk Dashboard, Succession Readiness, Organizational Capability Index, Executive Workforce Brief, Career Development Plans, Coaching Recommendations
- OIOS domain activation for `human-capital`
- Platform module `human-capital` (depends on `board-governance`)
- DI via `createHumanCapitalIntelligence()` and `createIntelligenceService().humanCapital`

## Pipeline position

```
organization-dna → oios-core → organization-health → financial → founder
  → executive → executive-graph → executive-decision → predictive
  → board-governance → human-capital
```

## Non-negotiables honored

- Did not regenerate Sprint 021–031 packages
- Extended architecture via new domain package + DI + platform adapter
- Leaf modules remain leaf (`types` / `contracts` import-free of implementations)
