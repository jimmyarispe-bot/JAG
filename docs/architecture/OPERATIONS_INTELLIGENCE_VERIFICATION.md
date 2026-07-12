# Operations Intelligence — Verification Checklist

## Static

- [x] Package exists at `src/lib/platform/intelligence/operations/`
- [x] `types.ts` / `contracts.ts` remain leaf (no implementation imports)
- [x] `OPERATIONS_INTELLIGENCE_VERSION = "0.1.0"`
- [x] Constants: 6 workflow dimensions, 8 process areas, 6 automation kinds, 5 capacity horizons
- [x] `operations` in `OIOS_INTELLIGENCE_DOMAINS` and active in `defaultRegisteredDomains()`
- [x] `operations` in `INTELLIGENCE_MODULE_IDS`
- [x] Module adapter registered after `business-model` in `createDefaultIntelligenceModules()`
- [x] `createIntelligenceService()` exposes `.operations`
- [x] Public exports present on `@/lib/platform/intelligence`
- [x] README + CHANGELOG + sprint/architecture docs present
- [x] Does not regenerate organization-health `operations.ts`
- [x] Does not regenerate Sprint 021–037 packages

## Behavioral

- [x] `service.build()` returns health/workflow/staffing/capacity/automation/risk scores
- [x] Workflow health covers all `WORKFLOW_HEALTH_DIMENSIONS`
- [x] Process monitoring covers all `PROCESS_MONITORING_AREAS`
- [x] Capacity plan covers all `CAPACITY_PLANNING_HORIZONS`
- [x] Automation opportunities cover all `AUTOMATION_OPPORTUNITY_KINDS`
- [x] Result includes staffing analytics, resource utilization, dashboard, brief, projection
- [x] Every recommendation includes all six `OperationsLensImpact` keys
- [x] Query + repository persistence work
- [x] Soft upstream light types: `HumanCapitalResultLight`, `BusinessModelResultLight`, `ImprovementResultLight`
- [x] `createOperationsIntelligence()` returns `OperationsStack`
- [x] Platform pipeline order ends with `operations`
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
→ organizational-improvement → business-model → operations
```
