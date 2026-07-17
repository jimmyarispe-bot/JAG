/**
 * Funding Intelligence — contracts / interfaces only (Sprint 034).
 *
 * Leaf module: no imports from engine implementations (avoids cycles).
 * Canonical order: Engine → sub-engines → Repository → Registry → Service → Dependencies.
 */

import type * as T from "@/lib/platform/intelligence/funding/types";

export interface FundingIntelligenceEngine {
  build(request: T.FundingRequest): T.FundingResult;
}
export type FundingEngine = FundingIntelligenceEngine;
export interface FundingRepository {
  save(result: T.FundingResult): T.FundingResult;
  get(requestId: string): T.FundingResult | null;
  list(scope?: Partial<T.GraphScope>): T.FundingResult[];
  remove(requestId: string): boolean;
  saveHistory(record: T.FundingHistoryRecord): T.FundingHistoryRecord;
  listHistory(scope?: Partial<T.GraphScope>): T.FundingHistoryRecord[];
  clear(): void;
}
export interface FundingIntelligenceService {
  build(request: T.FundingRequest): T.FundingResult;
  query(result: T.FundingResult, request: T.FundingQueryRequest): T.FundingQueryResult;
  repository(): FundingRepository;
}
export type FundingService = FundingIntelligenceService;

export type BaselineInput = { baseline: T.FundingBaseline; now: Date };
export interface FederalFunding { analyze(input: BaselineInput): T.FederalFundingRecord[]; }
export interface StateFunding { analyze(input: BaselineInput): T.StateFundingRecord[]; }
export interface CountyFunding { analyze(input: BaselineInput): T.CountyFundingRecord[]; }
export interface CityFunding { analyze(input: BaselineInput): T.CityFundingRecord[]; }
export interface EducationFunding { analyze(input: BaselineInput): T.EducationFundingRecord[]; }
export interface HealthcareFunding { analyze(input: BaselineInput): T.HealthcareFundingRecord[]; }
export interface InfrastructureFunding { analyze(input: BaselineInput): T.InfrastructureFundingRecord[]; }
export interface EconomicDevelopmentFunding { analyze(input: BaselineInput): T.EconomicDevelopmentFundingRecord[]; }
export interface DisasterFunding { analyze(input: BaselineInput): T.DisasterFundingRecord[]; }
export interface ResearchFunding { analyze(input: BaselineInput): T.ResearchFundingRecord[]; }

export interface GrantDiscovery { discover(input: BaselineInput): T.GrantOpportunityRecord[]; }
export interface GrantMatching { match(input: BaselineInput & { opportunities: T.GrantOpportunityRecord[] }): T.GrantMatchRecord[]; }
export interface GrantScoring { score(input: BaselineInput & { matches: T.GrantMatchRecord[] }): T.GrantScoreRecord[]; }
export interface GrantCalendar { build(input: { opportunities: T.GrantOpportunityRecord[]; now: Date }): T.GrantCalendarEvent[]; }
export interface GrantForecasting { forecast(input: BaselineInput & { scores: T.GrantScoreRecord[] }): T.GrantForecastPoint[]; }
export interface GrantRequirements { analyze(input: BaselineInput & { opportunities: T.GrantOpportunityRecord[] }): T.GrantRequirementRecord[]; }
export interface GrantCompliance { analyze(input: BaselineInput & { opportunities: T.GrantOpportunityRecord[] }): T.GrantComplianceRecord[]; }
export interface GrantReporting { analyze(input: BaselineInput & { opportunities: T.GrantOpportunityRecord[] }): T.GrantReportingRecord[]; }
export interface GrantRenewals { analyze(input: BaselineInput & { opportunities: T.GrantOpportunityRecord[] }): T.GrantRenewalRecord[]; }
export interface GrantIntelligencePipeline { run(input: BaselineInput): T.GrantPipelineResult; }

export interface GovernmentContracts { analyze(input: BaselineInput): T.GovernmentContractRecord[]; }
export interface CorporateContracts { analyze(input: BaselineInput): T.CorporateContractRecord[]; }
export interface RFPDiscovery { discover(input: BaselineInput): T.RfpOpportunityRecord[]; }
export interface BidScoring { score(input: BaselineInput & { opportunities: T.RfpOpportunityRecord[] }): T.BidScoreRecord[]; }
export interface ProposalOptimization { optimize(input: BaselineInput & { bids: T.BidScoreRecord[] }): T.ProposalOptimizationRecord[]; }
export interface ContractForecast { forecast(input: BaselineInput & { contracts: T.GovernmentContractRecord[] }): T.ContractForecastResult; }

export interface FoundationMatching { analyze(input: BaselineInput): T.FoundationMatchRecord[]; }
export interface MajorDonorInsights { analyze(input: BaselineInput): T.MajorDonorInsightRecord[]; }
export interface CorporateGiving { analyze(input: BaselineInput): T.CorporateGivingRecord[]; }
export interface FamilyFoundations { analyze(input: BaselineInput): T.FamilyFoundationRecord[]; }
export interface CommunityFoundations { analyze(input: BaselineInput): T.CommunityFoundationRecord[]; }
export interface CapitalCampaignPlanning { plan(input: BaselineInput): T.CapitalCampaignPlan[]; }

export interface AngelInvestors { analyze(input: BaselineInput): T.AngelInvestorRecord[]; }
export interface VentureCapital { analyze(input: BaselineInput): T.VentureCapitalRecord[]; }
export interface PrivateEquity { analyze(input: BaselineInput): T.PrivateEquityRecord[]; }
export interface StrategicInvestors { analyze(input: BaselineInput): T.StrategicInvestorRecord[]; }
export interface DebtFinancing { analyze(input: BaselineInput): T.DebtFinancingRecord[]; }
export interface RevenueBasedFinancing { analyze(input: BaselineInput): T.RevenueBasedFinancingRecord[]; }

export interface Crowdfunding { analyze(input: BaselineInput): T.CrowdfundingRecord[]; }
export interface Sponsorships { analyze(input: BaselineInput): T.SponsorshipRecord[]; }
export interface TaxCredits { analyze(input: BaselineInput): T.TaxCreditRecord[]; }
export interface TaxIncentives { analyze(input: BaselineInput): T.TaxIncentiveRecord[]; }
export interface OpportunityZones { analyze(input: BaselineInput): T.OpportunityZoneRecord[]; }
export interface NewMarketsTaxCredits { analyze(input: BaselineInput): T.NewMarketsTaxCreditRecord[]; }
export interface CarbonCredits { analyze(input: BaselineInput): T.CarbonCreditRecord[]; }
export interface LicensingRevenue { analyze(input: BaselineInput): T.LicensingRevenueRecord[]; }
export interface RoyaltyRevenue { analyze(input: BaselineInput): T.RoyaltyRevenueRecord[]; }

export interface FundingMixOptimization { optimize(input: BaselineInput): T.FundingMixOptimizationResult; }
export interface FundingDiversification { analyze(input: BaselineInput & { mix: T.FundingMixRecord[] }): T.FundingDiversificationResult; }
export interface FundingRiskAnalysis { analyze(input: BaselineInput & { diversification: T.FundingDiversificationResult }): T.FundingRiskRecord[]; }
export interface FundingScenarioPlanning { plan(input: BaselineInput & { risks: T.FundingRiskRecord[] }): T.FundingScenarioPlan[]; }
export interface CashRunwayOptimization { analyze(input: BaselineInput): T.CashRunwayResult; }
export interface CapitalPlanning { plan(input: BaselineInput & { mix: T.FundingMixRecord[] }): T.CapitalPlanResult; }
export interface FundingStrategyEngine { run(input: BaselineInput): { mix: T.FundingMixRecord[]; mixOptimization: T.FundingMixOptimizationResult; diversification: T.FundingDiversificationResult; risks: T.FundingRiskRecord[]; scenarios: T.FundingScenarioPlan[]; runway: T.CashRunwayResult; capitalPlan: T.CapitalPlanResult }; }

export interface FundingIntelligence { composeScores(input: { baseline: T.FundingBaseline; diversification: T.FundingDiversificationResult; risks: T.FundingRiskRecord[]; topOpportunities: T.TopOpportunityRecord[] }): { healthScore: T.FundingScore; opportunityScore: T.FundingScore; riskScore: T.FundingScore }; }
export interface FundingHealth { assess(input: { baseline: T.FundingBaseline; scores: { healthScore: T.FundingScore; opportunityScore: T.FundingScore; riskScore: T.FundingScore }; diversification: T.FundingDiversificationResult }): T.FundingHealthResult; }
export interface FundingDashboard { compose(input: { baseline: T.FundingBaseline; scores: { healthScore: T.FundingScore; opportunityScore: T.FundingScore; riskScore: T.FundingScore }; now: Date }): T.FundingDashboardResult; }
export interface GrantPipelineDashboard { build(input: { pipeline: T.GrantPipelineResult; baseline: T.FundingBaseline; now: Date }): T.GrantPipelineDashboardResult; }
export interface CapitalStrategyDashboard { build(input: { capitalPlan: T.CapitalPlanResult; runway: T.CashRunwayResult; now: Date }): T.CapitalStrategyDashboardResult; }
export interface FundingDiversificationDashboard { build(input: { diversification: T.FundingDiversificationResult; now: Date }): T.FundingDiversificationDashboardResult; }
export interface FundingRiskDashboard { build(input: { risks: T.FundingRiskRecord[]; riskScore: T.FundingScore; now: Date }): T.FundingRiskDashboardResult; }
export interface FundingCalendarComposer { compose(input: { events: T.GrantCalendarEvent[]; now: Date }): T.FundingCalendarResult; }
export interface ExecutiveFundingBriefGenerator { generate(input: { request: T.FundingRequest; baseline: T.FundingBaseline; scores: { healthScore: T.FundingScore; opportunityScore: T.FundingScore; riskScore: T.FundingScore }; topOpportunities: T.TopOpportunityRecord[]; risks: T.FundingRiskRecord[]; confidence: T.FundingConfidenceScore; now: Date }): T.ExecutiveFundingBrief; }
export interface TopOpportunityAggregator { aggregate(input: { government: T.FundingRecordBase[]; grants: T.GrantOpportunityRecord[]; contracts: T.RfpOpportunityRecord[]; philanthropy: T.FoundationMatchRecord[]; investment: T.AngelInvestorRecord[]; alternative: T.CrowdfundingRecord[] }): T.TopOpportunityRecord[]; }
export interface ProposalPriorityAggregator { aggregate(input: { grants: T.GrantScoreRecord[]; bids: T.BidScoreRecord[] }): T.ProposalPriorityRecord[]; }
export interface FundingProjection { project(input: { baseline: T.FundingBaseline; scores: { healthScore: T.FundingScore; opportunityScore: T.FundingScore; riskScore: T.FundingScore }; forecast: T.GrantForecastPoint[]; topOpportunities: T.TopOpportunityRecord[]; brief: T.ExecutiveFundingBrief; dashboard: T.FundingDashboardResult; confidence: T.FundingConfidenceScore }): T.FundingProjectionResult; }
export interface FundingQueries { ask(result: T.FundingResult, request: T.FundingQueryRequest): T.FundingQueryResult; }

export interface FundingDependencies {
  engine?: FundingIntelligenceEngine; repository?: FundingRepository; queries?: FundingQueries;
  fundingIntelligence?: FundingIntelligence; fundingHealth?: FundingHealth; fundingDashboard?: FundingDashboard;
  grantPipelineDashboard?: GrantPipelineDashboard; capitalStrategyDashboard?: CapitalStrategyDashboard;
  diversificationDashboard?: FundingDiversificationDashboard; riskDashboard?: FundingRiskDashboard;
  calendarComposer?: FundingCalendarComposer; briefGenerator?: ExecutiveFundingBriefGenerator;
  topOpportunityAggregator?: TopOpportunityAggregator; proposalPriorityAggregator?: ProposalPriorityAggregator;
  projection?: FundingProjection; strategyEngine?: FundingStrategyEngine; grantPipeline?: GrantIntelligencePipeline;
  federalFunding?: FederalFunding; stateFunding?: StateFunding; countyFunding?: CountyFunding; cityFunding?: CityFunding;
  educationFunding?: EducationFunding; healthcareFunding?: HealthcareFunding; infrastructureFunding?: InfrastructureFunding;
  economicDevelopmentFunding?: EconomicDevelopmentFunding; disasterFunding?: DisasterFunding; researchFunding?: ResearchFunding;
  governmentContracts?: GovernmentContracts; corporateContracts?: CorporateContracts; rfpDiscovery?: RFPDiscovery;
  bidScoring?: BidScoring; proposalOptimization?: ProposalOptimization; contractForecast?: ContractForecast;
  foundationMatching?: FoundationMatching; majorDonorInsights?: MajorDonorInsights; corporateGiving?: CorporateGiving;
  familyFoundations?: FamilyFoundations; communityFoundations?: CommunityFoundations; capitalCampaignPlanning?: CapitalCampaignPlanning;
  angelInvestors?: AngelInvestors; ventureCapital?: VentureCapital; privateEquity?: PrivateEquity; strategicInvestors?: StrategicInvestors;
  debtFinancing?: DebtFinancing; revenueBasedFinancing?: RevenueBasedFinancing;
  crowdfunding?: Crowdfunding; sponsorships?: Sponsorships; taxCredits?: TaxCredits; taxIncentives?: TaxIncentives;
  opportunityZones?: OpportunityZones; newMarketsTaxCredits?: NewMarketsTaxCredits; carbonCredits?: CarbonCredits;
  licensingRevenue?: LicensingRevenue; royaltyRevenue?: RoyaltyRevenue;
  now?: () => Date; createId?: (prefix: string) => string;
}
