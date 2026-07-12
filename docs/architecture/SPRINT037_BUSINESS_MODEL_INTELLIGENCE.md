# Sprint 037 — Business Model Intelligence

**Branch:** `founder-os-beta`  
**Domain key:** `business-model`  
**Package:** `src/lib/platform/intelligence/business-model/`  
**Version:** `0.1.0`

## Vision

Create the world's first Business Model Intelligence engine. JAG should continuously understand, evaluate, simulate, compare, redesign, and optimize how organizations create, deliver, and capture value — better than founders understand their own model.

## Objective

Every recommendation answers:

1. How is value created?
2. How is value delivered?
3. How is value captured?
4. Can the model be improved?
5. Can the model scale?
6. Can the model become more sustainable?

## Delivered

- Core: `BusinessModelIntelligenceService`, `BusinessModelIntelligenceEngine`, `BusinessModelRepository`, `BusinessModelModels`, `BusinessModelDashboard`, `BusinessModelHealth`, `BusinessModelRegistry`, `BusinessModelSimulator`
- Business Model Canvas (9 blocks) + Lean Canvas (9 blocks)
- Organization design suite (11 kinds)
- Simulation (8 forecast dimensions) + scenario planning (8 kinds)
- Outputs: Health Score, canvases, Executive Business Brief, alternatives, competitive position, risks, opportunities, evolution roadmap
- OIOS domain activation for `business-model`
- Platform module `business-model` (depends on `organizational-improvement`)
- DI via `createBusinessModelIntelligence()` and `createIntelligenceService().businessModel`

## Pipeline position

```
organization-dna → oios-core → organization-health → financial → founder
  → executive → executive-graph → executive-decision → predictive
  → board-governance → human-capital → revenue → funding → opportunity
  → organizational-improvement → business-model
```

## Non-negotiables honored

- Did not regenerate Sprint 021–036 packages (including DNA `BusinessModelEngine`)
- Extended architecture via new domain package + DI + platform adapter
- Leaf modules remain leaf (`types` / `contracts` import-free of implementations)
- Soft-reads Revenue, Funding, Opportunity, Improvement, Decision, Predictive
