# Stakeholder Intelligence Architecture (Sprint 050)

## Position

- Domain: `stakeholder`
- Hard DAG dependency: `environmental`
- OIOS hard deps: `["organization-dna", "environmental"]`
- Soft reads only from customer, human-capital, political, competitive, environmental, opportunity, executive-decision, predictive

## Engines

1. Trend / Forecast / Scenario (standard)
2. StakeholderAnalysisEngine — 12 analysis kinds
3. StakeholderMappingEngine → StakeholderMappingSuite
4. InfluenceEngine → InfluenceSuite
5. RelationshipEngine → RelationshipSuite
6. SentimentEngine → SentimentSuite
7. EngagementEngine → EngagementSuite
8. ConflictDetectionEngine → ConflictDetectionSuite
9. EarlyWarningEngine → EarlyWarningSuite
10. RecommendationEngine (StakeholderRecommendationComposer)

## Leaf safety

Types and contracts import only leaf-safe upstream types. No circular imports into environmental package source.
