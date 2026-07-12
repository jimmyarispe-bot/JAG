# Business Model Intelligence

**Sprint:** 037  
**Package:** `src/lib/platform/intelligence/business-model/`  
**Module id / context key / OIOS domain:** `business-model`

## Purpose

Continuously understand, evaluate, simulate, compare, redesign, and optimize how organizations create, deliver, and capture value — without regenerating DNA's `BusinessModelEngine` artifact builder.

## Package layout

| File | Role |
|------|------|
| `types.ts` | Leaf DTOs, enums, request/result |
| `contracts.ts` | Leaf interfaces + DI bag |
| `models.ts` | Baseline derivation + `BusinessModelModels` |
| `canvas-intelligence.ts` | BMC + Lean Canvas builders |
| `design-intelligence.ts` | Organization design suite (11 kinds) |
| `scenario-intelligence.ts` | 8 scenario kinds |
| `business-model-simulator.ts` | Multi-model simulation + comparison |
| `business-model-registry.ts` | Upstream publisher registry |
| `business-model-intelligence.ts` | Scores, health, dashboard, analyzers, brief |
| `business-model-engine.ts` | Orchestrator |
| `service.ts` / `repository.ts` / `projection.ts` | Façade, store, queries |
| `index.ts` | Public API + `createBusinessModelIntelligence()` |

## Composition flow

1. Derive baseline from DNA / OIOS / graph / prediction / soft revenue-funding-opportunity-improvement signals  
2. Build Business Model Canvas + Lean Canvas  
3. Analyze organization design alternatives  
4. Plan scenarios  
5. Simulate and compare models across 8 forecast dimensions  
6. Assess competitive position, risks, opportunities  
7. Compose evolution roadmap + recommendations  
8. Score health / clarity / scalability / sustainability  
9. Generate executive brief, projection, persist history  

## Six-lens contract

Every recommendation answers:

1. How is value created?  
2. How is value delivered?  
3. How is value captured?  
4. Can the model be improved?  
5. Can the model scale?  
6. Can the model become more sustainable?  

## Integrations

| Domain | Integration |
|--------|-------------|
| Organization DNA | Archetype, BMC seeds, value proposition |
| Revenue / Funding / Opportunity / Improvement | Soft context attachments |
| Executive Decision / Predictive | Soft alignment metadata |
| Economic Intelligence | Reserved (future) |

## Platform wiring

- Module adapter: `infrastructure/modules/business-model.ts`
- Hard DAG dependency: `organizational-improvement`
- DI: `createBusinessModelIntelligence()` / `createIntelligenceService().businessModel`
