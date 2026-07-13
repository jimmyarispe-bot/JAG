# Political Intelligence Architecture (Sprint 048)

## Position

- Domain: `political`
- Hard DAG dependency: `competitive`
- OIOS hard deps: `["organization-dna", "competitive"]`
- Soft reads only from market, economic, competitive, legal-compliance-risk, opportunity, executive-decision, predictive, funding

## Engines

1. Trend / Forecast / Scenario (standard)
2. PoliticalAnalysisEngine (PolicyAnalysisEngine alias) — 12 analysis kinds
3. LegislativeTrackingEngine → LegislativeTrackingSuite
4. RegulatoryImpactEngine → RegulatoryImpactSuite
5. PoliticalRiskEngine → PoliticalRiskSuite (geopolitical + elections + sentiment)
6. GovernmentFundingEngine → GovernmentFundingSuite
7. EarlyWarningEngine → EarlyWarningSuite
8. RecommendationEngine (PoliticalRecommendationComposer)

## Leaf safety

Types and contracts import only leaf-safe upstream types. No circular imports into competitive package source.
