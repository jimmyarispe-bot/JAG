# Collective Intelligence Architecture

## Placement

- Domain key: `collective`
- Package: `src/lib/platform/intelligence/collective/`
- Pipeline: collaborative synthesis after `institutional-memory`
- Hard DAG: `["institutional-memory"]`
- Soft reads: institutional-memory, knowledge, decision, predictive, behavioral, cultural, stakeholder, systems,
  opportunity, ecosystem, resilience, ethical, market, competitive, humanCapital, operations

## Package layout

Leaf-safe `types` / `contracts`, `models`, area factory + 17 area modules,
specialized engines (ConsensusEngine, DistributedExpertiseEngine, CrossDomainSynthesisEngine,
CollaborationEngine, ConflictResolutionEngine, EarlyWarningEngine),
standard engines (CollectiveForecastEngine, CollectiveTrendEngine, CollectiveScenarioEngine, CollectiveAnalysisEngine),
composers, projection, repository, registry, service, `createCollectiveIntelligence`.

## Specialized suites on CollectiveResult

consensusSuite, distributedExpertiseSuite, crossDomainSynthesisSuite, collaborationSuite,
conflictResolutionSuite, earlyWarningSuite, plus trend/forecast/scenario/analysis suites.

## Score fields with Engine suffix

- consensusEngineScore (area has consensusAnalysisScore)
- distributedExpertiseEngineScore (area has distributedExpertiseScore)
- crossDomainSynthesisScore
- collaborationEngineScore (area has collaborativeIntelligenceScore)
- conflictResolutionEngineScore (area has conflictResolutionScore)

## Closed learning

Collaborative synthesis layer that aggregates multi-domain recommendations and redistributes synthesized learning.

Destinations: institutional-memory, knowledge, executive-decision, opportunity, predictive, stakeholder, organizational-improvement.

## Health formula

avg(areas)*0.5 + consensusStrength*0.1 + collaborationQuality*0.1 + collectiveConfidence*0.08 +
forecast*0.08 + scenario*0.07 + earlyWarning*0.04 + consensusEngine*0.03
