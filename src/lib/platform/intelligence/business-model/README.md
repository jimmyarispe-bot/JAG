# Business Model Intelligence (Sprint 037)

The world's first Business Model Intelligence engine for JAG OIOS — continuously understand, evaluate, simulate, compare, redesign, and optimize how organizations create, deliver, and capture value.

> Distinct from `organization-dna`'s `BusinessModelEngine` (DNA artifact builder). This domain analyzes, scores, simulates, and recommends.

## Quick start

```ts
import { createBusinessModelIntelligence } from "@/lib/platform/intelligence/business-model";

const { service } = createBusinessModelIntelligence({
  wireOrganizationDna: false,
  wireOios: false,
});

const result = service.build({
  requestId: "bm-1",
  scope: { organizationId: "org-1", schoolId: null },
});

console.log(result.healthScore, result.brief.headline);
```

## Capabilities

| Area | Components |
|------|------------|
| Core | `BusinessModelIntelligenceService`, `BusinessModelIntelligenceEngine`, `BusinessModelRepository`, `BusinessModelModels`, `BusinessModelDashboard`, `BusinessModelHealth`, `BusinessModelRegistry`, `BusinessModelSimulator` |
| Canvas | Business Model Canvas (9 blocks), Lean Canvas (9 blocks) |
| Design | Business Units, Operating, Franchise, Licensing, Platform, Marketplace, Subscription, Hybrid, Multi-Entity, Holding, Shared Services |
| Simulation | Multi-model compare + 8 forecast dimensions |
| Scenarios | Current, Alternative, Best Practice, Competitor, Future, Mission-first, High-growth, High-margin |

## Outputs

- Business Model Health Score
- Business Model Canvas + Lean Canvas
- Executive Business Brief
- Alternative Business Models
- Competitive Position
- Business Model Risks / Opportunities
- Business Model Evolution Roadmap

Every recommendation answers **How is value created / delivered / captured?** and **Can the model be improved / scale / become more sustainable?** via `BusinessModelLensImpact`.

## Architecture position

```
… → opportunity → organizational-improvement → business-model
```

## DI / platform

| Surface | Value |
|---------|-------|
| DI entry | `createBusinessModelIntelligence()` |
| Service attach | `createIntelligenceService().businessModel` |
| Platform module id | `business-model` |
| Context key | `business-model` |
| OIOS domain | `business-model` (active) |
| Hard dependency | `organizational-improvement` |

## Docs

- Architecture: `docs/architecture/BUSINESS_MODEL_INTELLIGENCE.md`
- Sprint summary: `docs/architecture/SPRINT037_BUSINESS_MODEL_INTELLIGENCE.md`
- Verification: `docs/architecture/BUSINESS_MODEL_INTELLIGENCE_VERIFICATION.md`
