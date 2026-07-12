# Executive Decision Intelligence (Sprint 026)

Production decision engine that sits on top of the **Executive Graph Analyzer** and lets JAG simulate strategic decisions before they are made.

## Package location

`src/lib/platform/intelligence/executive-decision/`

## Quick start

```ts
import {
  createExecutiveDecisionIntelligence,
  createPresetScenario,
} from "@/lib/platform/intelligence/executive-decision";

const { service } = createExecutiveDecisionIntelligence();

const result = service.evaluate({
  requestId: "dec-1",
  question: "What happens if enrollment drops 10%?",
  scenarios: [
    createPresetScenario("enrollment_drop", { magnitude: 0.1 }),
    createPresetScenario("payroll_increase", { magnitude: 0.08 }),
    createPresetScenario("hiring_timing"),
    createPresetScenario("strategic_initiative"),
  ],
  graphInput: {
    scope: { organizationId: "org-1", schoolId: "school-1" },
    executive: {
      enrollment: 120,
      admissions: 18,
      revenue: 54000,
      outstanding: 12000,
      staff: 42,
    },
    organizationHealth: {
      overallScore: 78,
      enrollmentScore: 72,
      financialScore: 81,
    },
    founder: {
      healthScore: 78,
      healthStatus: "warning",
    },
  },
});

console.log(result.projection.headline);
console.log(result.recommendations[0]?.executiveSummary);
console.log(result.recommendations[0]?.confidenceScore);
```

## Components

| Component | Role |
|-----------|------|
| `DecisionEngine` | Orchestrates evaluate pipeline |
| `ScenarioSimulator` | What-if simulation runner |
| `RecommendationEngine` | Full executive recommendations |
| `StrategyEngine` | Initiative ROI ranking |
| `TradeoffAnalyzer` | Pairwise option comparison |
| `ImpactForecast` | Financial / operational / mission forecast |
| `DecisionConfidence` | Calibrated confidence |
| `DecisionHistory` | In-memory decision audit trail |
| `ScenarioRepository` | Scenario definition store |
| `DecisionModels` | Baseline / shock / preset helpers |
| `ExecutiveDecisionService` | Public façade |
| `DecisionDTOs` | Request / result types in `types.ts` |
| `DecisionQueries` | Deterministic Q&A |
| `DecisionScoring` | ROI + composite scoring |
| `DecisionProjection` | Executive briefing flatten |

## Recommendation shape

Every recommendation includes:

- executive summary
- supporting evidence
- financial impact
- operational impact
- mission impact
- risks
- dependencies
- confidence score

## Dependency injection

```ts
import { createIntelligenceService } from "@/lib/platform/intelligence";

const service = createIntelligenceService();
const decision = service.executiveDecision.service.evaluate({
  requestId: "dec-2",
  question: "Should hiring occur now or later?",
  scenarios: [createPresetScenario("hiring_timing")],
  graphInput: { executive: { enrollment: 100, staff: 40, revenue: 50000 } },
});
```

Override collaborators via `createExecutiveDecisionIntelligence({ simulator: custom, ... })`.

## Relationship to other packs

| Pack | Relationship |
|------|--------------|
| Sprint 012 `decision/` | Domain resolver for intelligence pipeline (unchanged) |
| Sprint 025 `executive-graph/` | Graph reasoning input consumed by decision engine |
| Founder / Org Health / Financial | Feed via `graphInput` / `GraphAnalysisResult` |

## Version

`EXECUTIVE_DECISION_INTELLIGENCE_VERSION = "0.1.0"`
