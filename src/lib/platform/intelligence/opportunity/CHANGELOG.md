# Changelog — Opportunity Intelligence

## 0.1.0 — Sprint 035 (2026-07-12)

### Added

- Opportunity Intelligence domain package under `src/lib/platform/intelligence/opportunity/`
- Core: `OpportunityIntelligenceService` / `OpportunityService`, `OpportunityIntelligenceEngine` / `OpportunityEngine`, `OpportunityRepository`, `OpportunityModels`, `OpportunityDashboard`, `OpportunityHealth`, `OpportunityExchange`, `OpportunityRegistry`
- 22 opportunity categories spanning revenue, funding, cost, growth, partnerships, M&A, technology, assets, licensing, innovation, and mission impact
- Analysis suite: OpportunityScoring, ROIAnalysis, ImpactAnalysis, RiskAnalysis, ConfidenceScoring, DependencyAnalysis, ResourceRequirements, TimeToValueAnalysis, StrategicAlignment
- Ranking lenses: Highest ROI, Quick Wins, Strategic Investments, Mission Critical, Long-Term Growth, Highest Confidence, Lowest Risk
- Opportunity Exchange common contract for every OIOS domain to publish into
- Outputs: Top Opportunities / Quick Wins / Strategic Investment / Mission Opportunity dashboards, Opportunity Pipeline, Heat Map, Opportunity Score, Executive Opportunity Brief
- Five-lens impact narratives (`organizationalHealth`, `financialSustainability`, `missionImpact`, `longTermValue`, `timeToValue`)
- Platform adapter module id: `opportunity` (depends on `funding`, context key `opportunity`)
- OIOS domain registry activation for `opportunity`
- DI via `createOpportunityIntelligence()` and `createIntelligenceService().opportunity`
- Integration surfaces for Organizational DNA, OIOS Core, Organization Health, Human Capital, Revenue Intelligence, Funding Intelligence, Executive Graph, Executive Decision, Predictive Intelligence, Board Governance, and Continuous Improvement Loop
