# Institutional Memory Intelligence (Sprint 058)

**Version:** 0.1.0 | **Domain key:** `institutional-memory` | **ID prefix:** `imm-`

Terminal institutional memory layer after Ecosystem that soft-reads Knowledge (Sprint 040) and upstream domains so JAG can synthesize, validate, and redistribute organizational learning.

## Critical freeze note

Sprint 040 already shipped Knowledge Intelligence at `src/lib/platform/intelligence/knowledge/` (domain key `knowledge`, mid-pipeline after customer). That package remains **frozen**. Sprint 058 fulfills the Knowledge Intelligence evolution brief (institutional memory layer) as this **new** terminal domain. Soft-read existing `knowledge` via `KnowledgeResultLight` only. Do not regenerate or modify `knowledge/`.

## Areas (17)

organizational_memory, knowledge_graph, knowledge_mapping, expertise_intelligence, institutional_memory, lessons_learned, decision_history, policy_knowledge, process_knowledge, relationship_knowledge, semantic_search, knowledge_validation, knowledge_evolution, knowledge_gap_detection, knowledge_transfer, knowledge_quality, knowledge_synthesis

## Entry point

```ts
import { createInstitutionalMemoryIntelligence } from "@/lib/platform/intelligence/institutional-memory";

const { service } = createInstitutionalMemoryIntelligence({ wireOrganizationDna: false, wireOios: false });
const result = service.build({ requestId: "imm-1", scope: { organizationId: "org-1", schoolId: "school-1" } });
```

## Lens (8 fields)

knowledgeConfidence · evidenceStrength · institutionalMemoryCoverage · knowledgeFreshness · expertiseAvailability · knowledgeGaps · knowledgeQuality · longTermLearningValue

## Hard DAG

`["ecosystem"]` - terminal platform module after Ecosystem Intelligence.

## Layer

Terminal institutional memory layer after Ecosystem External network - how the organization remembers, validates, and redistributes learning across domains.
