/**
 * Funding Intelligence shared DTOs (Sprint 034).
 * Leaf module: types only; never imports package implementations.
 */
import type { OrganizationDnaResult, OrganizationDNA } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type { Graph, GraphAnalysisResult, GraphBuildInput, GraphScope } from "@/lib/platform/intelligence/executive-graph/types";
import type { ExecutiveDecisionResult } from "@/lib/platform/intelligence/executive-decision/types";
import type { PredictionResult } from "@/lib/platform/intelligence/predictive-intelligence/types";
import type { GovernanceResult } from "@/lib/platform/intelligence/board-governance/types";

export const FUNDING_INTELLIGENCE_VERSION = "0.1.0";
export type FundingMetadata = Record<string, unknown>;
export type { GraphScope };

export const FUNDING_CONFIDENCE_LEVELS = ["high", "medium", "low", "unknown"] as const;
export type FundingConfidenceLevel = (typeof FUNDING_CONFIDENCE_LEVELS)[number];
export const FUNDING_PRIORITY_BANDS = ["critical", "high", "medium", "low", "monitor"] as const;
export type FundingPriorityBand = (typeof FUNDING_PRIORITY_BANDS)[number];
export const FUNDING_HEALTH_STATUSES = ["excellent", "healthy", "warning", "critical"] as const;
export type FundingHealthStatus = (typeof FUNDING_HEALTH_STATUSES)[number];
export const FUNDING_ARTIFACT_STATUSES = ["draft", "generated", "reviewed", "distributed", "archived", "superseded"] as const;
export type FundingArtifactStatus = (typeof FUNDING_ARTIFACT_STATUSES)[number];
export const FUNDING_SOURCE_KINDS = ["government", "grant", "contract", "philanthropy", "investment", "alternative"] as const;
export type FundingSourceKind = (typeof FUNDING_SOURCE_KINDS)[number];
export const GRANT_PIPELINE_STAGES = ["discovered", "qualified", "planned", "drafting", "submitted", "awarded", "declined", "renewal"] as const;
export type GrantPipelineStage = (typeof GRANT_PIPELINE_STAGES)[number];
export const ORGANIZATION_ELIGIBILITY_KINDS = ["nonprofit", "for_profit", "startup", "school", "healthcare", "government", "municipality", "university", "church", "foundation", "international"] as const;
export type OrganizationEligibilityKind = (typeof ORGANIZATION_ELIGIBILITY_KINDS)[number];

export interface FundingLensImpact {
  availableFunding: string;
  diversification: string;
  fundingRisk: string;
  sustainability: string;
  missionImpact: string;
}
export interface FundingConfidenceScore {
  value: number;
  level: FundingConfidenceLevel;
  factors: Array<{ key: string; label: string; contribution: number }>;
}
export interface FundingScore {
  key: string;
  label: string;
  value: number;
  status: FundingHealthStatus;
  band: FundingPriorityBand;
  narrative: string;
}
export interface FundingBaseline {
  annualFundingNeed: number;
  securedFunding: number;
  pipelineFunding: number;
  grantWinRate: number;
  diversificationIndex: number;
  concentrationRisk: number;
  cashRunwayMonths: number;
  restrictedShare: number;
  unrestrictedShare: number;
  governmentShare: number;
  philanthropyShare: number;
  investmentShare: number;
  contractShare: number;
  alternativeShare: number;
  complianceReadiness: number;
  proposalCapacity: number;
  organizationHealthScore: number;
  financialScore: number;
  revenueHealthProxy: number;
}
export interface FinancialSignal { revenue: number; expenses: number; marginPct: number; cash?: number; }
export type RevenueResultLight = { healthScore?: { value?: number }; riskScore?: { value?: number }; baseline?: { annualRevenue?: number; diversificationIndex?: number }; recommendations?: string[] } & Record<string, unknown>;
export type HumanCapitalResultLight = { requestId?: string; workforceHealthScore?: { value?: number }; recommendations?: string[] } & Record<string, unknown>;
export interface FundingRecommendationRecord {
  id: string; title: string; priority: FundingPriorityBand; score: number;
  rationale: string; expectedFunding: number; lenses: FundingLensImpact; narrative: string;
}

export interface FundingRecordBase {
  id: string;
  name: string;
  amount: number;
  score: number;
  priority: FundingPriorityBand;
  deadline?: string;
  eligibility: OrganizationEligibilityKind[];
  lenses: FundingLensImpact;
  narrative: string;
}
export interface FederalFundingRecord extends FundingRecordBase { agency: string; assistanceListing: string; }
export interface StateFundingRecord extends FundingRecordBase { state: string; program: string; }
export interface CountyFundingRecord extends FundingRecordBase { county: string; program: string; }
export interface CityFundingRecord extends FundingRecordBase { city: string; program: string; }
export interface EducationFundingRecord extends FundingRecordBase { educationLevel: string; }
export interface HealthcareFundingRecord extends FundingRecordBase { healthFocus: string; }
export interface InfrastructureFundingRecord extends FundingRecordBase { infrastructureType: string; }
export interface EconomicDevelopmentFundingRecord extends FundingRecordBase { developmentGoal: string; }
export interface DisasterFundingRecord extends FundingRecordBase { disasterPhase: string; }
export interface ResearchFundingRecord extends FundingRecordBase { researchArea: string; }

export interface GrantOpportunityRecord extends FundingRecordBase { funder: string; stage: GrantPipelineStage; matchRequiredPct: number; }
export interface GrantMatchRecord extends FundingRecordBase { opportunityId: string; missionFit: number; eligibilityFit: number; }
export interface GrantScoreRecord extends FundingRecordBase { opportunityId: string; probability: number; effortScore: number; }
export interface GrantCalendarEvent { id: string; opportunityId: string; title: string; date: string; stage: GrantPipelineStage; priority: FundingPriorityBand; }
export interface GrantForecastPoint { period: string; submitted: number; weightedAwards: number; expectedAwards: number; }
export interface GrantRequirementRecord extends FundingRecordBase { opportunityId: string; requirements: string[]; readiness: number; }
export interface GrantComplianceRecord extends FundingRecordBase { awardId: string; obligations: string[]; readiness: number; }
export interface GrantReportingRecord extends FundingRecordBase { awardId: string; reportsDue: number; nextReportDate: string; }
export interface GrantRenewalRecord extends FundingRecordBase { awardId: string; renewalProbability: number; renewalDate: string; }
export interface GrantPipelineResult {
  opportunities: GrantOpportunityRecord[]; matches: GrantMatchRecord[]; scores: GrantScoreRecord[];
  calendar: GrantCalendarEvent[]; forecast: GrantForecastPoint[]; requirements: GrantRequirementRecord[];
  compliance: GrantComplianceRecord[]; reporting: GrantReportingRecord[]; renewals: GrantRenewalRecord[];
  totalPipeline: number; weightedPipeline: number; lenses: FundingLensImpact; narrative: string;
}

export interface GovernmentContractRecord extends FundingRecordBase { agency: string; contractVehicle: string; }
export interface CorporateContractRecord extends FundingRecordBase { corporation: string; serviceCategory: string; }
export interface RfpOpportunityRecord extends FundingRecordBase { issuer: string; rfpNumber: string; }
export interface BidScoreRecord extends FundingRecordBase { opportunityId: string; winProbability: number; }
export interface ProposalOptimizationRecord extends FundingRecordBase { opportunityId: string; actions: string[]; }
export interface ContractForecastResult { totalPipeline: number; weightedPipeline: number; expectedAwards: number; records: GovernmentContractRecord[]; lenses: FundingLensImpact; narrative: string; }

export interface FoundationMatchRecord extends FundingRecordBase { foundationType: "private" | "family" | "community"; missionFit: number; }
export interface MajorDonorInsightRecord extends FundingRecordBase { segment: string; engagementScore: number; }
export interface CorporateGivingRecord extends FundingRecordBase { corporation: string; givingProgram: string; }
export interface FamilyFoundationRecord extends FundingRecordBase { family: string; relationshipStrength: number; }
export interface CommunityFoundationRecord extends FundingRecordBase { geography: string; communityFit: number; }
export interface CapitalCampaignPlan extends FundingRecordBase { goal: number; durationMonths: number; phases: string[]; }

export interface AngelInvestorRecord extends FundingRecordBase { sectorFit: number; checkSize: number; }
export interface VentureCapitalRecord extends FundingRecordBase { stage: string; thesisFit: number; }
export interface PrivateEquityRecord extends FundingRecordBase { strategy: string; controlPreference: boolean; }
export interface StrategicInvestorRecord extends FundingRecordBase { strategicValue: string; }
export interface DebtFinancingRecord extends FundingRecordBase { interestRate: number; termMonths: number; }
export interface RevenueBasedFinancingRecord extends FundingRecordBase { revenueSharePct: number; repaymentCap: number; }

export interface CrowdfundingRecord extends FundingRecordBase { platform: string; backerGoal: number; }
export interface SponsorshipRecord extends FundingRecordBase { sponsorCategory: string; benefits: string[]; }
export interface TaxCreditRecord extends FundingRecordBase { jurisdiction: string; creditRate: number; }
export interface TaxIncentiveRecord extends FundingRecordBase { jurisdiction: string; incentiveType: string; }
export interface OpportunityZoneRecord extends FundingRecordBase { zone: string; investmentTermYears: number; }
export interface NewMarketsTaxCreditRecord extends FundingRecordBase { allocationRound: string; creditPct: number; }
export interface CarbonCreditRecord extends FundingRecordBase { tonnes: number; pricePerTonne: number; }
export interface LicensingRevenueRecord extends FundingRecordBase { asset: string; royaltyRate: number; }
export interface RoyaltyRevenueRecord extends FundingRecordBase { asset: string; royaltyRate: number; }

export interface FundingMixRecord { id: string; source: FundingSourceKind; amount: number; sharePct: number; targetSharePct: number; priority: FundingPriorityBand; lenses: FundingLensImpact; narrative: string; }
export interface FundingDiversificationResult { index: number; status: FundingHealthStatus; mix: FundingMixRecord[]; concentrationRisk: number; recommendations: string[]; lenses: FundingLensImpact; narrative: string; }
export interface FundingRiskRecord { id: string; title: string; score: number; band: FundingPriorityBand; drivers: string[]; mitigations: string[]; lenses: FundingLensImpact; narrative: string; }
export interface FundingScenarioPlan { id: string; name: string; fundingDelta: number; runwayDeltaMonths: number; risk: FundingPriorityBand; actions: string[]; lenses: FundingLensImpact; narrative: string; }
export interface CashRunwayResult { months: number; monthlyBurn: number; fundingGap: number; status: FundingHealthStatus; lenses: FundingLensImpact; narrative: string; }
export interface CapitalPlanResult { capitalNeed: number; secured: number; gap: number; milestones: string[]; sources: FundingMixRecord[]; lenses: FundingLensImpact; narrative: string; }
export interface FundingMixOptimizationResult { current: FundingMixRecord[]; recommended: FundingMixRecord[]; expectedRiskReduction: number; expectedFundingIncrease: number; lenses: FundingLensImpact; narrative: string; }

export interface TopOpportunityRecord extends FundingRecordBase { source: FundingSourceKind; sourceId: string; }
export interface ProposalPriorityRecord extends FundingRecordBase { source: FundingSourceKind; sourceId: string; effort: number; probability: number; }
export interface FundingDashboardResult { generatedAt: string; healthScore: number; opportunityScore: number; riskScore: number; fundingGap: number; status: FundingHealthStatus; headline: string; narrative: string; }
export interface GrantPipelineDashboardResult { generatedAt: string; opportunityCount: number; totalPipeline: number; weightedPipeline: number; winRate: number; status: FundingHealthStatus; narrative: string; }
export interface CapitalStrategyDashboardResult { generatedAt: string; capitalNeed: number; secured: number; gap: number; runwayMonths: number; status: FundingHealthStatus; narrative: string; }
export interface FundingDiversificationDashboardResult { generatedAt: string; index: number; concentrationRisk: number; sourceCount: number; status: FundingHealthStatus; narrative: string; }
export interface FundingRiskDashboardResult { generatedAt: string; riskScore: number; criticalRisks: number; risks: FundingRiskRecord[]; status: FundingHealthStatus; narrative: string; }
export interface FundingCalendarResult { generatedAt: string; events: GrantCalendarEvent[]; nextDeadline: string | null; narrative: string; }
export interface FundingOpportunityScore { opportunityId: string; score: number; probability: number; priority: FundingPriorityBand; lenses: FundingLensImpact; narrative: string; }
export interface FundingHealthResult { overallScore: number; status: FundingHealthStatus; dimensions: { coverage: number; diversification: number; runway: number; compliance: number; capacity: number }; lenses: FundingLensImpact; narrative: string; }
export interface ExecutiveFundingBrief { id: string; title: string; generatedAt: string; periodLabel: string; headline: string; fundingSummary: string; opportunitySummary: string; riskSummary: string; sustainabilitySummary: string; missionSummary: string; decisionsNeeded: string[]; watchItems: string[]; confidence: FundingConfidenceScore; }
export interface FundingProjectionResult { generatedAt: string; headline: string; healthScore: number; opportunityScore: number; riskScore: number; forecast: GrantForecastPoint[]; topOpportunities: TopOpportunityRecord[]; brief: ExecutiveFundingBrief; dashboard: FundingDashboardResult; metrics: { annualFundingNeed: number; securedFunding: number; pipelineFunding: number; cashRunwayMonths: number; diversificationIndex: number }; overallConfidence: FundingConfidenceScore; }

export interface FundingQueryRequest { question: string; focus?: "general" | "government" | "grants" | "contracts" | "philanthropy" | "investment" | "alternative" | "strategy" | "forecast" | "risk"; maxResults?: number; }
export interface FundingQueryResult { question: string; focus: NonNullable<FundingQueryRequest["focus"]>; answer: string; references: string[]; confidence: FundingConfidenceScore; }
export interface FundingHistoryRecord { id: string; requestId: string; generatedAt: string; status: FundingArtifactStatus; summary: string; scope: GraphScope; confidence: FundingConfidenceScore; scores: { health: number; opportunity: number; risk: number }; }

export interface FundingRequest {
  requestId: string; question?: string; periodLabel?: string; scope?: GraphScope;
  dnaResult?: OrganizationDnaResult; dna?: OrganizationDNA; oiosResult?: OiosResult;
  graph?: Graph; analysis?: GraphAnalysisResult; graphInput?: GraphBuildInput;
  decisionResult?: ExecutiveDecisionResult; predictionResult?: PredictionResult;
  governanceResult?: GovernanceResult; humanCapitalResult?: HumanCapitalResultLight;
  revenueResult?: RevenueResultLight; financialSignal?: FinancialSignal;
  baselineOverrides?: Partial<FundingBaseline>; metadata?: FundingMetadata;
}

export interface FundingResult {
  requestId: string; version: string; generatedAt: string; periodLabel: string; scope: GraphScope; baseline: FundingBaseline;
  federalFunding: FederalFundingRecord[]; stateFunding: StateFundingRecord[]; countyFunding: CountyFundingRecord[]; cityFunding: CityFundingRecord[];
  educationFunding: EducationFundingRecord[]; healthcareFunding: HealthcareFundingRecord[]; infrastructureFunding: InfrastructureFundingRecord[];
  economicDevelopmentFunding: EconomicDevelopmentFundingRecord[]; disasterFunding: DisasterFundingRecord[]; researchFunding: ResearchFundingRecord[];
  grantPipeline: GrantPipelineResult;
  governmentContracts: GovernmentContractRecord[]; corporateContracts: CorporateContractRecord[]; rfpOpportunities: RfpOpportunityRecord[];
  bidScores: BidScoreRecord[]; proposalOptimizations: ProposalOptimizationRecord[]; contractForecast: ContractForecastResult;
  foundationMatches: FoundationMatchRecord[]; majorDonorInsights: MajorDonorInsightRecord[]; corporateGiving: CorporateGivingRecord[];
  familyFoundations: FamilyFoundationRecord[]; communityFoundations: CommunityFoundationRecord[]; capitalCampaigns: CapitalCampaignPlan[];
  angelInvestors: AngelInvestorRecord[]; ventureCapital: VentureCapitalRecord[]; privateEquity: PrivateEquityRecord[];
  strategicInvestors: StrategicInvestorRecord[]; debtFinancing: DebtFinancingRecord[]; revenueBasedFinancing: RevenueBasedFinancingRecord[];
  crowdfunding: CrowdfundingRecord[]; sponsorships: SponsorshipRecord[]; taxCredits: TaxCreditRecord[]; taxIncentives: TaxIncentiveRecord[];
  opportunityZones: OpportunityZoneRecord[]; newMarketsTaxCredits: NewMarketsTaxCreditRecord[]; carbonCredits: CarbonCreditRecord[];
  licensingRevenue: LicensingRevenueRecord[]; royaltyRevenue: RoyaltyRevenueRecord[];
  mix: FundingMixRecord[]; mixOptimization: FundingMixOptimizationResult; diversification: FundingDiversificationResult; risks: FundingRiskRecord[];
  scenarios: FundingScenarioPlan[]; runway: CashRunwayResult; capitalPlan: CapitalPlanResult;
  topOpportunities: TopOpportunityRecord[]; proposalPriorities: ProposalPriorityRecord[];
  healthScore: FundingScore; opportunityScore: FundingScore; riskScore: FundingScore; fundingHealth: FundingHealthResult;
  dashboard: FundingDashboardResult; grantPipelineDashboard: GrantPipelineDashboardResult; capitalStrategyDashboard: CapitalStrategyDashboardResult;
  diversificationDashboard: FundingDiversificationDashboardResult; riskDashboard: FundingRiskDashboardResult; calendar: FundingCalendarResult;
  brief: ExecutiveFundingBrief; projection: FundingProjectionResult; confidence: FundingConfidenceScore;
  historyRecord: FundingHistoryRecord; recommendations: string[];
}
