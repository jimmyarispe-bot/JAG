# Funding Intelligence (Sprint 034)

Continuously identify, qualify, prioritize, pursue, manage, forecast, optimize, and monitor funding opportunities for every organization type — composed on Organizational DNA + OIOS Core, after Revenue Intelligence.

## Quick start

```ts
import { createFundingIntelligence } from "@/lib/platform/intelligence/funding";

const { service } = createFundingIntelligence({
  wireOrganizationDna: false,
  wireOios: false,
});

const result = service.build({
  requestId: "fund-1",
  scope: { organizationId: "org-1", schoolId: null },
});

console.log(result.healthScore, result.brief.headline);
```

## Capabilities

| Area | Components |
|------|------------|
| Core | `FundingIntelligenceService`, `FundingIntelligenceEngine`, `FundingIntelligence`, `FundingRepository`, `FundingDashboard`, `FundingHealth`, FundingModels |
| Government | Federal, State, County, City, Education, Healthcare, Infrastructure, EconomicDevelopment, Disaster, Research |
| Grants | Discovery, Matching, Scoring, Calendar, Forecasting, Requirements, Compliance, Reporting, Renewals |
| Contracts | GovernmentContracts, CorporateContracts, RFPDiscovery, BidScoring, ProposalOptimization, ContractForecast |
| Philanthropy | FoundationMatching, MajorDonorInsights, CorporateGiving, FamilyFoundations, CommunityFoundations, CapitalCampaignPlanning |
| Investment | AngelInvestors, VentureCapital, PrivateEquity, StrategicInvestors, DebtFinancing, RevenueBasedFinancing |
| Alternative | Crowdfunding, Sponsorships, TaxCredits, TaxIncentives, OpportunityZones, NewMarketsTaxCredits, CarbonCredits, LicensingRevenue, RoyaltyRevenue |
| Strategy | FundingMixOptimization, DiversificationAnalysis, FundingRiskAnalysis, FundingScenarioPlanning, CashRunwayOptimization, CapitalPlanning |

## Outputs

- Funding Health Score
- Funding Opportunity Score
- Funding Risk Score
- Grant Pipeline Dashboard
- Capital Strategy Dashboard
- Funding Diversification Dashboard
- Funding Risk Dashboard
- Funding Calendar
- Executive Funding Brief
- Top Recommended Opportunities
- Proposal Priority List

Every recommendation narrative addresses **available funding**, **diversification**, **funding risk**, **sustainability**, and **mission impact** via `FundingLensImpact`.

## Architecture position

```
organization-dna → oios-core → organization-health → financial → founder
  → executive → executive-graph → executive-decision → predictive
  → board-governance → human-capital → revenue → funding
```

## DI / platform

| Surface | Value |
|---------|-------|
| DI entry | `createFundingIntelligence()` |
| Service attach | `createIntelligenceService().funding` |
| Platform module id | `funding` |
| Context key | `funding` |
| OIOS domain | `funding` (active) |
| Version | `FUNDING_INTELLIGENCE_VERSION` (`0.1.0`) |
| Injectables | `now`, `createId`, per-module overrides, `repository` |

## Docs

- [Sprint 034](../../../../docs/architecture/SPRINT034_FUNDING_INTELLIGENCE.md)
- [Architecture](../../../../docs/architecture/FUNDING_INTELLIGENCE.md)
- [Verification](../../../../docs/architecture/FUNDING_INTELLIGENCE_VERIFICATION.md)
