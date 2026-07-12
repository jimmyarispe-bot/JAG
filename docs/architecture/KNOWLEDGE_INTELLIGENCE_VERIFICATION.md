# Knowledge Intelligence — Verification Checklist

## Static

- [x] Package exists at `src/lib/platform/intelligence/knowledge/`
- [x] `types.ts` / `contracts.ts` remain leaf (no implementation imports)
- [x] `KNOWLEDGE_INTELLIGENCE_VERSION = "0.2.0"`
- [x] Constants: 13 knowledge types, 18 sources, 8 relation kinds, 6 gap categories, 6 expertise domains
- [x] Provenance fields on every artifact (15 required keys)
- [x] Quality dimensions: 9 (`KNOWLEDGE_QUALITY_DIMENSIONS`)
- [x] Organizational memory kinds: 14 (`ORGANIZATIONAL_MEMORY_KINDS`)
- [x] Evolution actions: 7 (`KNOWLEDGE_EVOLUTION_ACTIONS`)
- [x] Decision traceability on every recommendation
- [x] `knowledge` in `OIOS_INTELLIGENCE_DOMAINS` and active in `defaultRegisteredDomains()`
- [x] `knowledge` in `INTELLIGENCE_MODULE_IDS`
- [x] Module adapter registered after `customer` in `createDefaultIntelligenceModules()`
- [x] `createIntelligenceService()` exposes `.knowledge`
- [x] Public exports present on `@/lib/platform/intelligence`
- [x] Foundation `IntelligenceKnowledgeService` preserved in `foundation.ts`
- [x] README + CHANGELOG + sprint/architecture docs present
- [x] Does not regenerate Sprint 021–039 packages

## Behavioral

- [x] `service.build()` returns health/coverage/graph/search/gap/expertise/quality/provenance/memory/evolution/risk scores
- [x] Catalog covers all `KNOWLEDGE_TYPES` with full provenance
- [x] Graph uses `KNOWLEDGE_RELATION_KINDS`
- [x] Gaps cover all `KNOWLEDGE_GAP_CATEGORIES`
- [x] Expertise map covers all `EXPERTISE_DOMAINS`
- [x] Quality suite covers all `KNOWLEDGE_QUALITY_DIMENSIONS`
- [x] Organizational memory covers all `ORGANIZATIONAL_MEMORY_KINDS`
- [x] Evolution covers all `KNOWLEDGE_EVOLUTION_ACTIONS`
- [x] Decision traceability traces every recommendation
- [x] Result includes dashboard, brief, projection, reasoning
- [x] Every recommendation includes all six `KnowledgeLensImpact` keys + trace fields
- [x] Query focuses include provenance / quality / memory / evolution / traceability
- [x] Query + repository persistence work
- [x] Soft upstream light types: `CustomerResultLight`, `OperationsResultLight`, `HumanCapitalResultLight`
- [x] `createKnowledgeIntelligence()` returns `KnowledgeStack`
- [x] Platform pipeline order ends with `knowledge`
- [x] All module results `ok: true`

## Commands

```bash
npx tsc --noEmit
npx vitest run tests/unit/intelligence/
```

## Expected pipeline order

```
organization-dna → oios-core → organization-health → financial → founder
→ executive → executive-graph → executive-decision → predictive
→ board-governance → human-capital → revenue → funding → opportunity
→ organizational-improvement → business-model → operations → customer → knowledge
```
