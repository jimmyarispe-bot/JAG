# Organizational Improvement Engine — Architecture

## Package layout

```
src/lib/platform/intelligence/organizational-improvement/
  types.ts                    # Leaf DTOs / enums / Request+Result
  contracts.ts                # Leaf interfaces + ImprovementDependencies
  models.ts                   # Baseline derivation + helpers
  sources.ts                  # Ten domain source analyzers
  analysis.ts                 # Priority / impact / capacity / confidence suite
  planner.ts                  # Quick wins through annual roadmap
  improvement-registry.ts     # Source domain publisher registry
  improvement-intelligence.ts # Scores, health, dashboards, loop, briefs
  improvement-engine.ts       # 9-step orchestrator
  service.ts                  # Thin façade
  repository.ts               # In-memory store
  projection.ts               # Projection + focused queries
  index.ts                    # createOrganizationalImprovementIntelligence()
  README.md / CHANGELOG.md
```

## Composition flow

1. Derive baseline from DNA, OIOS, graph, prediction, governance, HC, revenue, funding, opportunity
2. Discover improvements from ten source domains
3. Flatten + dedupe (+ published improvements / opportunity exchange)
4. Analyze (priority, impact, mission, financial, risk, TTV, resources, capacity, dependencies, confidence)
5. Plan (quick wins, strategic, transformation, weekly → annual)
6. Run continuous improvement loop
7. Compose scores + health
8. Dashboards + heat map + today's priorities
9. Daily brief, executive brief, projection, history → persist

## Ten-lens contract

```ts
interface ImprovementLensImpact {
  whyNow: string;
  expectedRoi: string;
  missionImpact: string;
  financialImpact: string;
  peopleImpact: string;
  implementationEffort: string;
  risk: string;
  confidence: string;
  dependencies: string;
  timeToValue: string;
}
```

## Integrations

| Upstream | Consumption |
|----------|-------------|
| Opportunity | Exchange records + opportunity/health scores |
| Organization Health / Graph / Decision / Predictive | Soft context signals via request |
| Human Capital / Revenue / Funding / Board Governance | Light projections |
| DNA + OIOS | Baseline + alignment |
| Future domains | Reserved source slot |

## Platform wiring

| Surface | Value |
|---------|-------|
| Module id | `organizational-improvement` |
| Context key | `organizational-improvement` |
| Dependencies | `["opportunity"]` |
| OIOS domain | `organizational-improvement` (active) |
| Service attach | `createIntelligenceService().organizationalImprovement` |
