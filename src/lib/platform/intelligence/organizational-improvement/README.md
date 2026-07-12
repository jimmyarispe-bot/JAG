# Organizational Improvement Engine (Sprint 036)

The central orchestration engine that continuously determines the highest-impact actions an organization should take — unifying every OIOS intelligence domain into prioritized, planned improvements.

## Quick start

```ts
import { createOrganizationalImprovementIntelligence } from "@/lib/platform/intelligence/organizational-improvement";

const { service } = createOrganizationalImprovementIntelligence({
  wireOrganizationDna: false,
  wireOios: false,
});

const result = service.build({
  requestId: "imp-1",
  scope: { organizationId: "org-1", schoolId: null },
});

console.log(result.improvementScore, result.dailyBrief.headline);
```

## Capabilities

| Area | Components |
|------|------------|
| Core | `ImprovementIntelligenceService`, `OrganizationalImprovementEngine`, `ImprovementRepository`, `ImprovementModels`, `ImprovementDashboard`, `ImprovementHealth`, `ImprovementPlanner`, `ImprovementRegistry` |
| Sources | Organization Health, Executive Graph, Executive Decision, Predictive, Human Capital, Revenue, Funding, Opportunity, Board Governance, Future Domains |
| Analysis | PriorityScoring, ImpactScoring, MissionAlignment, FinancialImpact, RiskReduction, TimeToValue, ResourceRequirements, OrganizationalCapacity, DependencyResolution, ImprovementConfidence |
| Planning | QuickWins, StrategicInitiatives, LongTermTransformation, Weekly/Monthly/Quarterly/Annual plans |

## Continuous improvement loop

```
Observe → Understand → Analyze → Predict → Recommend → Simulate
  → Prioritize → Plan → Execute → Measure → Learn → Repeat
```

## Outputs

- Organizational Improvement Score
- Today's Executive Priorities
- Weekly Executive Plan / Quarterly Improvement Roadmap
- Mission / Financial / People Improvement Dashboards
- Improvement Heat Map
- Daily Executive Brief + Executive Improvement Brief

Every recommendation answers **Why now?**, **Expected ROI**, **Mission / Financial / People impact**, **Implementation effort**, **Risk**, **Confidence**, **Dependencies**, and **Time to value** via `ImprovementLensImpact`.

## Architecture position

```
organization-dna → oios-core → … → funding → opportunity → organizational-improvement
```

## DI / platform

| Surface | Value |
|---------|-------|
| DI entry | `createOrganizationalImprovementIntelligence()` |
| Service attach | `createIntelligenceService().organizationalImprovement` |
| Platform module id | `organizational-improvement` |
| Context key | `organizational-improvement` |
| OIOS domain | `organizational-improvement` (active) |
| Hard dependency | `opportunity` |

## Docs

- Architecture: `docs/architecture/ORGANIZATIONAL_IMPROVEMENT.md`
- Sprint summary: `docs/architecture/SPRINT036_ORGANIZATIONAL_IMPROVEMENT.md`
- Verification: `docs/architecture/ORGANIZATIONAL_IMPROVEMENT_VERIFICATION.md`
