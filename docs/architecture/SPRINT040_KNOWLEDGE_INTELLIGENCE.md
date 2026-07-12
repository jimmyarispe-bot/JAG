# Sprint 040 — Knowledge Intelligence

**Branch:** `founder-os-beta`  
**Domain key:** `knowledge`  
**Package:** `src/lib/platform/intelligence/knowledge/`  
**Version:** `0.2.0`

## Vision

Create the world's most comprehensive Organizational Knowledge Intelligence platform — institutional memory that every intelligence domain contributes to, and that remains searchable, connected, and reusable forever.

## Objective

Every knowledge artifact answers:

1. What do we know?
2. How do we know it?
3. Who owns it?
4. When was it validated?
5. Who depends on it?
6. What decisions has it influenced?

## Delivered

- Core: `KnowledgeIntelligenceService`, `KnowledgeEngine`, `KnowledgeRepository`, `KnowledgeModels`, `KnowledgeDashboard`, `KnowledgeHealth`, `KnowledgeRegistry`, `KnowledgeGraph`, `KnowledgeSearch`, `KnowledgeReasoner`
- Artifact catalog (13 types) + sources (18) + relation kinds (8)
- Gap analysis (6 categories) + expertise map (6 domains)
- **Provenance** on every artifact (source, author, owner, dates, confidence/trust, version history, approval, related policies/decisions/goals/DNA)
- **Quality Intelligence**: `KnowledgeQualityEngine` + Validation / Freshness / Completeness / Accuracy / Consistency / ConflictDetection / RedundancyDetection / CoverageAnalysis / LifecycleManagement
- **Organizational Memory** across 14 kinds (board/executive decisions, policies, SOPs, playbooks, lessons, initiatives, projects, meetings, best practices, failures, successes, experiments, milestones)
- **Knowledge Evolution** (stale/conflict detection, updates, missing knowledge, documentation suggestions, expertise surfacing, leadership-transition preservation)
- **Decision Traceability** — every recommendation traces to knowledge used, confidence, source, last validation, related decisions
- Outputs: scores (incl. quality/provenance/memory/evolution), Executive Knowledge Brief, institutional memory dashboard, gap dashboard, expertise map, projection, risks, opportunities, recommendations
- OIOS domain activation for `knowledge`
- Platform module `knowledge` (depends on `customer`)
- DI via `createKnowledgeIntelligence()` and `createIntelligenceService().knowledge`
- Foundation `IntelligenceKnowledgeService` preserved under `foundation.ts`

## Pipeline position

```
organization-dna → oios-core → organization-health → financial → founder
  → executive → executive-graph → executive-decision → predictive
  → board-governance → human-capital → revenue → funding → opportunity
  → organizational-improvement → business-model → operations → customer → knowledge
```

## Non-negotiables honored

- Did not regenerate Sprint 021–039 packages
- Distinct from foundation knowledge stub, OIOS OKG, HC KnowledgeTransfer, and JKS governance
- Leaf modules remain leaf (`types` / `contracts` import-free of implementations)
- Soft-reads DNA / OIOS / org-health graph signals / Customer / Operations / Human Capital
- Hard DAG dependency on `customer` only
