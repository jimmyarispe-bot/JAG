# Knowledge Intelligence

**Sprint:** 040  
**Package:** `src/lib/platform/intelligence/knowledge/`  
**Module id / OIOS domain:** `knowledge`

## Purpose

Continuously capture, organize, connect, retrieve, reason over, preserve, and evolve organizational institutional memory — without regenerating foundation knowledge stubs or sibling intelligence domains.

This is NOT document storage. This is institutional memory.

## Package layout

| File | Role |
|------|------|
| `types.ts` | Leaf DTOs, enums, request/result |
| `contracts.ts` | Leaf interfaces + DI bag |
| `models.ts` | Baseline derivation + `KnowledgeModels` |
| `capture-intelligence.ts` | Artifact catalog with full provenance |
| `provenance-intelligence.ts` | Provenance suite across all artifacts |
| `quality-intelligence.ts` | Quality engine + 9 sub-analyzers |
| `memory-intelligence.ts` | Organizational memory (14 kinds) |
| `evolution-intelligence.ts` | Continuous knowledge evolution |
| `traceability-intelligence.ts` | Decision traceability for recommendations |
| `graph-search-intelligence.ts` | Knowledge graph + semantic search |
| `reason-gap-intelligence.ts` | Reasoner, gaps, expertise map |
| `knowledge-registry.ts` | Upstream publisher registry |
| `knowledge-intelligence.ts` | Scores, health, dashboard, analyzers, brief |
| `knowledge-engine.ts` | Orchestrator |
| `service.ts` / `repository.ts` / `projection.ts` | Façade, store, queries |
| `foundation.ts` | Preserved foundation `IntelligenceKnowledgeService` stub |
| `index.ts` | Public API + `createKnowledgeIntelligence()` |

## Composition flow

1. Derive baseline from DNA / OIOS / graphInput organization-health + executive signals / customer / operations / human capital soft lights  
2. Catalog artifacts across all 13 knowledge types (each with full provenance)  
3. Assess provenance suite (trust, confidence, approval, validation)  
4. Build knowledge relationship graph (all 8 relation kinds)  
5. Index semantic search with duplicate detection  
6. Run Knowledge Quality Intelligence (validation, freshness, completeness, accuracy, consistency, conflict, redundancy, coverage, lifecycle)  
7. Capture organizational memory across 14 kinds  
8. Reason over connected knowledge, conflicts, and missing topics  
9. Analyze knowledge gaps (all 6 categories)  
10. Map expertise domains (all 6)  
11. Evolve knowledge (stale, conflict, updates, missing, docs, expertise, transitions)  
12. Assess risks / opportunities + compose decision-traceable recommendations  
13. Trace every recommendation to knowledge used / confidence / source / validation / decisions  
14. Score health / coverage / graph / search / gap / expertise / quality / provenance / memory / evolution / risk  
15. Generate executive brief, projection, persist history  

## Six-lens contract

Every recommendation answers:

1. `coverageCompleteness` — What do we know?  
2. `provenanceTrust` — How do we know it?  
3. `ownershipClarity` — Who owns it?  
4. `validationCurrency` — When was it validated?  
5. `dependencyReach` — Who depends on it?  
6. `decisionInfluence` — What decisions has it influenced?  

Every recommendation is also **decision-traceable** via `knowledgeUsed`, `knowledgeConfidence`, `knowledgeSource`, `lastValidationDate`, and `relatedOrganizationalDecisions`.

## Integrations

| Domain | Integration |
|--------|-------------|
| Organization DNA | Persona / structural richness soft signals |
| OIOS Core | Execution / health baseline |
| Organization Health (graph) | Overall / operations scores |
| Customer | Soft `CustomerResultLight` insight density |
| Operations | Soft `OperationsResultLight` process / SOP density |
| Human Capital | Soft `HumanCapitalResultLight` transfer / expertise signals |
| Future AI Agent Platform | Consumes catalog, graph, search, reasoner outputs |

## Distinct from

- Foundation `IntelligenceKnowledgeService` (cognitive stub in `foundation.ts`)  
- OIOS Organizational Knowledge Graph (structural twin)  
- Human Capital `KnowledgeTransfer` subdomain  
- JAG Knowledge System governance docs  

## Platform

| Surface | Value |
|---------|-------|
| Module id | `knowledge` |
| Context key | `knowledge` |
| Hard dependency | `customer` |
| OIOS status | active |
| Service attach | `createIntelligenceService().knowledge` |
