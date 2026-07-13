# Reputation Intelligence Architecture (Sprint 051)

## Position

- Domain: `reputation`
- Hard DAG dependency: `stakeholder`
- OIOS hard deps: `["organization-dna", "stakeholder"]`
- Soft reads only from stakeholder, customer, political, competitive, opportunity, executive-decision, predictive
- Optional soft read: `MarketResultLight` when market context is attached

## Marketing Intelligence note

There is **no standalone marketing domain**. Soft-read brand/engagement fields from
`CustomerResultLight` and/or `StakeholderResultLight`. Optionally soft-read
`MarketResultLight` for brand position. Do not invent a marketing package.

## Engines

1. Trend / Forecast / Scenario (standard)
2. ReputationAnalysisEngine — 12 analysis kinds
3. TrustEngine → TrustSuite
4. SentimentEngine → SentimentSuite
5. NarrativeAnalysisEngine → NarrativeAnalysisSuite
6. MediaIntelligenceEngine → MediaIntelligenceSuite
7. CrisisDetectionEngine → CrisisDetectionSuite
8. EarlyWarningEngine → EarlyWarningSuite
9. RecommendationEngine (ReputationRecommendationComposer)

## Leaf safety

Types and contracts import only leaf-safe upstream types. No circular imports into stakeholder package source.
