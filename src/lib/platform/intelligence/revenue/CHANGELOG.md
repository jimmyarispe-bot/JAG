# Changelog — Revenue Intelligence

## 0.1.0 — Sprint 033 (2026-07-12)

### Added

- Revenue Intelligence domain package under `src/lib/platform/intelligence/revenue/`
- Core: `RevenueIntelligenceService` / `RevenueService`, `RevenueIntelligenceEngine` / `RevenueEngine`, `RevenueIntelligence`, `RevenueRepository`, `RevenueDashboard`, `RevenueHealth`, RevenueModels
- Strategy Intelligence: `RevenueStrategyEngine`, RevenueMixAnalysis, RevenueDiversification, RecurringRevenueAnalysis, RevenueRiskAnalysis, RevenueOptimization, RevenueGrowthPlanner, RevenueForecasting, RevenueScenarioPlanning
- Pricing Intelligence: PricingEngine, DynamicPricing, PriceElasticity, CompetitivePricing, DiscountOptimization, ScholarshipPricing, ContractPricing, SubscriptionPricing
- Offering Intelligence: OfferingAnalysis, ProductProfitability, ServiceProfitability, MarginAnalysis, LifecycleAnalysis, ExpansionRecommendations, RetirementRecommendations
- Customer Revenue Intelligence: CustomerLifetimeValue, RetentionRevenue, ExpansionRevenue, CrossSellEngine, UpsellEngine, CustomerProfitability, SegmentProfitability
- Sales Intelligence: PipelineForecast, WinRateAnalysis, SalesPerformance, SalesCapacity, TerritoryOptimization, ConversionAnalysis
- Market Intelligence: MarketExpansion, CompetitorRevenue, DemandForecast, OpportunityScoring, GeographicExpansion, IndustryBenchmarks
- Financial Margin Intelligence: GrossMarginAnalysis, NetMarginAnalysis, ContributionMargin, BreakEvenAnalysis, UnitEconomics, CashGenerationAnalysis, RevenueSensitivity
- Outputs: health/growth/risk scores, revenue/pricing/margin/customer-value dashboards, forecast, expansion opportunities, pricing recommendations, executive revenue brief
- Five-lens impact narratives on suite outputs (`sustainableRevenue`, `profitability`, `missionImpact`, `revenueRisk`, `longTermHealth`)
- Platform adapter module id: `revenue` (depends on `human-capital`, context key `revenue`)
- OIOS domain registry activation for `revenue`
- DI via `createRevenueIntelligence()` and `createIntelligenceService().revenue`
- Integration surfaces for Organizational DNA, OIOS Core, Financial Intelligence, Executive Graph, Executive Decision, Predictive Intelligence, Board Governance, Human Capital, and Continuous Improvement
