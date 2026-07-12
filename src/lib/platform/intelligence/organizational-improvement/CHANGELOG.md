# Changelog — Organizational Improvement Engine

## 0.1.0 — Sprint 036 (2026-07-12)

### Added

- Organizational Improvement Engine domain package under `src/lib/platform/intelligence/organizational-improvement/`
- Core: `ImprovementIntelligenceService` / `ImprovementService`, `OrganizationalImprovementEngine` / `ImprovementEngine`, `ImprovementRepository`, `ImprovementModels`, `ImprovementDashboard`, `ImprovementHealth`, `ImprovementPlanner`, `ImprovementRegistry`
- Ten improvement sources spanning Organization Health, Executive Graph, Executive Decision, Predictive, Human Capital, Revenue, Funding, Opportunity, Board Governance, and Future Domains
- Analysis suite: PriorityScoring, ImpactScoring, MissionAlignment, FinancialImpact, RiskReduction, TimeToValue, ResourceRequirements, OrganizationalCapacity, DependencyResolution, ImprovementConfidence
- Planning suite: QuickWins, StrategicInitiatives, LongTermTransformation, WeeklyPlan, MonthlyPlan, QuarterlyPlan, AnnualRoadmap
- Continuous Improvement Loop (`observe` → `repeat`)
- Outputs: Organizational Improvement Score, Today's Executive Priorities, Weekly/Quarterly plans, Mission/Financial/People dashboards, Improvement Heat Map, Daily Executive Brief, Executive Improvement Brief
- Ten-lens recommendation contract (`whyNow`, `expectedRoi`, `missionImpact`, `financialImpact`, `peopleImpact`, `implementationEffort`, `risk`, `confidence`, `dependencies`, `timeToValue`)
- Platform adapter module id: `organizational-improvement` (depends on `opportunity`, context key `organizational-improvement`)
- OIOS domain registry activation for `organizational-improvement`
- DI via `createOrganizationalImprovementIntelligence()` and `createIntelligenceService().organizationalImprovement`
- Integration surfaces consuming Opportunity Exchange contracts and every active OIOS domain signal
