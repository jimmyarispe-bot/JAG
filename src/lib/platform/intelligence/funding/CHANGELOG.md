# Changelog — Funding Intelligence

## 0.1.0 — Sprint 034 (2026-07-12)

### Added

- Funding Intelligence domain package under `src/lib/platform/intelligence/funding/`
- Core: `FundingIntelligenceService` / `FundingService`, `FundingIntelligenceEngine` / `FundingEngine`, `FundingIntelligence`, `FundingRepository`, `FundingDashboard`, `FundingHealth`, FundingModels
- Government Funding: Federal, State, County, City, Education, Healthcare, Infrastructure, EconomicDevelopment, Disaster, Research
- Grant Intelligence: Discovery, Matching, Scoring, Calendar, Forecasting, Requirements, Compliance, Reporting, Renewals
- Contracts & Procurement: GovernmentContracts, CorporateContracts, RFPDiscovery, BidScoring, ProposalOptimization, ContractForecast
- Philanthropy: FoundationMatching, MajorDonorInsights, CorporateGiving, FamilyFoundations, CommunityFoundations, CapitalCampaignPlanning
- Investment: AngelInvestors, VentureCapital, PrivateEquity, StrategicInvestors, DebtFinancing, RevenueBasedFinancing
- Alternative: Crowdfunding, Sponsorships, TaxCredits, TaxIncentives, OpportunityZones, NewMarketsTaxCredits, CarbonCredits, LicensingRevenue, RoyaltyRevenue
- Strategy: FundingMixOptimization, DiversificationAnalysis, FundingRiskAnalysis, FundingScenarioPlanning, CashRunwayOptimization, CapitalPlanning
- Outputs: health/opportunity/risk scores, grant-pipeline/capital-strategy/diversification/risk dashboards, funding calendar, executive funding brief, top opportunities, proposal priorities
- Five-lens impact narratives (`availableFunding`, `diversification`, `fundingRisk`, `sustainability`, `missionImpact`)
- Platform adapter module id: `funding` (depends on `revenue`, context key `funding`)
- OIOS domain registry activation for `funding`
- DI via `createFundingIntelligence()` and `createIntelligenceService().funding`
- Integration surfaces for Organizational DNA, OIOS Core, Financial Intelligence, Revenue Intelligence, Executive Graph, Executive Decision, Predictive Intelligence, Board Governance, Human Capital, and Continuous Improvement
