# Changelog — Executive Decision Intelligence

## 0.1.0 — Sprint 026 (2026-07-12)

### Added

- Complete Executive Decision Intelligence package under `intelligence/executive-decision`
- `DecisionEngine`, `ScenarioSimulator`, `RecommendationEngine`, `StrategyEngine`
- `TradeoffAnalyzer`, `ImpactForecast`, `DecisionConfidence`, `DecisionHistory`
- `ScenarioRepository`, `DecisionModels`, `ExecutiveDecisionService`
- `DecisionDTOs` / types, `DecisionQueries`, `DecisionScoring`, `DecisionProjection`
- Preset what-if scenarios: enrollment drop, payroll increase, campus expansion, hiring timing, strategic initiative ROI
- DI factory `createExecutiveDecisionIntelligence()`
- Wiring through `createIntelligenceService().executiveDecision`
- Unit tests, architecture docs, verification checklist

### Notes

- Composes upward from Sprint 025 Executive Graph Analyzer
- Does not replace Sprint 012 Decision Intelligence domain resolver
