# Changelog — Knowledge Intelligence

## 0.2.0 — Provenance, Quality, Memory, Evolution, Traceability

### Added

- **Knowledge Provenance** — every artifact retains source, source type, original author, current owner, creation / last modified / last validation dates, confidence & trust scores, version history, approval status, related policies / decisions / goals / organizational DNA (`KnowledgeProvenanceRecord` + `KnowledgeProvenanceEngine`)
- **Knowledge Quality Intelligence** — `KnowledgeQualityEngine` composing `KnowledgeValidation`, `KnowledgeFreshness`, `KnowledgeCompleteness`, `KnowledgeAccuracy`, `KnowledgeConsistency`, `KnowledgeConflictDetection`, `KnowledgeRedundancyDetection`, `KnowledgeCoverageAnalysis`, `KnowledgeLifecycleManagement`
- **Organizational Memory** — capture across 14 kinds (board/executive decisions, policies, SOPs, playbooks, lessons learned, strategic initiatives, projects, meeting summaries, best practices, failures, successes, experiments, historical milestones)
- **Knowledge Evolution** — continuous stale/conflict detection, update recommendations, missing knowledge identification, documentation suggestions, expertise surfacing, leadership-transition preservation
- **Decision Traceability** — every recommendation traces to knowledge used, confidence, source, last validation date, and related organizational decisions
- New scores: `qualityScore`, `provenanceScore`, `memoryScore`, `evolutionScore`
- Query focuses: `provenance`, `quality`, `memory`, `evolution`, `traceability`

### Changed

- `KNOWLEDGE_INTELLIGENCE_VERSION` → `0.2.0`
- `KnowledgeArtifactRecord` now includes full `provenance`
- `KnowledgeRecommendationRecord` includes decision-trace fields
- Pipeline extended after catalog with provenance → quality → memory → evolution → traceability

## 0.1.0 — Sprint 040

### Added

- Knowledge Intelligence domain package (`knowledge`)
- Core: `KnowledgeIntelligenceService`, `KnowledgeIntelligenceEngine`, `KnowledgeRepository`, `KnowledgeModels`, `KnowledgeDashboard`, `KnowledgeHealth`, `KnowledgeRegistry`, `KnowledgeGraphEngine`, `KnowledgeSearchEngine`, `KnowledgeReasoner`
- Artifact catalog across 13 knowledge types and 18 sources
- Knowledge relationship graph across 8 relation kinds
- Semantic search with duplicate detection
- Reasoning over connected knowledge, conflicts, and missing topics
- Knowledge gap analysis across 6 gap categories
- Expertise map across 6 domains
- Outputs: health/coverage/graph/search/gap/expertise/risk scores, executive brief, institutional memory dashboard, projection, risks, opportunities, recommendations
- Six-lens recommendation contract (`KnowledgeLensImpact`)
- DI via `createKnowledgeIntelligence()` returning `KnowledgeStack`
- Soft-reads DNA / OIOS / organization-health graph signals / customer / operations / human capital
- Preserved foundation `IntelligenceKnowledgeService` stub under `foundation.ts`
