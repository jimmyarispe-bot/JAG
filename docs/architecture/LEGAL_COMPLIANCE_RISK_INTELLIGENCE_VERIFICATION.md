# Legal, Compliance & Risk Intelligence - Verification Checklist

## Static

- [x] Package exists at `src/lib/platform/intelligence/legal-compliance-risk/`
- [x] `types.ts` / `contracts.ts` remain leaf (no implementation imports)
- [x] `LEGAL_COMPLIANCE_RISK_INTELLIGENCE_VERSION = "0.1.0"`
- [x] Constants: 11 risk categories, 9 compliance scopes, 14 capabilities
- [x] 8-field recommendation lens on recommendations, corrective actions, briefs
- [x] `legal-compliance-risk` in `OIOS_INTELLIGENCE_DOMAINS` and active in `defaultRegisteredDomains()`; `legal` / `compliance` / `risk` reserved
- [x] `legal-compliance-risk` in `INTELLIGENCE_MODULE_IDS`
- [x] Module adapter registered after `document` in `createDefaultIntelligenceModules()`
- [x] `createIntelligenceService()` exposes `.legalComplianceRisk`
- [x] Public exports present on `@/lib/platform/intelligence`
- [x] Sprint / architecture docs present
- [x] Does not regenerate Sprint 021-041 packages (Document Intelligence frozen)

## Behavioral

- [x] `service.build()` returns compliance-health / risk / contract / regulatory / policy / audit / license-permit / insurance / litigation / vendor / cyber / knowledge scores
- [x] Enterprise risk register covers all `RISK_CATEGORIES`
- [x] Compliance coverage spans all `COMPLIANCE_SCOPES`
- [x] Result includes Enterprise Risk Dashboard, Compliance Dashboard, Contract Dashboard, Audit Dashboard
- [x] Result includes Executive Risk Brief and Board Compliance Brief
- [x] Result includes Corrective Action Plan and `correctiveActions` array
- [x] Every recommendation includes all eight lens keys plus regulation/policy ref, evidence refs, confidence score, risk score, owner, due date, priority
- [x] Knowledge contribution writes drafts to `knowledgeContribution.artifacts`
- [x] Query focuses include contracts / regulatory / compliance / risk / policy / audit / licenses / insurance / litigation / vendor / cyber / corrective / reasoning
- [x] Query + repository persistence work
- [x] Soft upstream light types: knowledge, document, board-governance, decision, human-capital, funding, operations, customer, organizational-improvement
- [x] `createLegalComplianceRiskIntelligence()` returns `LegalComplianceRiskStack`
- [x] Platform pipeline order ends with `document -> legal-compliance-risk`
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
-> knowledge -> document -> legal-compliance-risk
```
