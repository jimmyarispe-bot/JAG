# Organizational DNA & Company Builder (Sprint 030)

Foundational organizational profile for the JAG Organizational Intelligence Operating System. Generates Organizational DNA, Company Builder artifacts, readiness, blueprint, and roadmap from idea through exit / succession.

## Quick start

```ts
import { createOrganizationDnaIntelligence } from "@/lib/platform/intelligence/organization-dna";

const { service } = createOrganizationDnaIntelligence({
  createId: (prefix) => `${prefix}-demo`,
  now: () => new Date("2026-07-12T12:00:00.000Z"),
  wireGraphAnalyzer: false,
  wireDecision: false,
  wirePredictive: false,
  wireBoardGovernance: false,
});

const result = service.buildFromSeed({
  name: "Northstar Academy",
  industry: "education",
  sector: "schools",
  ideaSummary: "A school operating system for clarity and growth",
  problemStatement: "Leaders lack a shared organizational genotype",
  targetCustomer: "School founders and heads of school",
  stageHint: "startup",
});

console.log(result.dna.stage);
console.log(result.dna.score.overall);
console.log(result.artifacts.map((a) => a.kind));
```

Via the master service:

```ts
import { createIntelligenceService } from "@/lib/platform/intelligence";

const service = createIntelligenceService();
const result = service.organizationDna.service.build({
  requestId: "dna-1",
  seed: { name: "Acme Org", stageHint: "idea" },
});
```

## Capabilities

| Capability | Implementation |
|------------|----------------|
| Organizational DNA | `OrganizationDNA` / engine composer |
| Organization Profile | `OrganizationProfile` |
| Company Builder | `CompanyBuilder` |
| Stage Detection | `OrganizationStageDetector` |
| Lifecycle | `OrganizationLifecycle` |
| Business Model | `BusinessModelEngine` |
| Business Plan | `BusinessPlanBuilder` |
| Lean Canvas | `LeanCanvasGenerator` |
| SWOT | `SwotGenerator` |
| Value Proposition | `ValuePropositionBuilder` |
| Customer Personas | `CustomerPersonaBuilder` |
| Revenue Model | `RevenueModelBuilder` |
| Funding Model | `FundingModelBuilder` |
| Go-To-Market | `GoToMarketPlanner` |
| Readiness Assessment | `CompanyReadinessAssessment` |
| Readiness Scoring | `ReadinessScoring` |
| Executive Roadmap | `ExecutiveRoadmap` |
| Executive Blueprint | `OrganizationBlueprint` |
| Mission / Vision / Values / Culture | dedicated builders |
| Goals / Constraints / Capabilities | dedicated builders |
| Organization Service | `OrganizationService` |

## Organization stages

`idea` → `startup` → `operating` → `growth` · lateral: `turnaround`, `acquisition`, `exit`

## Architecture position

```
organization-dna (foundational)
  → organization-health → financial → founder → executive
  → executive-graph → executive-decision → predictive
  → board-governance
```

Every intelligence module can consume Organizational DNA via:

- Direct import of `OrganizationDNA` / `OrganizationDnaResult` types
- Platform context key `organizationDna`
- `createIntelligenceService().organizationDna`

## DI entry

`createOrganizationDnaIntelligence()` — also attached on `createIntelligenceService().organizationDna` and registered as platform module `organization-dna`.
