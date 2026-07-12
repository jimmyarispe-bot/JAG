# Sprint 041 - Document Intelligence

**Branch:** `founder-os-beta`  
**Domain key:** `document`  
**Package:** `src/lib/platform/intelligence/document/`  
**Version:** `0.1.0`

## Vision

Create the terminal platform module that turns organizational documents into classified, traceable, risk-aware intelligence and validated knowledge contribution drafts.

## Objective

Every document artifact answers:

1. What is it?
2. Why does it matter?
3. Who owns it?
4. When does it expire?
5. What knowledge does it create?
6. What risks does it contain?
7. Which decisions depend on it?

## Delivered

- Core: `DocumentIntelligenceService`, `DocumentEngine`, `DocumentRepository`, `DocumentModels`, `DocumentDashboard`, `DocumentHealth`, `DocumentRegistry`, `DocumentParser`, `DocumentClassifier`, `DocumentReasoner`
- Document catalog across 21 document types
- OCR-ready parsing, classification, metadata extraction, entity extraction, and relationship extraction
- Version comparison and duplicate detection
- Summarization and clause extraction
- Risk intelligence across 8 categories and compliance tagging across 8 tag families
- Expiration monitoring for contracts, licenses, permits, grants, compliance documents, and employment agreements
- Document-to-knowledge contribution drafts through `knowledgeContribution.artifacts`
- Outputs: document health, catalog, classification, metadata, entity, relationship, version, duplicate, summary, clause, risk, compliance, expiration, and contribution scores
- Dashboards: executive document dashboard plus contract, policy, grant, and compliance dashboards
- DI via `createDocumentIntelligence()` and `createIntelligenceService().document`
- Platform module `document` registered after `knowledge`

## Pipeline Position

```
organization-dna -> oios-core -> organization-health -> financial -> founder
  -> executive -> executive-graph -> executive-decision -> predictive
  -> board-governance -> human-capital -> revenue -> funding -> opportunity
  -> organizational-improvement -> business-model -> operations -> customer
  -> knowledge -> document
```

## Dependency Contract

- Hard DAG dependency: `knowledge`
- Soft reads: DNA, OIOS, graph, decision, knowledge, operations, customer, human-capital, revenue, funding, board-governance

## Non-Negotiables Honored

- Did not regenerate Sprint 021-040 packages
- Document Intelligence remains distinct from Knowledge Intelligence and contributes draft knowledge rather than replacing institutional memory
- Leaf modules remain leaf (`types` / `contracts` import-free of implementations)
- Platform module is terminal after `knowledge`
- OIOS domain activation for `document`
