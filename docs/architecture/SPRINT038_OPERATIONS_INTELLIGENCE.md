# Sprint 038 — Operations Intelligence

**Branch:** `founder-os-beta`  
**Domain key:** `operations`  
**Package:** `src/lib/platform/intelligence/operations/`  
**Version:** `0.1.0`

## Vision

Continuously monitor and optimize day-to-day organizational operations — workflow health, process monitoring, staffing analytics, automation opportunities, capacity planning, and resource utilization.

## Objective

Every recommendation answers:

1. How is workflow health affected?
2. Where are process bottlenecks?
3. Is staffing adequate?
4. What automation potential exists?
5. What is the capacity outlook?
6. How is resource utilization?

## Delivered

- Core: `OperationsIntelligenceService`, `OperationsIntelligenceEngine`, `OperationsRepository`, `OperationsModels`, `OperationsDashboard`, `OperationsHealth`, `OperationsRegistry`
- Workflow health (6 dimensions) + process monitoring (8 areas)
- Staffing analytics + capacity plan (5 horizons) + resource utilization
- Automation opportunities (6 kinds)
- Outputs: scores, Executive Operations Brief, dashboard, projection, risks, opportunities, recommendations
- OIOS domain activation for `operations`
- Platform module `operations` (depends on `business-model`)
- DI via `createOperationsIntelligence()` and `createIntelligenceService().operations`

## Pipeline position

```
organization-dna → oios-core → organization-health → financial → founder
  → executive → executive-graph → executive-decision → predictive
  → board-governance → human-capital → revenue → funding → opportunity
  → organizational-improvement → business-model → operations
```

## Non-negotiables honored

- Did not regenerate Sprint 021–037 packages
- Did not touch organization-health `operations.ts` stub
- Leaf modules remain leaf (`types` / `contracts` import-free of implementations)
- Soft-reads Human Capital, Business Model, Improvement, and org-health graph signals
