# Political Intelligence (Sprint 048)

**Version:** 0.1.0 | **Domain key:** `political` | **ID prefix:** `pol-`

Seventeen-area political environment assessment for JAG organizations. Continuously understand legislation, regulation, elections, public funding, trade, immigration, judicial decisions, and geopolitical risk — composing onto Competitive (047) without regenerating that package.

## Areas (17)

legislative, regulatory, government_policy, elections_leadership, public_funding, tax_policy, education_policy, healthcare_policy, labor_employment_policy, international_relations, trade_tariffs, immigration_policy, judicial_decisions, government_contracting, public_sentiment, lobbying_advocacy, geopolitical_risk

## Entry point

```ts
import { createPoliticalIntelligence } from "@/lib/platform/intelligence/political";

const { service } = createPoliticalIntelligence({ wireOrganizationDna: false, wireOios: false });
const result = service.build({ requestId: "pol-1", scope: { organizationId: "org-1", schoolId: "school-1" } });
```

## Lens (8 fields)

legislativeImpact · regulatoryRisk · governmentFundingOpportunity · taxExposure · politicalStability · tradeImpact · compliancePressure · strategicTiming

## Hard DAG

`["competitive"]` — terminal platform module after Competitive Intelligence.
