# Legal, Compliance & Risk Intelligence (Sprint 042)

Organizational governance intelligence for the JAG OIOS. This domain is **not**
document storage — it composes onto Document Intelligence (Sprint 041) and the
wider OIOS to continuously understand legal obligations, contractual
commitments, regulatory requirements, policies, and enterprise risks, and to
recommend corrective actions *before* problems occur.

- Domain key / module id: `legal-compliance-risk`
- Version: `0.1.0`
- Hard DAG dependency: `document` (terminal module, runs after document)

## Capability submodules

1. `contract-intelligence.ts` — Contract Intelligence
2. `regulatory-intelligence.ts` — Regulatory Intelligence
3. `compliance-intelligence.ts` — Compliance Intelligence
4. `enterprise-risk-intelligence.ts` — Enterprise Risk Intelligence
5. `policy-intelligence.ts` — Policy Intelligence
6. `audit-intelligence.ts` — Audit Intelligence
7. `license-permit-intelligence.ts` — License + Permit Intelligence
8. `insurance-intelligence.ts` — Insurance Intelligence
9. `litigation-intelligence.ts` — Litigation Tracking Framework
10. `vendor-third-party-risk-intelligence.ts` — Vendor + Third-Party Risk
11. `cyber-governance-intelligence.ts` — Cyber Governance

## Risk categories

`financial`, `operational`, `strategic`, `legal`, `compliance`, `human_capital`,
`cyber`, `reputation`, `mission`, `funding`, `vendor`.

## Compliance scopes

`federal`, `state`, `local`, `industry`, `board_policies`, `internal_policies`,
`accreditation`, `grant_requirements`, `contract_obligations`.

## Recommendation lens (8 required fields)

Every recommendation / corrective action surfaces the governance lens:

- `regulationOrPolicyApplies`
- `evidenceSupports`
- `confidence`
- `organizationalRisk`
- `ifNoActionTaken`
- `correctiveActionRecommended`
- `whoOwnsAction`
- `whenShouldComplete`

Recommendations also carry a regulation/policy ref, evidence refs, confidence
score, risk score, owner, due date, and priority.

## Outputs

- Compliance Health Score, Risk Health Score (`riskScore`, inverted pressure)
- Enterprise Risk Dashboard, Compliance Dashboard, Contract Dashboard, Audit Dashboard
- Executive Risk Brief, Board Compliance Brief
- Corrective Action Plan (`correctiveActions` array)

## Usage

```ts
import { createLegalComplianceRiskIntelligence } from "@/lib/platform/intelligence/legal-compliance-risk";

const { service } = createLegalComplianceRiskIntelligence({ wireOrganizationDna: false, wireOios: false });
const result = service.build({ requestId: "lcr-1", scope: { organizationId: "org-1", schoolId: "school-1" } });
```
