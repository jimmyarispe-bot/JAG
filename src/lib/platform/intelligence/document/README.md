# Document Intelligence

Version: `0.1.0`

Sprint 041 Document Intelligence turns organizational documents into classified, traceable, risk-aware intelligence and knowledge contribution drafts.

## Quick Start

```ts
import { createDocumentIntelligence } from "@/lib/platform/intelligence/document";

const { service } = createDocumentIntelligence();

const result = service.build({
  requestId: "doc-run-001",
  question: "Where are document risks and knowledge opportunities?",
});
```

## Capability Table

| Capability | Output |
| --- | --- |
| OCR readiness and parsing | `parse` |
| Classification and catalog | `classification`, `catalog` |
| Metadata extraction | `metadata` |
| Entity and relationship extraction | `entities`, `relationships` |
| Version and duplicate intelligence | `versions`, `duplicates` |
| Summarization and clause extraction | `summarization`, `clauses` |
| Risk and compliance | `riskSuite`, `compliance` |
| Expiration monitoring | `expiration` |
| Knowledge contribution | `knowledgeContribution` |
| Reasoning and recommendations | `reasoning`, `recommendations` |

## Outputs

`DocumentResult` includes scores, dashboards, an executive brief, projection, history record, catalog, all capability suites, risks, opportunities, recommendations, confidence, baseline, scope, request id, generated timestamp, period label, and package version.

Specialized dashboards are included for contracts, policies, grants, and compliance.

## Architecture Position

Document Intelligence sits downstream of organization and execution context and upstream of validated knowledge contribution:

`Organization DNA -> OIOS -> Knowledge -> Document -> document-derived knowledge drafts`

It soft-reads upstream domains through light DTOs to avoid circular imports.

## DI / Platform Wiring

| Option | Purpose |
| --- | --- |
| `documentParser` | Override parse readiness engine |
| `documentClassifier` | Override classification and catalog engine |
| `metadataIntelligence` | Override metadata extractor |
| `entityRelationshipIntelligence` | Override entity/relationship extraction |
| `versionDuplicateIntelligence` | Override version and duplicate intelligence |
| `summarizationClauseIntelligence` | Override summary and clause extraction |
| `riskComplianceIntelligence` | Override risk and compliance intelligence |
| `expirationIntelligence` | Override expiration monitoring |
| `knowledgeContributionEngine` | Override knowledge draft contribution |
| `documentReasoner` | Override reasoning |
| `repository`, `registry`, `now`, `createId` | Platform integration hooks |
| `wireOrganizationDna`, `wireOios` | Auto-wire DNA/OIOS stacks by default |
