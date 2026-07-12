# Knowledge Intelligence (Sprint 040)

Continuously capture, organize, connect, retrieve, reason over, preserve, and evolve organizational institutional memory.

> This is NOT document storage — it is institutional memory.
>
> Distinct from foundation `IntelligenceKnowledgeService`, OIOS Organizational Knowledge Graph, Human Capital KnowledgeTransfer, and JAG Knowledge System governance docs.

## Quick start

```ts
import { createKnowledgeIntelligence } from "@/lib/platform/intelligence/knowledge";

const { service } = createKnowledgeIntelligence({
  wireOrganizationDna: false,
  wireOios: false,
});

const result = service.build({
  requestId: "know-1",
  scope: { organizationId: "org-1", schoolId: null },
});

console.log(result.healthScore, result.brief.headline);
console.log(result.provenance.overallTrustScore, result.quality.overallScore);
console.log(result.decisionTraceability.narrative);
```

## Capabilities

| Area | Components |
|------|------------|
| Core | `KnowledgeIntelligenceService`, `KnowledgeEngine`, `KnowledgeRepository`, `KnowledgeModels`, `KnowledgeDashboard`, `KnowledgeHealth`, `KnowledgeRegistry`, `KnowledgeGraph`, `KnowledgeSearch`, `KnowledgeReasoner` |
| Provenance | `KnowledgeProvenanceEngine` — full provenance on every artifact |
| Quality | `KnowledgeQualityEngine` + Validation / Freshness / Completeness / Accuracy / Consistency / ConflictDetection / RedundancyDetection / CoverageAnalysis / LifecycleManagement |
| Memory | `OrganizationalMemoryEngine` — 14 institutional memory kinds |
| Evolution | `KnowledgeEvolutionEngine` — stale, conflict, updates, missing, docs, expertise, transitions |
| Traceability | `DecisionTraceabilityEngine` — recommendations → knowledge → decisions |
| Types | 13 `KNOWLEDGE_TYPES` |
| Sources | 18 `KNOWLEDGE_SOURCES` |
| Relations | 8 `KNOWLEDGE_RELATION_KINDS` |
| Gaps | 6 `KNOWLEDGE_GAP_CATEGORIES` |
| Expertise | 6 `EXPERTISE_DOMAINS` |
| Memory kinds | 14 `ORGANIZATIONAL_MEMORY_KINDS` |
| Quality dims | 9 `KNOWLEDGE_QUALITY_DIMENSIONS` |
| Evolution | 7 `KNOWLEDGE_EVOLUTION_ACTIONS` |

## Outputs

- Knowledge Health / Coverage / Graph / Search / Gap / Expertise / Quality / Provenance / Memory / Evolution / Risk scores
- Artifact catalog with full provenance + knowledge graph + semantic search
- Quality suite, organizational memory, evolution actions, decision traceability
- Reasoning (conflicts, missing topics) + gap dashboard + expertise map
- Executive Knowledge Brief, institutional memory dashboard, projection
- Risks / opportunities / recommendations (six-lens + decision-traceable)

Every recommendation answers the six `KnowledgeLensImpact` keys and is traceable to the knowledge used, confidence, source, last validation date, and related organizational decisions.

## Architecture position

```
… → business-model → operations → customer → knowledge
```

## DI / platform

| Surface | Value |
|---------|-------|
| DI entry | `createKnowledgeIntelligence()` |
| Service attach | `createIntelligenceService().knowledge` |
| Stack | `KnowledgeStack { service, engine, organizationDna, oios }` |
| Platform module id | `knowledge` |
| Context key | `knowledge` |
| OIOS domain | `knowledge` (active) |
| Hard dependency | `customer` |
| Soft upstream | DNA, OIOS, org-health graph signals, Customer, Operations, Human Capital |
| Version | `0.2.0` |

## Docs

- Architecture: `docs/architecture/KNOWLEDGE_INTELLIGENCE.md`
- Sprint summary: `docs/architecture/SPRINT040_KNOWLEDGE_INTELLIGENCE.md`
- Verification: `docs/architecture/KNOWLEDGE_INTELLIGENCE_VERIFICATION.md`
