# Wisdom Intelligence Architecture

## Placement

- Domain key: `wisdom`
- Package: `src/lib/platform/intelligence/wisdom/`
- Pipeline: terminal after `collective`
- Hard DAG: `["collective"]`
- OIOS hard deps: `["organization-dna", "collective"]`
- Soft reads: collective, institutional-memory, knowledge, decision, predictive, ethical, systems,
  resilience, opportunity, behavioral, cultural, stakeholder, ecosystem, market, competitive,
  economic, operations, humanCapital, environmental, political, reputation

## Package layout

Leaf-safe `types` / `contracts`, `models`, area factory + 17 area modules,
specialized engines (StrategicReasoningEngine, CrossDomainSynthesisEngine, TradeOffEngine,
UncertaintyEngine, ExecutiveJudgmentEngine, ConfidenceEngine, EarlyWarningEngine),
standard engines (WisdomForecastEngine, WisdomTrendEngine, WisdomScenarioEngine, WisdomAnalysisEngine),
composers, projection, repository, registry, service, `createWisdomIntelligence`.

## Specialized suites on WisdomResult

strategicReasoningSuite, crossDomainSynthesisSuite, tradeOffSuite, uncertaintySuite,
executiveJudgmentSuite, confidenceSuite, earlyWarningSuite, plus trend/forecast/scenario/analysis suites.

## Executive Judgment Framework

whatLeadershipShouldDo, why, whyNow, whyNotAlternatives, risksRemaining, assumptions, evidence, expectedOutcome
on ExecutiveJudgmentSuite and ExecutiveWisdomBrief.

## Closed learning

Final terminal synthesis layer that unifies judgment, trade-offs, uncertainty, and long-term impact.

Destinations: collective, institutional-memory, knowledge, executive-decision, opportunity, predictive, ethical.

## Health formula

avg(areas)*0.5 + strategicValue*0.1 + longTermImpact*0.1 + wisdomScore*0.08 +
forecast*0.08 + scenario*0.07 + earlyWarning*0.04 + executiveJudgmentEngine*0.03
