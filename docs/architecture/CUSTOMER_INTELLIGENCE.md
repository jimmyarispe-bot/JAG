# Customer Intelligence

**Sprint:** 039  
**Package:** `src/lib/platform/intelligence/customer/`  
**Module id / OIOS domain:** `customer`

## Purpose

Continuously monitor and improve the family and student experience across the school lifecycle — without regenerating Revenue's customer suite or DNA personas.

## Package layout

| File | Role |
|------|------|
| `types.ts` | Leaf DTOs, enums, request/result |
| `contracts.ts` | Leaf interfaces + DI bag |
| `models.ts` | Baseline derivation + `CustomerModels` |
| `journey-intelligence.ts` | Journey map across lifecycle stages |
| `engagement-intelligence.ts` | Engagement + satisfaction engines |
| `retention-intelligence.ts` | Retention risk + community belonging |
| `customer-registry.ts` | Upstream publisher registry |
| `customer-intelligence.ts` | Scores, health, dashboard, analyzers, brief |
| `customer-engine.ts` | Orchestrator |
| `service.ts` / `repository.ts` / `projection.ts` | Façade, store, queries |
| `index.ts` | Public API + `createCustomerIntelligence()` |

## Composition flow

1. Derive baseline from DNA / OIOS / graphInput organization-health + executive signals / revenue / operations soft lights  
2. Map journey stages (all 6)  
3. Assess engagement dimensions (all 6)  
4. Assess satisfaction signals (all 6)  
5. Analyze retention risk factors (all 6)  
6. Assess community belonging pillars (all 5)  
7. Assess risks / opportunities + compose recommendations  
8. Score health / engagement / journey / satisfaction / retention / community / risk  
9. Generate executive brief, projection, persist history  

## Six-lens contract

Every recommendation includes:

1. `familyExperience`  
2. `studentEngagement`  
3. `journeyContinuity`  
4. `satisfactionSentiment`  
5. `retentionRisk`  
6. `communityBelonging`  

## Integrations

| Domain | Integration |
|--------|-------------|
| Organization DNA | Persona / segment richness soft signals |
| OIOS Core | Execution / health baseline |
| Organization Health (graph) | `enrollmentScore`, enrollment, attendance, admissions |
| Revenue | Soft `RevenueResultLight` retention/health proxies |
| Operations | Soft `OperationsResultLight` support/workflow signals |

## Distinct from

- Revenue Intelligence customer-value / LTV suite  
- Organization DNA persona builders  
- JAG Success Intelligence domain  

## Platform

| Surface | Value |
|---------|-------|
| Module id | `customer` |
| Context key | `customer` |
| Hard dependency | `operations` |
| OIOS status | active |
| Service attach | `createIntelligenceService().customer` |
