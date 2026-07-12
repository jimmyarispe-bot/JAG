# Operations Intelligence (Sprint 038)

Continuously monitor and optimize day-to-day organizational operations — workflow health, process monitoring, staffing analytics, automation opportunities, capacity planning, and resource utilization.

> Distinct from `organization-health`'s `operations.ts` stub. This domain analyzes, scores, plans capacity, and recommends.

## Quick start

```ts
import { createOperationsIntelligence } from "@/lib/platform/intelligence/operations";

const { service } = createOperationsIntelligence({
  wireOrganizationDna: false,
  wireOios: false,
});

const result = service.build({
  requestId: "ops-1",
  scope: { organizationId: "org-1", schoolId: null },
});

console.log(result.healthScore, result.brief.headline);
```

## Capabilities

| Area | Components |
|------|------------|
| Core | `OperationsIntelligenceService`, `OperationsIntelligenceEngine`, `OperationsRepository`, `OperationsModels`, `OperationsDashboard`, `OperationsHealth`, `OperationsRegistry` |
| Workflow | 6 `WORKFLOW_HEALTH_DIMENSIONS` |
| Process | 8 `PROCESS_MONITORING_AREAS` |
| Staffing / Capacity | Staffing analytics + 5 `CAPACITY_PLANNING_HORIZONS` |
| Automation | 6 `AUTOMATION_OPPORTUNITY_KINDS` |
| Utilization | Resource utilization analyzer |

## Outputs

- Operations Health / Workflow / Staffing / Capacity / Automation / Risk scores
- Workflow health + process monitoring suites
- Staffing analytics + capacity plan + resource utilization
- Automation opportunities
- Executive Operations Brief, dashboard, projection
- Risks / opportunities / recommendations (six-lens)

Every recommendation answers the six `OperationsLensImpact` keys: workflow health, process bottlenecks, staffing adequacy, automation potential, capacity outlook, resource utilization.

## Architecture position

```
… → organizational-improvement → business-model → operations
```

## DI / platform

| Surface | Value |
|---------|-------|
| DI entry | `createOperationsIntelligence()` |
| Service attach | `createIntelligenceService().operations` |
| Stack | `OperationsStack { service, engine, organizationDna, oios }` |
| Platform module id | `operations` |
| Context key | `operations` |
| OIOS domain | `operations` (active) |
| Hard dependency | `business-model` |
| Soft upstream | Human Capital, Business Model, Improvement, org-health graph signals |

## Docs

- Architecture: `docs/architecture/OPERATIONS_INTELLIGENCE.md`
- Sprint summary: `docs/architecture/SPRINT038_OPERATIONS_INTELLIGENCE.md`
- Verification: `docs/architecture/OPERATIONS_INTELLIGENCE_VERIFICATION.md`
