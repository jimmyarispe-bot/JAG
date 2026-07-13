# Environmental Intelligence Architecture (Sprint 049)

## Position

- Domain: `environmental`
- Hard DAG dependency: `political`
- OIOS hard deps: `["organization-dna", "political"]`
- Soft reads only from political, economic, legal-compliance-risk, operations, opportunity, executive-decision, predictive, market

## Engines

1. Trend / Forecast / Scenario (standard)
2. EnvironmentalAnalysisEngine — 12 analysis kinds
3. ClimateRiskEngine → ClimateRiskSuite
4. DisasterImpactEngine → DisasterImpactSuite
5. SustainabilityEngine → SustainabilitySuite
6. InfrastructureResilienceEngine → InfrastructureResilienceSuite
7. EarlyWarningEngine → EarlyWarningSuite
8. RecommendationEngine (EnvironmentalRecommendationComposer)

## Leaf safety

Types and contracts import only leaf-safe upstream types. No circular imports into political package source.
