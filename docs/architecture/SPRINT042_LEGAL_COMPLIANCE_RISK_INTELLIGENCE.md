# Sprint 042 - Legal, Compliance & Risk Intelligence

**Branch:** `founder-os-beta`  
**Domain key:** `legal-compliance-risk`  
**Package:** `src/lib/platform/intelligence/legal-compliance-risk/`  
**Version:** `0.1.0`

## Vision

Organizational governance intelligence (NOT document storage). Continuously
understand legal obligations, contractual commitments, regulatory requirements,
policies, and enterprise risks, and recommend corrective actions **before**
problems occur. Composes onto Document Intelligence (Sprint 041) and the wider
OIOS.

## Recommendation Lens

Every recommendation, brief, and governance record surfaces the 8-field lens:

1. `regulationOrPolicyApplies`
2. `evidenceSupports`
3. `confidence`
4. `organizationalRisk`
5. `ifNoActionTaken`
6. `correctiveActionRecommended`
7. `whoOwnsAction`
8. `whenShouldComplete`

Each recommendation record also carries: regulation/policy ref, evidence refs,
confidence score, risk score, owner, due date, and priority band.

## Delivered

- Core: `LegalComplianceRiskIntelligenceService` / `LegalComplianceRiskService`,
  `LegalComplianceRiskIntelligenceEngine` / `LegalComplianceRiskEngine`,
  `LegalComplianceRiskRepository`, `LegalComplianceRiskModels`,
  `LegalComplianceRiskDashboard`, `LegalComplianceRiskHealth`,
  `LegalComplianceRiskRegistry`, `LegalComplianceRiskReasoner`
- 11 capability submodules:
  1. Contract Intelligence
  2. Regulatory Intelligence
  3. Compliance Intelligence
  4. Enterprise Risk Intelligence
  5. Policy Intelligence
  6. Audit Intelligence
  7. License + Permit Intelligence
  8. Insurance Intelligence
  9. Litigation Tracking Framework
  10. Vendor + Third-Party Risk
  11. Cyber Governance
- Enterprise risk register across 11 categories: financial, operational,
  strategic, legal, compliance, human_capital, cyber, reputation, mission,
  funding, vendor
- Compliance coverage across 9 scopes: federal, state, local, industry,
  board_policies, internal_policies, accreditation, grant_requirements,
  contract_obligations
- Outputs: Compliance Health Score, Risk Health Score (`riskScore`, inverted
  pressure semantics), Enterprise Risk Dashboard, Compliance Dashboard, Contract
  Dashboard, Audit Dashboard, Executive Risk Brief, Board Compliance Brief, and a
  Corrective Action Plan (`correctiveActions`)
- Knowledge contribution drafts through `knowledgeContribution.artifacts`
- DI via `createLegalComplianceRiskIntelligence()` and
  `createIntelligenceService().legalComplianceRisk`
- Platform module `legal-compliance-risk` registered after `document`

## Pipeline Position

```
organization-dna -> oios-core -> organization-health -> financial -> founder
  -> executive -> executive-graph -> executive-decision -> predictive
  -> board-governance -> human-capital -> revenue -> funding -> opportunity
  -> organizational-improvement -> business-model -> operations -> customer
  -> knowledge -> document -> legal-compliance-risk
```

## Dependency Contract

- Hard DAG dependency: `document` (terminal after document)
- Soft reads (`*ResultLight` + baseline derivation): Knowledge, Document, Board
  Governance, Executive Decision, Human Capital, Funding, Operations, Customer,
  Organizational Improvement
- Plus DNA, OIOS, graph, prediction as usual

## Non-Negotiables Honored

- Did not regenerate Sprint 021-041 packages; Document Intelligence (Sprint 041)
  remains frozen
- Composed onto existing architecture only
- Leaf modules remain leaf (`types` / `contracts` import types only, never
  implementations)
- Platform module is terminal after `document`
- OIOS domain activation for `legal-compliance-risk`; `legal`, `compliance`, and
  `risk` remain reserved for an optional future split
