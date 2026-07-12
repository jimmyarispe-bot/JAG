# Market Intelligence (Sprint 043)

Organizational market awareness for the JAG OIOS. This domain is **not**
marketing analytics — it continuously understands the external environment so
leadership can anticipate change. Composes onto Legal Compliance & Risk
(Sprint 042) and the wider OIOS.

- Domain key / module id: `market`
- Version: `0.1.0`
- Soft integrations: Knowledge, Document, Legal Compliance & Risk, Revenue,
  Funding, Customer, Business Model, Operations, Predictive, Opportunity

## Capability submodules

1. `industry-intelligence.ts` — Industry Intelligence
2. `competitive-intelligence.ts` — Competitive Intelligence
3. `market-size-intelligence.ts` — Market Size (TAM / SAM / SOM)
4. `pricing-intelligence.ts` — Pricing Intelligence
5. `customer-demand-intelligence.ts` — Customer Demand Intelligence
6. `demographic-intelligence.ts` — Demographic Intelligence
7. `geographic-expansion-intelligence.ts` — Geographic Expansion Intelligence
8. `economic-trend-intelligence.ts` — Economic Trend Intelligence
9. `technology-trend-intelligence.ts` — Technology Trend Intelligence
10. `partnership-intelligence.ts` — Partnership Intelligence
11. `mergers-acquisitions-intelligence.ts` — Mergers & Acquisitions Intelligence
12. `white-space-intelligence.ts` — White Space Opportunity Intelligence

## Market signal kinds

`competitor_launches`, `competitor_pricing`, `industry_reports`,
`customer_demand_shifts`, `population_changes`, `employment_trends`,
`economic_indicators`, `regulatory_changes`, `technology_disruption`,
`emerging_markets`, `industry_consolidation`.

## Recommendation lens (8 required fields)

Every recommendation surfaces the market lens:

- `marketOpportunityExists`
- `evidenceSupports`
- `competitorsInvolved`
- `estimatedMarketSize`
- `risksExist`
- `investmentRequired`
- `expectedReturn`
- `organizationalCapabilitiesRequired`

Recommendations also carry evidence refs, confidence score, risk score, market
size / investment / expected return estimates, competitors, capabilities
required, owner, due date, and priority.

## Outputs

- Market Health Score, Competitive Position Score, Expansion Opportunity Score
- Market Risk Score (`marketRiskScore`, inverted pressure — higher = healthier)
- Competitive / Expansion / Trend specialized dashboards
- Executive Market Brief
- Signals suite covering all `MARKET_SIGNAL_KINDS`
- Knowledge contribution drafts through `knowledgeContribution.artifacts`

## Usage

```ts
import { createMarketIntelligence } from "@/lib/platform/intelligence/market";

const { service } = createMarketIntelligence({ wireOrganizationDna: false, wireOios: false });
const result = service.build({ requestId: "mkt-1", scope: { organizationId: "org-1", schoolId: "school-1" } });
```
