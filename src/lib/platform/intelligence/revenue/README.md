# Revenue Intelligence (Sprint 033)

Sustainable revenue, profitability, mission impact, revenue risk, and long-term financial health for JAG OIOS — composed on Organizational DNA + OIOS Core, after Human Capital.

## Quick start

```ts
import { createRevenueIntelligence } from "@/lib/platform/intelligence/revenue";

const { service } = createRevenueIntelligence({
  wireOrganizationDna: false,
  wireOios: false,
});

const result = service.build({
  requestId: "rev-1",
  scope: { organizationId: "org-1", schoolId: null },
});

console.log(result.healthScore, result.brief.headline);
```

## Capabilities

| Area | Components |
|------|------------|
| Core | `RevenueIntelligenceService`, `RevenueIntelligenceEngine`, `RevenueIntelligence`, `RevenueRepository`, `RevenueDashboard`, `RevenueHealth`, RevenueModels |
| Strategy | `RevenueStrategyEngine`, `RevenueMixAnalysis`, `RevenueDiversification`, `RecurringRevenueAnalysis`, `RevenueRiskAnalysis`, `RevenueOptimization`, `RevenueGrowthPlanner`, `RevenueForecasting`, `RevenueScenarioPlanning` |
| Pricing | `PricingEngine`, `DynamicPricing`, `PriceElasticity`, `CompetitivePricing`, `DiscountOptimization`, `ScholarshipPricing`, `ContractPricing`, `SubscriptionPricing` |
| Offerings | `OfferingAnalysis`, `ProductProfitability`, `ServiceProfitability`, `MarginAnalysis`, `LifecycleAnalysis`, `ExpansionRecommendations`, `RetirementRecommendations` |
| Customers | `CustomerLifetimeValue`, `RetentionRevenue`, `ExpansionRevenue`, `CrossSellEngine`, `UpsellEngine`, `CustomerProfitability`, `SegmentProfitability` |
| Sales | `PipelineForecast`, `WinRateAnalysis`, `SalesPerformance`, `SalesCapacity`, `TerritoryOptimization`, `ConversionAnalysis` |
| Market | `MarketExpansion`, `CompetitorRevenue`, `DemandForecast`, `OpportunityScoring`, `GeographicExpansion`, `IndustryBenchmarks` |
| Financial | `GrossMarginAnalysis`, `NetMarginAnalysis`, `ContributionMargin`, `BreakEvenAnalysis`, `UnitEconomics`, `CashGenerationAnalysis`, `RevenueSensitivity` |

## Outputs

- Revenue Health Score
- Revenue Growth Score
- Revenue Risk Score
- Revenue Dashboard
- Pricing Dashboard
- Margin Dashboard
- Customer Value Dashboard
- Revenue Forecast
- Expansion Opportunities
- Pricing Recommendations
- Executive Revenue Brief

Every recommendation narrative addresses **sustainable revenue**, **profitability**, **mission impact**, **revenue risk**, and **long-term health** via `RevenueLensImpact`.

## Architecture position

```
organization-dna → oios-core → organization-health → financial → founder
  → executive → executive-graph → executive-decision → predictive
  → board-governance → human-capital → revenue
```

## DI / platform

| Surface | Value |
|---------|-------|
| DI entry | `createRevenueIntelligence()` |
| Service attach | `createIntelligenceService().revenue` |
| Platform module id | `revenue` |
| Context key | `revenue` |
| OIOS domain | `revenue` (active) |
| Version | `REVENUE_INTELLIGENCE_VERSION` (`0.1.0`) |
| Injectables | `now`, `createId`, per-module overrides, `repository` |

## Docs

- [Sprint 033](../../../../docs/architecture/SPRINT033_REVENUE_INTELLIGENCE.md)
- [Architecture](../../../../docs/architecture/REVENUE_INTELLIGENCE.md)
- [Verification](../../../../docs/architecture/REVENUE_INTELLIGENCE_VERIFICATION.md)
