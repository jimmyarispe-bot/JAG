/** Opportunity Intelligence contracts (Sprint 035). Leaf module: implementation-free. */
import type * as T from "@/lib/platform/intelligence/opportunity/types";

export interface OpportunityIntelligenceEngine {
  build(request: T.OpportunityRequest): T.OpportunityResult;
}
export type OpportunityEngine = OpportunityIntelligenceEngine;

export interface OpportunityIntelligenceService {
  build(request: T.OpportunityRequest): T.OpportunityResult;
  query(result: T.OpportunityResult, request: T.OpportunityQueryRequest): T.OpportunityQueryResult;
  repository(): OpportunityRepository;
}
export type OpportunityService = OpportunityIntelligenceService;

export interface OpportunityRepository {
  save(result: T.OpportunityResult): T.OpportunityResult;
  get(requestId: string): T.OpportunityResult | null;
  list(scope?: Partial<T.GraphScope>): T.OpportunityResult[];
  remove(requestId: string): boolean;
  saveHistory(record: T.OpportunityHistoryRecord): T.OpportunityHistoryRecord;
  listHistory(scope?: Partial<T.GraphScope>): T.OpportunityHistoryRecord[];
  clear(): void;
}

export type BaselineInput = { baseline: T.OpportunityBaseline; now: Date };

export interface CategoryAnalyzer {
  analyze(input: BaselineInput): T.CategoryOpportunityRecord[];
}

export interface RevenueOpportunities extends CategoryAnalyzer {}
export interface FundingOpportunities extends CategoryAnalyzer {}
export interface CostReductionOpportunities extends CategoryAnalyzer {}
export interface PricingOpportunities extends CategoryAnalyzer {}
export interface MarketExpansionOpportunities extends CategoryAnalyzer {}
export interface GeographicExpansionOpportunities extends CategoryAnalyzer {}
export interface CustomerGrowthOpportunities extends CategoryAnalyzer {}
export interface RetentionOpportunities extends CategoryAnalyzer {}
export interface PartnershipOpportunities extends CategoryAnalyzer {}
export interface StrategicAllianceOpportunities extends CategoryAnalyzer {}
export interface AcquisitionOpportunities extends CategoryAnalyzer {}
export interface MergerOpportunities extends CategoryAnalyzer {}
export interface TechnologyOpportunities extends CategoryAnalyzer {}
export interface AutomationOpportunities extends CategoryAnalyzer {}
export interface VendorOptimizationOpportunities extends CategoryAnalyzer {}
export interface ProcurementSavingsOpportunities extends CategoryAnalyzer {}
export interface RealEstateOpportunities extends CategoryAnalyzer {}
export interface AssetOptimizationOpportunities extends CategoryAnalyzer {}
export interface LicensingOpportunities extends CategoryAnalyzer {}
export interface IntellectualPropertyOpportunities extends CategoryAnalyzer {}
export interface InnovationOpportunities extends CategoryAnalyzer {}
export interface MissionImpactOpportunities extends CategoryAnalyzer {}

export interface OpportunityCategoryEngine {
  discover(input: BaselineInput): Record<T.OpportunityCategory, T.CategoryOpportunityRecord[]>;
}

export interface OpportunityScoring {
  score(input: BaselineInput & { records: T.OpportunityExchangeRecord[] }): T.OpportunityExchangeRecord[];
}
export interface ROIAnalysis {
  analyze(input: BaselineInput & { records: T.OpportunityExchangeRecord[] }): T.OpportunityAnalysisResult["roi"];
}
export interface ImpactAnalysis {
  analyze(input: BaselineInput & { records: T.OpportunityExchangeRecord[] }): T.OpportunityAnalysisResult["impact"];
}
export interface RiskAnalysis {
  analyze(input: BaselineInput & { records: T.OpportunityExchangeRecord[] }): T.OpportunityAnalysisResult["risk"];
}
export interface ConfidenceScoring {
  score(input: BaselineInput & { records: T.OpportunityExchangeRecord[] }): T.OpportunityAnalysisResult["confidence"];
}
export interface DependencyAnalysis {
  analyze(input: BaselineInput & { records: T.OpportunityExchangeRecord[] }): T.OpportunityAnalysisResult["dependencies"];
}
export interface ResourceRequirements {
  analyze(input: BaselineInput & { records: T.OpportunityExchangeRecord[] }): T.OpportunityAnalysisResult["resources"];
}
export interface TimeToValueAnalysis {
  analyze(input: BaselineInput & { records: T.OpportunityExchangeRecord[] }): T.OpportunityAnalysisResult["timeToValue"];
}
export interface StrategicAlignment {
  analyze(input: BaselineInput & { records: T.OpportunityExchangeRecord[]; dnaAlignment?: T.OpportunityDnaAlignment }): T.OpportunityAnalysisResult["strategicAlignment"];
}
export interface OpportunityAnalysisEngine {
  analyze(input: BaselineInput & { records: T.OpportunityExchangeRecord[]; dnaAlignment?: T.OpportunityDnaAlignment }): T.OpportunityAnalysisResult;
}

export interface OpportunityRankingEngine {
  rank(input: { records: T.OpportunityExchangeRecord[]; lens: T.OpportunityRankingLens }): T.OpportunityRankingResult;
  rankAll(input: { records: T.OpportunityExchangeRecord[] }): T.OpportunityRankingResult[];
}

export interface OpportunityExchange {
  publish(record: Omit<T.OpportunityExchangeRecord, "publishedAt"> & { publishedAt?: string }, now?: Date): T.OpportunityExchangeRecord;
  publishMany(records: Array<Omit<T.OpportunityExchangeRecord, "publishedAt"> & { publishedAt?: string }>, now?: Date): T.OpportunityExchangeRecord[];
  list(filter?: { category?: T.OpportunityCategory; domain?: T.OpportunityOriginatingDomain }): T.OpportunityExchangeRecord[];
  clear(): void;
  toExchangeRecords(input: {
    categories: Record<T.OpportunityCategory, T.CategoryOpportunityRecord[]>;
    published?: T.OpportunityExchangeRecord[];
    now: Date;
    dnaAlignment: T.OpportunityDnaAlignment;
  }): T.OpportunityExchangeRecord[];
}

export interface OpportunityRegistry {
  register(domain: T.OpportunityOriginatingDomain, capability: string): void;
  list(): Array<{ domain: T.OpportunityOriginatingDomain; capability: string }>;
  isRegistered(domain: T.OpportunityOriginatingDomain): boolean;
  clear(): void;
}

export interface OpportunityIntelligence {
  composeScores(input: {
    baseline: T.OpportunityBaseline;
    exchange: T.OpportunityExchangeRecord[];
    analysis: T.OpportunityAnalysisResult;
  }): { healthScore: T.OpportunityScore; opportunityScore: T.OpportunityScore; riskScore: T.OpportunityScore };
}
export interface OpportunityHealth {
  assess(input: {
    baseline: T.OpportunityBaseline;
    scores: { healthScore: T.OpportunityScore; opportunityScore: T.OpportunityScore; riskScore: T.OpportunityScore };
    exchange: T.OpportunityExchangeRecord[];
  }): T.OpportunityHealthResult;
}
export interface OpportunityDashboard {
  compose(input: {
    baseline: T.OpportunityBaseline;
    scores: { healthScore: T.OpportunityScore; opportunityScore: T.OpportunityScore; riskScore: T.OpportunityScore };
    exchange: T.OpportunityExchangeRecord[];
    rankings: T.OpportunityRankingResult[];
    now: Date;
  }): T.OpportunityDashboardResult;
}
export interface TopOpportunitiesDashboard {
  build(input: { opportunities: T.OpportunityExchangeRecord[]; now: Date }): T.TopOpportunitiesDashboardResult;
}
export interface QuickWinsDashboard {
  build(input: { rankings: T.OpportunityRankingResult[]; now: Date }): T.QuickWinsDashboardResult;
}
export interface StrategicInvestmentDashboard {
  build(input: { rankings: T.OpportunityRankingResult[]; now: Date }): T.StrategicInvestmentDashboardResult;
}
export interface MissionOpportunityDashboard {
  build(input: { rankings: T.OpportunityRankingResult[]; now: Date }): T.MissionOpportunityDashboardResult;
}
export interface OpportunityHeatMap {
  compose(input: { exchange: T.OpportunityExchangeRecord[]; rankings: T.OpportunityRankingResult[]; now: Date }): T.OpportunityHeatMapResult;
}
export interface OpportunityPipelineComposer {
  compose(input: { records: T.OpportunityExchangeRecord[] }): T.OpportunityPipelineResult;
}
export interface ExecutiveOpportunityBriefGenerator {
  generate(input: {
    request: T.OpportunityRequest;
    baseline: T.OpportunityBaseline;
    scores: { healthScore: T.OpportunityScore; opportunityScore: T.OpportunityScore; riskScore: T.OpportunityScore };
    topOpportunities: T.OpportunityExchangeRecord[];
    rankings: T.OpportunityRankingResult[];
    analysis: T.OpportunityAnalysisResult;
    confidence: T.OpportunityConfidenceScore;
    now: Date;
  }): T.ExecutiveOpportunityBrief;
}
export interface OpportunityProjection {
  project(input: {
    baseline: T.OpportunityBaseline;
    scores: { healthScore: T.OpportunityScore; opportunityScore: T.OpportunityScore; riskScore: T.OpportunityScore };
    pipeline: T.OpportunityPipelineResult;
    topOpportunities: T.OpportunityExchangeRecord[];
    brief: T.ExecutiveOpportunityBrief;
    dashboard: T.OpportunityDashboardResult;
    confidence: T.OpportunityConfidenceScore;
  }): T.OpportunityProjectionResult;
}
export interface OpportunityQueries {
  ask(result: T.OpportunityResult, request: T.OpportunityQueryRequest): T.OpportunityQueryResult;
}

export interface OpportunityDependencies {
  engine?: OpportunityIntelligenceEngine;
  repository?: OpportunityRepository;
  queries?: OpportunityQueries;
  opportunityIntelligence?: OpportunityIntelligence;
  opportunityHealth?: OpportunityHealth;
  opportunityDashboard?: OpportunityDashboard;
  topOpportunitiesDashboard?: TopOpportunitiesDashboard;
  quickWinsDashboard?: QuickWinsDashboard;
  strategicInvestmentDashboard?: StrategicInvestmentDashboard;
  missionOpportunityDashboard?: MissionOpportunityDashboard;
  heatMap?: OpportunityHeatMap;
  pipelineComposer?: OpportunityPipelineComposer;
  briefGenerator?: ExecutiveOpportunityBriefGenerator;
  projection?: OpportunityProjection;
  categoryEngine?: OpportunityCategoryEngine;
  analysisEngine?: OpportunityAnalysisEngine;
  rankingEngine?: OpportunityRankingEngine;
  exchange?: OpportunityExchange;
  registry?: OpportunityRegistry;
  revenueOpportunities?: RevenueOpportunities;
  fundingOpportunities?: FundingOpportunities;
  costReductionOpportunities?: CostReductionOpportunities;
  pricingOpportunities?: PricingOpportunities;
  marketExpansionOpportunities?: MarketExpansionOpportunities;
  geographicExpansionOpportunities?: GeographicExpansionOpportunities;
  customerGrowthOpportunities?: CustomerGrowthOpportunities;
  retentionOpportunities?: RetentionOpportunities;
  partnershipOpportunities?: PartnershipOpportunities;
  strategicAllianceOpportunities?: StrategicAllianceOpportunities;
  acquisitionOpportunities?: AcquisitionOpportunities;
  mergerOpportunities?: MergerOpportunities;
  technologyOpportunities?: TechnologyOpportunities;
  automationOpportunities?: AutomationOpportunities;
  vendorOptimizationOpportunities?: VendorOptimizationOpportunities;
  procurementSavingsOpportunities?: ProcurementSavingsOpportunities;
  realEstateOpportunities?: RealEstateOpportunities;
  assetOptimizationOpportunities?: AssetOptimizationOpportunities;
  licensingOpportunities?: LicensingOpportunities;
  intellectualPropertyOpportunities?: IntellectualPropertyOpportunities;
  innovationOpportunities?: InnovationOpportunities;
  missionImpactOpportunities?: MissionImpactOpportunities;
  opportunityScoring?: OpportunityScoring;
  roiAnalysis?: ROIAnalysis;
  impactAnalysis?: ImpactAnalysis;
  riskAnalysis?: RiskAnalysis;
  confidenceScoring?: ConfidenceScoring;
  dependencyAnalysis?: DependencyAnalysis;
  resourceRequirements?: ResourceRequirements;
  timeToValueAnalysis?: TimeToValueAnalysis;
  strategicAlignment?: StrategicAlignment;
  now?: () => Date;
  createId?: (prefix: string) => string;
}
