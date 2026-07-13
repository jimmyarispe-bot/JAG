# Institutional Memory Intelligence Architecture

## Placement

- Domain key: `institutional-memory`
- Package: `src/lib/platform/intelligence/institutional-memory/`
- Pipeline: terminal after `ecosystem`
- Hard DAG: `["ecosystem"]`
- OIOS hard deps: `["organization-dna", "ecosystem"]`
- Soft reads: knowledge (Sprint 040 frozen), ecosystem, resilience, systems, stakeholder, cultural, ethical, opportunity, executive-decision, predictive, plus market, competitive, behavioral, operations, customer, human-capital

## Freeze boundary

Sprint 040 `knowledge/` remains frozen mid-pipeline. This package is the Knowledge Intelligence evolution brief implemented as a separate terminal domain. Soft-read only via `KnowledgeResultLight`. No circular imports. Leaf types/contracts.

## Package layout

Leaf-safe `types` / `contracts`, `models`, area factory + 17 area modules, specialized engines (KnowledgeGraph, SemanticSearch, Expertise, KnowledgeValidation, KnowledgeEvolution, EarlyWarning), standard forecast/trend/scenario/analysis engines (InstitutionalMemoryAnalysisEngine / KnowledgeAnalysisEngine), composers, projection, repository, registry, service, `createInstitutionalMemoryIntelligence`.

## Suites on InstitutionalMemoryResult

knowledgeGraphSuite, semanticSearchSuite, expertiseSuite, knowledgeValidationSuite, knowledgeEvolutionSuite, earlyWarningSuite, plus trend/forecast/scenario/analysis suites.

## Closed learning

Primary institutional memory destination that redistributes validated insights via soft contribution records.

Destinations: knowledge, ecosystem, opportunity, executive-decision, predictive, organizational-improvement, stakeholder.
