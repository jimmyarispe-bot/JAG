# Stakeholder Intelligence (Sprint 050)

**Version:** 0.1.0 | **Domain key:** `stakeholder` | **ID prefix:** `stk-`

Seventeen-area stakeholder assessment for JAG organizations. Continuously understand identification, mapping, influence, interest, engagement, communication, trust, board/investor/customer/employee/partner/community/government stakeholders, sentiment, conflict, and collaboration — composing onto Environmental (049) without regenerating that package.

## Areas (17)

stakeholder_identification, stakeholder_mapping, influence_analysis, interest_analysis, engagement, communication, trust_relationship, board_stakeholders, investor_donor, customer_stakeholders, employee_stakeholders, partner_stakeholders, community_stakeholders, government_stakeholders, satisfaction_sentiment, conflict_detection, collaboration_opportunities

## Entry point

```ts
import { createStakeholderIntelligence } from "@/lib/platform/intelligence/stakeholder";

const { service } = createStakeholderIntelligence({ wireOrganizationDna: false, wireOios: false });
const result = service.build({ requestId: "stk-1", scope: { organizationId: "org-1", schoolId: "school-1" } });
```

## Lens (8 fields)

influence · interest · trust · engagement · satisfaction · relationshipStrength · collaborationOpportunity · strategicImportance

## Hard DAG

`["environmental"]` — terminal platform module after Environmental Intelligence.
