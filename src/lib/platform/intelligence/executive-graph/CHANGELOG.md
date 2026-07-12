# Changelog — Executive Graph Analyzer

## 0.1.0 — Sprint 025 (2026-07-12)

### Added

- Complete Executive Graph Analyzer package under `intelligence/executive-graph`
- `GraphBuilder`, `GraphRepository`, `Graph` / `GraphNode` / `GraphEdge` model
- `GraphAnalyzer` with root-cause, dependency, cascade, and risk propagation
- `ExecutiveReasoner`, `OpportunityEngine`, `ConstraintEngine`
- `CriticalityScore`, `ExecutivePriority`, `ConfidenceScore`
- `ExecutiveQueries`, `GraphSearch`, `DashboardProjection`
- DI factory `createExecutiveGraphAnalyzer()`
- Wiring through `createIntelligenceService().executiveGraphAnalyzer`
- Unit tests, architecture docs, graph model docs, reasoning docs

### Fixed (platform prerequisite)

- Restored JAG Intelligence foundation types in `intelligence/types.ts`
  (accidentally overwritten in Sprint 022 by Organization Health shapes)
- Moved Organization Health aggregate types to `organization-health/types.ts`
- Aligned Founder `generateFounderBrief()` with `FounderBrief` contract
