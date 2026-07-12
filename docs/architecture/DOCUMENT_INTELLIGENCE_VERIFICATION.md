# Document Intelligence - Verification Checklist

## Static

- [x] Package exists at `src/lib/platform/intelligence/document/`
- [x] `types.ts` / `contracts.ts` remain leaf (no implementation imports)
- [x] `DOCUMENT_INTELLIGENCE_VERSION = "0.1.0"`
- [x] Constants: 21 document types, 13 capabilities, 8 relation kinds, 8 risk categories, 8 compliance tags
- [x] Seven document lenses on document records, risks, opportunities, recommendations, health, and brief
- [x] `document` in `OIOS_INTELLIGENCE_DOMAINS` and active in `defaultRegisteredDomains()`
- [x] `document` in `INTELLIGENCE_MODULE_IDS`
- [x] Module adapter registered after `knowledge` in `createDefaultIntelligenceModules()`
- [x] `createIntelligenceService()` exposes `.document`
- [x] Public exports present on `@/lib/platform/intelligence`
- [x] Sprint / architecture docs present
- [x] Does not regenerate Sprint 021-040 packages

## Behavioral

- [x] `service.build()` returns health/knowledge/catalog/classification/metadata/entity/relationship/version/duplicate/summary/clause/risk/compliance/expiration/contribution scores
- [x] Catalog covers all `DOCUMENT_TYPES`
- [x] Relationships use `DOCUMENT_RELATION_KINDS`
- [x] Risks cover all `DOCUMENT_RISK_CATEGORIES`
- [x] Compliance covers all `DOCUMENT_COMPLIANCE_TAGS`
- [x] Result includes dashboard, specialized dashboards, brief, projection, and reasoning
- [x] Every recommendation includes all seven `DocumentLensImpact` keys
- [x] Knowledge contribution writes drafts to `knowledgeContribution.artifacts`
- [x] Expiration monitoring returns score, next expiration, expiring soon, and expired collections
- [x] Query focuses include catalog / parse / classification / metadata / entities / relationships / risk / compliance / expiration / knowledge / reasoning
- [x] Query + repository persistence work
- [x] Soft upstream light types: knowledge, operations, customer, human-capital, revenue, funding, board-governance, decision
- [x] `createDocumentIntelligence()` returns `DocumentStack`
- [x] Platform pipeline order ends with `knowledge -> document`
- [x] All module results `ok: true`

## Commands

```bash
npx tsc --noEmit
npx vitest run tests/unit/intelligence/
```

## Expected Pipeline Order

```
organization-dna -> oios-core -> organization-health -> financial -> founder
-> executive -> executive-graph -> executive-decision -> predictive
-> board-governance -> human-capital -> revenue -> funding -> opportunity
-> organizational-improvement -> business-model -> operations -> customer
-> knowledge -> document
```
