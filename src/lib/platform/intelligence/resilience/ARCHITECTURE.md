# Resilience Intelligence Architecture

## Placement

- Domain key: `resilience`
- Pipeline: terminal after `systems`
- Hard DAG: `["systems"]`
- OIOS hard deps: `["organization-dna", "systems"]`
- Soft reads: systems, operations, legal-compliance-risk, economic, executive-decision, predictive
- Technology/Security: no standalone technology or security intelligence packages exist. Soft-read `OperationsResultLight` (tech delivery / operational posture) and `LegalComplianceRiskResultLight` (cyber and security risk) as proxies. Document soft-reads only; do not invent technology/security packages.

## Package layout

Leaf-safe `types` / `contracts`, `models`, area factory + 17 area modules, specialized engines (stress-test, recovery, continuity, adaptive-capacity, early-warning), standard forecast/trend/scenario/analysis engines, composers, projection, repository, registry, service, `createResilienceIntelligence`.

## Suites on ResilienceResult

stressTestSuite, recoverySuite, continuitySuite, adaptiveCapacitySuite, earlyWarningSuite, plus trend/forecast/scenario/analysis suites.

## Closed learning

Destinations: systems, operations, legal-compliance-risk, economic, executive-decision, predictive, opportunity.
