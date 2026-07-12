# Document Intelligence

**Sprint:** 041  
**Package:** `src/lib/platform/intelligence/document/`  
**Module id / OIOS domain:** `document`

## Purpose

Continuously parse, classify, summarize, connect, monitor, and reason over organizational documents so the platform can expose document risk, compliance status, expiration pressure, and knowledge contribution opportunities.

This is NOT Knowledge Intelligence. This is the document intelligence layer that feeds validated drafts and evidence into knowledge.

## Package Layout

| File | Role |
|------|------|
| `types.ts` | Leaf DTOs, constants, request/result |
| `contracts.ts` | Leaf interfaces + DI bag |
| `models.ts` | Baseline derivation + score/confidence/lens helpers |
| `document-parser.ts` | OCR-ready parse readiness |
| `document-classifier.ts` | Document type classification and catalog |
| `metadata-intelligence.ts` | Ownership, date, and metadata extraction |
| `entity-relationship-intelligence.ts` | Entity and document relationship extraction |
| `version-duplicate-intelligence.ts` | Version comparison and duplicate detection |
| `summarization-clause-intelligence.ts` | Summaries and clause extraction |
| `risk-compliance-intelligence.ts` | Risk categories and compliance tagging |
| `expiration-intelligence.ts` | Expiration monitoring |
| `knowledge-contribution.ts` | Document-derived knowledge drafts |
| `document-reasoner.ts` | Reasoning over documents, risks, and missing topics |
| `document-registry.ts` | Upstream publisher registry |
| `document-intelligence.ts` | Scores, health, dashboards, analyzers, brief |
| `document-engine.ts` | Orchestrator |
| `service.ts` / `repository.ts` / `projection.ts` | Facade, store, queries |
| `index.ts` | Public API + `createDocumentIntelligence()` |

## Composition Flow

1. Derive baseline from DNA / OIOS / graph / decision / knowledge / operations / customer / human capital / revenue / funding / board-governance soft reads
2. Parse the document estate for OCR readiness and parse confidence
3. Classify documents across all `DOCUMENT_TYPES`
4. Build a catalog with ownership, lifecycle status, expiration, confidence, compliance tags, and seven document lenses
5. Extract metadata, entities, and relationships
6. Compare versions and detect duplicates
7. Summarize documents and extract clauses
8. Identify risks across all `DOCUMENT_RISK_CATEGORIES`
9. Tag compliance across all `DOCUMENT_COMPLIANCE_TAGS`
10. Monitor expiration and next-expiration pressure
11. Generate document-derived knowledge drafts in `knowledgeContribution.artifacts`
12. Reason over connected documents, risks, and missing topics
13. Analyze risks / opportunities and compose recommendations
14. Score health, knowledge, catalog, classification, metadata, entities, relationships, versions, duplicates, summaries, clauses, risks, compliance, expiration, and contribution
15. Generate dashboards, executive brief, projection, and history

## Seven-Lens Contract

Every recommendation answers:

1. `whatIsIt` - What is it?
2. `whyItMatters` - Why does it matter?
3. `whoOwnsIt` - Who owns it?
4. `whenItExpires` - When does it expire?
5. `knowledgeCreated` - What knowledge does it create?
6. `risksContained` - What risks does it contain?
7. `decisionsDependent` - Which decisions depend on it?

## Integrations

| Domain | Integration |
|--------|-------------|
| Organization DNA | Persona / structure soft signals |
| OIOS Core | Execution and health baseline |
| Executive Graph | Graph and risk/dependency context |
| Executive Decision | Decision dependency density |
| Knowledge | Hard predecessor and knowledge baseline |
| Operations | Process document density |
| Customer | Communication coverage signals |
| Human Capital | Policy, training, and transfer signals |
| Revenue | Contract and billing document signals |
| Funding | Grant readiness and award compliance signals |
| Board Governance | Policy governance, minutes, and decision traceability signals |

## Platform

| Surface | Value |
|---------|-------|
| Module id | `document` |
| Context key | `document` |
| Hard dependency | `knowledge` |
| Soft reads | DNA, OIOS, graph, decision, knowledge, operations, customer, human-capital, revenue, funding, board-governance |
| OIOS status | active |
| Service attach | `createIntelligenceService().document` |
