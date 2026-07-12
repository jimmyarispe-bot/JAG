# Operations Intelligence

**Sprint:** 038  
**Package:** `src/lib/platform/intelligence/operations/`  
**Module id / OIOS domain:** `operations`

## Purpose

Continuously monitor and optimize day-to-day organizational operations — without regenerating organization-health's `operations.ts` stub.

## Package layout

| File | Role |
|------|------|
| `types.ts` | Leaf DTOs, enums, request/result |
| `contracts.ts` | Leaf interfaces + DI bag |
| `models.ts` | Baseline derivation + `OperationsModels` |
| `workflow-intelligence.ts` | Workflow health + process monitoring |
| `capacity-intelligence.ts` | Staffing analytics, capacity plan, utilization |
| `automation-intelligence.ts` | Automation opportunity discovery |
| `operations-registry.ts` | Upstream publisher registry |
| `operations-intelligence.ts` | Scores, health, dashboard, analyzers, brief |
| `operations-engine.ts` | Orchestrator |
| `service.ts` / `repository.ts` / `projection.ts` | Façade, store, queries |
| `index.ts` | Public API + `createOperationsIntelligence()` |

## Composition flow

1. Derive baseline from DNA / OIOS / graphInput organization-health + executive signals / HC / BM / improvement soft lights  
2. Assess workflow health (all 6 dimensions)  
3. Monitor processes (all 8 areas)  
4. Analyze staffing adequacy  
5. Plan capacity across all 5 horizons  
6. Analyze resource utilization  
7. Discover automation opportunities (all 6 kinds)  
8. Assess risks / opportunities + compose recommendations  
9. Score health / workflow / staffing / capacity / automation / risk  
10. Generate executive brief, projection, persist history  

## Six-lens contract

Every recommendation includes:

1. `workflowHealth`  
2. `processBottlenecks`  
3. `staffingAdequacy`  
4. `automationPotential`  
5. `capacityOutlook`  
6. `resourceUtilization`  

## Integrations

| Domain | Integration |
|--------|-------------|
| Organization DNA | Operating model / key activities soft signals |
| OIOS Core | Execution / health baseline |
| Organization Health (graph) | `operationsScore`, `workforceScore`, attendance/staff |
| Human Capital | Soft `HumanCapitalResultLight` |
| Business Model | Soft `operationalComplexity` light |
| Organizational Improvement | Soft improvement readiness |

## DI / platform

| Surface | Value |
|---------|-------|
| DI entry | `createOperationsIntelligence()` |
| Service attach | `createIntelligenceService().operations` |
| Platform module id | `operations` |
| Context key | `operations` |
| OIOS domain | `operations` (active) |
| Hard dependency | `business-model` |
