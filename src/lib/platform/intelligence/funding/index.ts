/** Funding Intelligence public API (Sprint 034). */
export * from "@/lib/platform/intelligence/funding/types";
export type {
  BaselineInput,
  FundingDependencies,
  FundingEngine as FundingEngineContract,
  FundingIntelligenceEngine as FundingIntelligenceEngineContract,
  FundingIntelligenceService as FundingIntelligenceServiceContract,
  FundingService as FundingServiceContract,
  FundingRepository as FundingRepositoryContract,
  FederalFunding as FederalFundingContract,
  StateFunding as StateFundingContract,
  CountyFunding as CountyFundingContract,
  CityFunding as CityFundingContract,
  EducationFunding as EducationFundingContract,
  HealthcareFunding as HealthcareFundingContract,
  InfrastructureFunding as InfrastructureFundingContract,
  EconomicDevelopmentFunding as EconomicDevelopmentFundingContract,
  DisasterFunding as DisasterFundingContract,
  ResearchFunding as ResearchFundingContract,
  GrantDiscovery as GrantDiscoveryContract,
  GrantMatching as GrantMatchingContract,
  GrantScoring as GrantScoringContract,
  GrantCalendar as GrantCalendarContract,
  GrantForecasting as GrantForecastingContract,
  GrantRequirements as GrantRequirementsContract,
  GrantCompliance as GrantComplianceContract,
  GrantReporting as GrantReportingContract,
  GrantRenewals as GrantRenewalsContract,
  GrantIntelligencePipeline as GrantIntelligencePipelineContract,
  GovernmentContracts as GovernmentContractsContract,
  CorporateContracts as CorporateContractsContract,
  RFPDiscovery as RFPDiscoveryContract,
  BidScoring as BidScoringContract,
  ProposalOptimization as ProposalOptimizationContract,
  ContractForecast as ContractForecastContract,
  FoundationMatching as FoundationMatchingContract,
  MajorDonorInsights as MajorDonorInsightsContract,
  CorporateGiving as CorporateGivingContract,
  FamilyFoundations as FamilyFoundationsContract,
  CommunityFoundations as CommunityFoundationsContract,
  CapitalCampaignPlanning as CapitalCampaignPlanningContract,
  AngelInvestors as AngelInvestorsContract,
  VentureCapital as VentureCapitalContract,
  PrivateEquity as PrivateEquityContract,
  StrategicInvestors as StrategicInvestorsContract,
  DebtFinancing as DebtFinancingContract,
  RevenueBasedFinancing as RevenueBasedFinancingContract,
  Crowdfunding as CrowdfundingContract,
  Sponsorships as SponsorshipsContract,
  TaxCredits as TaxCreditsContract,
  TaxIncentives as TaxIncentivesContract,
  OpportunityZones as OpportunityZonesContract,
  NewMarketsTaxCredits as NewMarketsTaxCreditsContract,
  CarbonCredits as CarbonCreditsContract,
  LicensingRevenue as LicensingRevenueContract,
  RoyaltyRevenue as RoyaltyRevenueContract,
  FundingMixOptimization as FundingMixOptimizationContract,
  FundingDiversification as FundingDiversificationContract,
  FundingRiskAnalysis as FundingRiskAnalysisContract,
  FundingScenarioPlanning as FundingScenarioPlanningContract,
  CashRunwayOptimization as CashRunwayOptimizationContract,
  CapitalPlanning as CapitalPlanningContract,
  FundingStrategyEngine as FundingStrategyEngineContract,
  FundingIntelligence as FundingIntelligenceContract,
  FundingHealth as FundingHealthContract,
  FundingDashboard as FundingDashboardContract,
  GrantPipelineDashboard as GrantPipelineDashboardContract,
  CapitalStrategyDashboard as CapitalStrategyDashboardContract,
  FundingDiversificationDashboard as FundingDiversificationDashboardContract,
  FundingRiskDashboard as FundingRiskDashboardContract,
  FundingCalendarComposer as FundingCalendarComposerContract,
  ExecutiveFundingBriefGenerator as ExecutiveFundingBriefGeneratorContract,
  TopOpportunityAggregator as TopOpportunityAggregatorContract,
  ProposalPriorityAggregator as ProposalPriorityAggregatorContract,
  FundingProjection as FundingProjectionContract,
  FundingQueries as FundingQueriesContract,
} from "@/lib/platform/intelligence/funding/contracts";
export * from "@/lib/platform/intelligence/funding/models";
export * from "@/lib/platform/intelligence/funding/government-funding";
export * from "@/lib/platform/intelligence/funding/grant-intelligence";
export * from "@/lib/platform/intelligence/funding/contracts-procurement";
export * from "@/lib/platform/intelligence/funding/philanthropy-intelligence";
export * from "@/lib/platform/intelligence/funding/investment-intelligence";
export * from "@/lib/platform/intelligence/funding/alternative-funding";
export * from "@/lib/platform/intelligence/funding/funding-strategy";
export * from "@/lib/platform/intelligence/funding/funding-intelligence";
export * from "@/lib/platform/intelligence/funding/projection";
export * from "@/lib/platform/intelligence/funding/repository";
export * from "@/lib/platform/intelligence/funding/funding-engine";
export * from "@/lib/platform/intelligence/funding/service";

import type { FundingDependencies } from "@/lib/platform/intelligence/funding/contracts";
import { FundingIntelligenceEngine } from "@/lib/platform/intelligence/funding/funding-engine";
import { FundingIntelligenceService } from "@/lib/platform/intelligence/funding/service";
import { createOiosOperatingSystem, type CreateOiosOptions, type OiosStack } from "@/lib/platform/oios";
import { createOrganizationDnaIntelligence, type CreateOrganizationDnaOptions, type OrganizationDnaStack } from "@/lib/platform/intelligence/organization-dna";

export interface FundingStack { service: FundingIntelligenceService; engine: FundingIntelligenceEngine; organizationDna: OrganizationDnaStack | null; oios: OiosStack | null; }
export interface CreateFundingOptions extends FundingDependencies {
  organizationDna?: OrganizationDnaStack; organizationDnaOptions?: CreateOrganizationDnaOptions; wireOrganizationDna?: boolean;
  oios?: OiosStack; oiosOptions?: CreateOiosOptions; wireOios?: boolean;
}
export function createFundingIntelligence(options: CreateFundingOptions = {}): FundingStack {
  const wireDna = options.wireOrganizationDna !== false; const wireOios = options.wireOios !== false;
  const organizationDna = options.organizationDna ?? (wireDna ? createOrganizationDnaIntelligence({ ...(options.organizationDnaOptions ?? {}), wireGraphAnalyzer: false, wireDecision: false, wirePredictive: false, wireBoardGovernance: false }) : null);
  const oios = options.oios ?? (wireOios ? createOiosOperatingSystem({ ...(options.oiosOptions ?? {}), organizationDnaStack: options.oiosOptions?.organizationDnaStack ?? organizationDna ?? undefined, wireOrganizationDna: false }) : null);
  const engine = new FundingIntelligenceEngine(options); const service = new FundingIntelligenceService({ ...options, engine });
  return { service, engine, organizationDna, oios };
}
