# Innovation Intelligence (Sprint 044)

JAG's innovation engine for the OIOS. Continuously discover, evaluate, and
prioritize new ideas that improve the organization. This is **not** a suggestion
box — it is organizational innovation intelligence spanning ideation → experiment
→ portfolio → roadmap.

First **Future Intelligence** domain (foresight / innovation / strategy),
composing onto Market (External) and Improvement/Knowledge (Internal).

- Domain key / module id: `innovation`
- Version: `0.1.0`
- Soft integrations: Market, Opportunity, Knowledge, Document, Business Model,
  Organizational Improvement, Decision, Predictive

## Capability submodules

1. `idea-management-intelligence.ts` — Idea Management
2. `research-development-intelligence.ts` — Research & Development
3. `product-service-innovation-intelligence.ts` — Product / Service Innovation
4. `process-innovation-intelligence.ts` — Process Innovation
5. `ai-opportunity-intelligence.ts` — AI Opportunity Discovery
6. `technology-adoption-intelligence.ts` — Technology Adoption
7. `emerging-technology-intelligence.ts` — Emerging Technology Monitoring
8. `innovation-portfolio-intelligence.ts` — Innovation Portfolio (H1/H2/H3)
9. `experiment-management-intelligence.ts` — Experiment Management
10. `proof-of-concept-intelligence.ts` — Proof of Concept Tracking
11. `intellectual-property-intelligence.ts` — Intellectual Property Tracking
12. `continuous-improvement-intelligence.ts` — Continuous Improvement Opportunities
13. `strategic-roadmap-intelligence.ts` — Strategic Innovation Roadmaps

## Horizons & statuses

- Horizons: `h1_core`, `h2_adjacent`, `h3_transformational`
- Idea statuses: `submitted`, `screening`, `validated`, `experimenting`,
  `scaling`, `parked`, `rejected`
- Experiment statuses: `planned`, `running`, `completed`, `failed`, `scaled`
- Technology radar rings: `adopt`, `trial`, `assess`, `hold`
- IP kinds: `patent`, `trademark`, `copyright`, `trade_secret`, `license`

## Recommendation lens (8 required fields)

Every recommendation surfaces the innovation lens:

- `innovationOpportunityExists`
- `evidenceSupports`
- `problemSolved`
- `expectedImpact`
- `investmentRequired`
- `experimentsValidate`
- `risksExist`
- `capabilitiesRequired`

Recommendations also carry evidence refs, confidence score, risk score, impact /
investment estimates, experiment refs, capabilities required, owner, due date,
and priority.

## Outputs

- Innovation Health Score, Pipeline / Experiment / Portfolio / Radar scores
- Innovation pipeline, idea backlog, experiment dashboard
- Innovation portfolio by horizon (H1/H2/H3)
- Technology radar (adopt / trial / assess / hold)
- Executive Innovation Brief
- Knowledge contribution drafts through `knowledgeContribution.artifacts`

## Usage

```ts
import { createInnovationIntelligence } from "@/lib/platform/intelligence/innovation";

const { service } = createInnovationIntelligence({ wireOrganizationDna: false, wireOios: false });
const result = service.build({
  requestId: "inn-1",
  scope: { organizationId: "org-1", schoolId: "school-1" },
});
```
