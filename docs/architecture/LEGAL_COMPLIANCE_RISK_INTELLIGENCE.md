# Legal, Compliance & Risk Intelligence

**Sprint:** 042  
**Package:** `src/lib/platform/intelligence/legal-compliance-risk/`  
**Module id / OIOS domain:** `legal-compliance-risk`

## Purpose

Continuously understand legal obligations, contractual commitments, regulatory
requirements, policies, and enterprise risks, and recommend corrective actions
**before** problems occur. This is organizational governance intelligence — NOT
document storage. It composes onto Document Intelligence (Sprint 041) and the
wider OIOS to reason about obligations and risk.

## Package Layout

| File | Role |
|------|------|
| `types.ts` | Leaf DTOs, constants, request/result |
| `contracts.ts` | Leaf interfaces + DI bag |
| `models.ts` | Baseline derivation + score/confidence/lens helpers |
| `contract-intelligence.ts` | Contract obligations, renewals, clause gaps |
| `regulatory-intelligence.ts` | Regulatory requirements across all scopes |
| `compliance-intelligence.ts` | Compliance obligation tracking + gap pressure |
| `enterprise-risk-intelligence.ts` | Enterprise risk register across 11 categories |
| `policy-intelligence.ts` | Policy coverage, staleness, ownership |
| `audit-intelligence.ts` | Audit readiness and finding remediation |
| `license-permit-intelligence.ts` | License / permit expiration monitoring |
| `insurance-intelligence.ts` | Insurance adequacy and renewal monitoring |
| `litigation-intelligence.ts` | Litigation tracking and exposure |
| `vendor-third-party-risk-intelligence.ts` | Vendor / third-party risk tiering |
| `cyber-governance-intelligence.ts` | Cyber governance control maturity |
| `knowledge-contribution.ts` | Governance-derived knowledge drafts |
| `legal-compliance-risk-reasoner.ts` | Reasoning over obligations, risks, gaps |
| `legal-compliance-risk-registry.ts` | Upstream publisher registry |
| `legal-compliance-risk-intelligence.ts` | Scores, health, dashboards, analyzers, briefs |
| `legal-compliance-risk-engine.ts` | Orchestrator |
| `service.ts` / `repository.ts` / `projection.ts` | Facade, store, queries |
| `index.ts` | Public API + `createLegalComplianceRiskIntelligence()` |

## Composition Flow

1. Derive baseline from DNA / OIOS / graph / decision / prediction soft reads and
   from Knowledge, Document, Board Governance, Human Capital, Funding, Operations,
   Customer, and Organizational Improvement `*ResultLight` signals
2. Assess contracts (coverage, expirations, missing clauses, auto-renewal risk)
3. Assess regulatory requirements across all `COMPLIANCE_SCOPES`
4. Track compliance obligations and gap pressure per scope
5. Build the enterprise risk register across all `RISK_CATEGORIES`
6. Assess policy coverage, staleness, and ownership
7. Assess audit readiness and open / overdue findings
8. Monitor license and permit expirations
9. Assess insurance adequacy and renewals
10. Track litigation matters and exposure
11. Tier vendor / third-party risk
12. Assess cyber governance control maturity
13. Generate governance-derived knowledge drafts
14. Reason over non-compliant obligations, top enterprise risks, and missing topics
15. Analyze risks / opportunities and compose recommendations with the 8-field lens
16. Score compliance health, risk (inverted pressure), contract, regulatory,
    policy, audit, license/permit, insurance, litigation, vendor, cyber, knowledge
17. Generate dashboards, executive risk brief, board compliance brief, projection,
    corrective action plan, and history

## Recommendation Lens (8 required fields)

1. `regulationOrPolicyApplies`
2. `evidenceSupports`
3. `confidence`
4. `organizationalRisk`
5. `ifNoActionTaken`
6. `correctiveActionRecommended`
7. `whoOwnsAction`
8. `whenShouldComplete`

Each recommendation record also carries regulation/policy ref, evidence refs,
confidence score, risk score, owner, due date, and priority.

## Enterprise Risk Categories

`financial`, `operational`, `strategic`, `legal`, `compliance`, `human_capital`,
`cyber`, `reputation`, `mission`, `funding`, `vendor`

## Compliance Scopes

`federal`, `state`, `local`, `industry`, `board_policies`, `internal_policies`,
`accreditation`, `grant_requirements`, `contract_obligations`

## Integrations

| Domain | Integration |
|--------|-------------|
| Organization DNA | Persona / structure soft signals |
| OIOS Core | Execution and health baseline |
| Executive Graph | Graph and risk/dependency context |
| Executive Decision | Decision dependency density |
| Predictive | Forward risk signals |
| Knowledge | Coverage / validation baseline |
| Document | Hard predecessor — compliance coverage, risk pressure, contract/grant/policy density, expiration risk |
| Board Governance | Policy governance, minutes, decision traceability |
| Human Capital | Policy, training, and succession signals |
| Funding | Grant readiness and award compliance signals |
| Operations | Operational readiness and backlog pressure |
| Customer | Family experience and complaint burden signals |
| Organizational Improvement | Execution and capacity signals |

## Platform

| Surface | Value |
|---------|-------|
| Module id | `legal-compliance-risk` |
| Context key | `legalComplianceRisk` |
| Hard dependency | `document` |
| Soft reads | DNA, OIOS, graph, decision, prediction, knowledge, document, board-governance, human-capital, funding, operations, customer, organizational-improvement |
| OIOS status | active |
| Service attach | `createIntelligenceService().legalComplianceRisk` |
