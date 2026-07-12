/**
 * Revenue Intelligence — contracts / interfaces only (Sprint 033).
 *
 * Leaf module: no imports from engine implementations (avoids cycles).
 */

import type {
  BreakEvenAnalysisResult,
  CashGenerationAnalysisResult,
  CompetitorRevenueRecord,
  CompetitivePricingRecord,
  ContractPricingRecord,
  ContributionMarginResult,
  ConversionAnalysisResult,
  CrossSellRecord,
  CustomerLtvRecord,
  CustomerProfitabilityRecord,
  CustomerValueDashboardResult,
  DemandForecastResult,
  DiscountOptimizationRecord,
  DiversificationAnalysisResult,
  DynamicPricingRecord,
  ExecutiveRevenueBrief,
  ExpansionRecommendation,
  ExpansionRevenueRecord,
  GeographicExpansionRecord,
  GrossMarginAnalysisResult,
  GraphScope,
  IndustryBenchmarkRecord,
  LifecycleAnalysisResult,
  MarginAnalysisResult,
  MarginDashboardResult,
  MarketExpansionRecord,
  NetMarginAnalysisResult,
  OfferingRecord,
  OpportunityScoreRecord,
  PipelineForecastResult,
  PriceElasticityRecord,
  PricingDashboardResult,
  PricingRecommendation,
  ProductProfitabilityRecord,
  RecurringRevenueAnalysisResult,
  RetentionRevenueRecord,
  RetirementRecommendation,
  RevenueBaseline,
  RevenueConfidenceScore,
  RevenueDashboardResult,
  RevenueForecastPoint,
  RevenueGrowthPlan,
  RevenueHealthResult,
  RevenueHistoryRecord,
  RevenueMixRecord,
  RevenueOptimizationRecord,
  RevenueProjectionResult,
  RevenueQueryRequest,
  RevenueQueryResult,
  RevenueRecommendationRecord,
  RevenueRequest,
  RevenueResult,
  RevenueRiskRecord,
  RevenueScenarioPlan,
  RevenueScore,
  RevenueSensitivityRecord,
  SalesCapacityResult,
  SalesPerformanceRecord,
  ScholarshipPricingRecord,
  SegmentProfitabilityResult,
  ServiceProfitabilityRecord,
  SubscriptionPricingRecord,
  TerritoryOptimizationRecord,
  UnitEconomicsResult,
  UpsellRecord,
  WinRateAnalysisResult,
} from "@/lib/platform/intelligence/revenue/types";

/** Core orchestration engine. */
export interface RevenueIntelligenceEngine {
  build(request: RevenueRequest): RevenueResult;
}

/** Alias matching Sprint naming for the core engine. */
export type RevenueEngine = RevenueIntelligenceEngine;

/** Revenue intelligence composer (scores + dashboards + health). */
export interface RevenueIntelligence {
  composeScores(input: {
    baseline: RevenueBaseline;
    diversification: DiversificationAnalysisResult;
    recurring: RecurringRevenueAnalysisResult;
    risks: RevenueRiskRecord[];
    grossMargin: GrossMarginAnalysisResult;
    growthPlans: RevenueGrowthPlan[];
  }): {
    healthScore: RevenueScore;
    growthScore: RevenueScore;
    riskScore: RevenueScore;
  };
  buildHealth(input: {
    baseline: RevenueBaseline;
    scores: {
      healthScore: RevenueScore;
      growthScore: RevenueScore;
      riskScore: RevenueScore;
    };
    diversification: DiversificationAnalysisResult;
    recurring: RecurringRevenueAnalysisResult;
    cashGeneration: CashGenerationAnalysisResult;
  }): RevenueHealthResult;
}

export interface RevenueDashboard {
  compose(input: {
    scores: {
      healthScore: RevenueScore;
      growthScore: RevenueScore;
      riskScore: RevenueScore;
    };
    baseline: RevenueBaseline;
    now: Date;
  }): RevenueDashboardResult;
}

export interface PricingDashboard {
  build(input: {
    recommendations: PricingRecommendation[];
    baseline: RevenueBaseline;
    now: Date;
  }): PricingDashboardResult;
}

export interface MarginDashboard {
  build(input: {
    grossMargin: GrossMarginAnalysisResult;
    netMargin: NetMarginAnalysisResult;
    contributionMargin: ContributionMarginResult;
    now: Date;
  }): MarginDashboardResult;
}

export interface CustomerValueDashboard {
  build(input: {
    customerLtv: CustomerLtvRecord[];
    baseline: RevenueBaseline;
    recurring: RecurringRevenueAnalysisResult;
    now: Date;
  }): CustomerValueDashboardResult;
}

export interface RevenueHealth {
  assess(input: {
    baseline: RevenueBaseline;
    scores: {
      healthScore: RevenueScore;
      growthScore: RevenueScore;
      riskScore: RevenueScore;
    };
    diversification: DiversificationAnalysisResult;
    recurring: RecurringRevenueAnalysisResult;
    cashGeneration: CashGenerationAnalysisResult;
  }): RevenueHealthResult;
}

/* -------------------------------------------------------------------------- */
/* Strategy                                                                    */
/* -------------------------------------------------------------------------- */

export interface RevenueMixAnalysis {
  analyze(input: {
    baseline: RevenueBaseline;
    now: Date;
  }): RevenueMixRecord[];
}

export interface RevenueDiversification {
  analyze(input: {
    mix: RevenueMixRecord[];
    baseline: RevenueBaseline;
  }): DiversificationAnalysisResult;
}

export interface RecurringRevenueAnalysis {
  analyze(input: {
    baseline: RevenueBaseline;
  }): RecurringRevenueAnalysisResult;
}

export interface RevenueRiskAnalysis {
  analyze(input: {
    baseline: RevenueBaseline;
    diversification: DiversificationAnalysisResult;
    recurring: RecurringRevenueAnalysisResult;
    now: Date;
  }): RevenueRiskRecord[];
}

export interface RevenueOptimization {
  optimize(input: {
    baseline: RevenueBaseline;
    risks: RevenueRiskRecord[];
    mix: RevenueMixRecord[];
    now: Date;
  }): RevenueOptimizationRecord[];
}

export interface RevenueGrowthPlanner {
  plan(input: {
    baseline: RevenueBaseline;
    optimizations: RevenueOptimizationRecord[];
    now: Date;
  }): RevenueGrowthPlan[];
}

export interface RevenueForecasting {
  forecast(input: {
    baseline: RevenueBaseline;
    growthPlans: RevenueGrowthPlan[];
    now: Date;
  }): RevenueForecastPoint[];
}

export interface RevenueScenarioPlanning {
  scenarios(input: {
    baseline: RevenueBaseline;
    forecast: RevenueForecastPoint[];
    now: Date;
  }): RevenueScenarioPlan[];
}

export interface RevenueStrategyEngine {
  run(input: {
    baseline: RevenueBaseline;
    now: Date;
  }): {
    mix: RevenueMixRecord[];
    diversification: DiversificationAnalysisResult;
    recurring: RecurringRevenueAnalysisResult;
    risks: RevenueRiskRecord[];
    optimizations: RevenueOptimizationRecord[];
    growthPlans: RevenueGrowthPlan[];
    forecast: RevenueForecastPoint[];
    scenarios: RevenueScenarioPlan[];
  };
}

/* -------------------------------------------------------------------------- */
/* Pricing                                                                     */
/* -------------------------------------------------------------------------- */

export interface PricingEngine {
  recommend(input: {
    baseline: RevenueBaseline;
    offerings: OfferingRecord[];
    now: Date;
  }): PricingRecommendation[];
}

export interface DynamicPricing {
  adjust(input: {
    baseline: RevenueBaseline;
    offerings: OfferingRecord[];
    now: Date;
  }): DynamicPricingRecord[];
}

export interface PriceElasticity {
  analyze(input: {
    baseline: RevenueBaseline;
    offerings: OfferingRecord[];
    now: Date;
  }): PriceElasticityRecord[];
}

export interface CompetitivePricing {
  analyze(input: {
    baseline: RevenueBaseline;
    offerings: OfferingRecord[];
    now: Date;
  }): CompetitivePricingRecord[];
}

export interface DiscountOptimization {
  optimize(input: {
    baseline: RevenueBaseline;
    now: Date;
  }): DiscountOptimizationRecord[];
}

export interface ScholarshipPricing {
  analyze(input: {
    baseline: RevenueBaseline;
    now: Date;
  }): ScholarshipPricingRecord[];
}

export interface ContractPricing {
  analyze(input: {
    baseline: RevenueBaseline;
    now: Date;
  }): ContractPricingRecord[];
}

export interface SubscriptionPricing {
  analyze(input: {
    baseline: RevenueBaseline;
    now: Date;
  }): SubscriptionPricingRecord[];
}

/* -------------------------------------------------------------------------- */
/* Offerings                                                                   */
/* -------------------------------------------------------------------------- */

export interface OfferingAnalysis {
  analyze(input: {
    baseline: RevenueBaseline;
    now: Date;
  }): OfferingRecord[];
}

export interface ProductProfitability {
  analyze(input: {
    offerings: OfferingRecord[];
    baseline: RevenueBaseline;
    now: Date;
  }): ProductProfitabilityRecord[];
}

export interface ServiceProfitability {
  analyze(input: {
    offerings: OfferingRecord[];
    baseline: RevenueBaseline;
    now: Date;
  }): ServiceProfitabilityRecord[];
}

export interface MarginAnalysis {
  analyze(input: {
    offerings: OfferingRecord[];
    products: ProductProfitabilityRecord[];
    services: ServiceProfitabilityRecord[];
    baseline: RevenueBaseline;
  }): MarginAnalysisResult;
}

export interface LifecycleAnalysis {
  analyze(input: {
    offerings: OfferingRecord[];
    baseline: RevenueBaseline;
  }): LifecycleAnalysisResult;
}

export interface ExpansionRecommendations {
  recommend(input: {
    offerings: OfferingRecord[];
    baseline: RevenueBaseline;
    now: Date;
  }): ExpansionRecommendation[];
}

export interface RetirementRecommendations {
  recommend(input: {
    offerings: OfferingRecord[];
    lifecycle: LifecycleAnalysisResult;
    now: Date;
  }): RetirementRecommendation[];
}

/* -------------------------------------------------------------------------- */
/* Customers                                                                   */
/* -------------------------------------------------------------------------- */

export interface CustomerLifetimeValue {
  analyze(input: {
    baseline: RevenueBaseline;
    now: Date;
  }): CustomerLtvRecord[];
}

export interface RetentionRevenue {
  analyze(input: {
    baseline: RevenueBaseline;
    now: Date;
  }): RetentionRevenueRecord[];
}

export interface ExpansionRevenue {
  analyze(input: {
    baseline: RevenueBaseline;
    now: Date;
  }): ExpansionRevenueRecord[];
}

export interface CrossSellEngine {
  recommend(input: {
    offerings: OfferingRecord[];
    baseline: RevenueBaseline;
    now: Date;
  }): CrossSellRecord[];
}

export interface UpsellEngine {
  recommend(input: {
    baseline: RevenueBaseline;
    subscriptions: SubscriptionPricingRecord[];
    now: Date;
  }): UpsellRecord[];
}

export interface CustomerProfitability {
  analyze(input: {
    baseline: RevenueBaseline;
    now: Date;
  }): CustomerProfitabilityRecord[];
}

export interface SegmentProfitability {
  analyze(input: {
    customers: CustomerProfitabilityRecord[];
    baseline: RevenueBaseline;
  }): SegmentProfitabilityResult;
}

/* -------------------------------------------------------------------------- */
/* Sales                                                                       */
/* -------------------------------------------------------------------------- */

export interface PipelineForecast {
  forecast(input: {
    baseline: RevenueBaseline;
    now: Date;
  }): PipelineForecastResult;
}

export interface WinRateAnalysis {
  analyze(input: {
    baseline: RevenueBaseline;
  }): WinRateAnalysisResult;
}

export interface SalesPerformance {
  analyze(input: {
    baseline: RevenueBaseline;
    now: Date;
  }): SalesPerformanceRecord[];
}

export interface SalesCapacity {
  analyze(input: {
    baseline: RevenueBaseline;
  }): SalesCapacityResult;
}

export interface TerritoryOptimization {
  optimize(input: {
    baseline: RevenueBaseline;
    now: Date;
  }): TerritoryOptimizationRecord[];
}

export interface ConversionAnalysis {
  analyze(input: {
    baseline: RevenueBaseline;
    pipeline: PipelineForecastResult;
  }): ConversionAnalysisResult;
}

/* -------------------------------------------------------------------------- */
/* Market                                                                      */
/* -------------------------------------------------------------------------- */

export interface MarketExpansion {
  analyze(input: {
    baseline: RevenueBaseline;
    now: Date;
  }): MarketExpansionRecord[];
}

export interface CompetitorRevenue {
  analyze(input: {
    baseline: RevenueBaseline;
    now: Date;
  }): CompetitorRevenueRecord[];
}

export interface DemandForecast {
  forecast(input: {
    baseline: RevenueBaseline;
    now: Date;
  }): DemandForecastResult;
}

export interface OpportunityScoring {
  score(input: {
    baseline: RevenueBaseline;
    marketExpansion: MarketExpansionRecord[];
    now: Date;
  }): OpportunityScoreRecord[];
}

export interface GeographicExpansion {
  analyze(input: {
    baseline: RevenueBaseline;
    now: Date;
  }): GeographicExpansionRecord[];
}

export interface IndustryBenchmarks {
  analyze(input: {
    baseline: RevenueBaseline;
    now: Date;
  }): IndustryBenchmarkRecord[];
}

/* -------------------------------------------------------------------------- */
/* Financial / margins                                                         */
/* -------------------------------------------------------------------------- */

export interface GrossMarginAnalysis {
  analyze(input: {
    baseline: RevenueBaseline;
    marginAnalysis: MarginAnalysisResult;
  }): GrossMarginAnalysisResult;
}

export interface NetMarginAnalysis {
  analyze(input: {
    baseline: RevenueBaseline;
    grossMargin: GrossMarginAnalysisResult;
  }): NetMarginAnalysisResult;
}

export interface ContributionMargin {
  analyze(input: {
    baseline: RevenueBaseline;
    marginAnalysis: MarginAnalysisResult;
  }): ContributionMarginResult;
}

export interface BreakEvenAnalysis {
  analyze(input: {
    baseline: RevenueBaseline;
  }): BreakEvenAnalysisResult;
}

export interface UnitEconomics {
  analyze(input: {
    baseline: RevenueBaseline;
  }): UnitEconomicsResult;
}

export interface CashGenerationAnalysis {
  analyze(input: {
    baseline: RevenueBaseline;
  }): CashGenerationAnalysisResult;
}

export interface RevenueSensitivity {
  analyze(input: {
    baseline: RevenueBaseline;
    now: Date;
  }): RevenueSensitivityRecord[];
}

/* -------------------------------------------------------------------------- */
/* Outputs                                                                     */
/* -------------------------------------------------------------------------- */

export interface RevenueProjection {
  project(input: {
    request: RevenueRequest;
    healthScore: RevenueScore;
    growthScore: RevenueScore;
    riskScore: RevenueScore;
    forecast: RevenueForecastPoint[];
    expansionOpportunities: ExpansionRecommendation[];
    pricingRecommendations: PricingRecommendation[];
    brief: ExecutiveRevenueBrief;
    confidence: RevenueConfidenceScore;
    dashboard: RevenueDashboardResult;
    pricingDashboard: PricingDashboardResult;
    marginDashboard: MarginDashboardResult;
    customerValueDashboard: CustomerValueDashboardResult;
    baseline: RevenueBaseline;
  }): RevenueProjectionResult;
}

export interface RevenueQueries {
  ask(
    result: RevenueResult,
    request: RevenueQueryRequest
  ): RevenueQueryResult;
}

export interface ExecutiveRevenueBriefGenerator {
  generate(input: {
    request: RevenueRequest;
    baseline: RevenueBaseline;
    healthScore: RevenueScore;
    growthScore: RevenueScore;
    riskScore: RevenueScore;
    diversification: DiversificationAnalysisResult;
    recurring: RecurringRevenueAnalysisResult;
    risks: RevenueRiskRecord[];
    expansionOpportunities: ExpansionRecommendation[];
    confidence: RevenueConfidenceScore;
    now: Date;
  }): ExecutiveRevenueBrief;
}

export interface RevenueForecastComposer {
  compose(input: {
    forecast: RevenueForecastPoint[];
    demandForecast: DemandForecastResult;
    scenarios: RevenueScenarioPlan[];
  }): RevenueForecastPoint[];
}

export interface ExpansionOpportunityAggregator {
  aggregate(input: {
    expansions: ExpansionRecommendation[];
    marketExpansion: MarketExpansionRecord[];
    opportunities: OpportunityScoreRecord[];
  }): ExpansionRecommendation[];
}

export interface PricingRecommendationAggregator {
  aggregate(input: {
    pricing: PricingRecommendation[];
    dynamic: DynamicPricingRecord[];
    discounts: DiscountOptimizationRecord[];
  }): PricingRecommendation[];
}

/** Repository */
export interface RevenueRepository {
  save(result: RevenueResult): RevenueResult;
  get(requestId: string): RevenueResult | null;
  list(scope?: Partial<GraphScope>): RevenueResult[];
  remove(requestId: string): boolean;
  saveHistory(record: RevenueHistoryRecord): RevenueHistoryRecord;
  listHistory(scope?: Partial<GraphScope>): RevenueHistoryRecord[];
  clear(): void;
}

/** Public service façade */
export interface RevenueIntelligenceService {
  build(request: RevenueRequest): RevenueResult;
  query(
    result: RevenueResult,
    request: RevenueQueryRequest
  ): RevenueQueryResult;
  repository(): RevenueRepository;
}

/** Alias matching Sprint naming. */
export type RevenueService = RevenueIntelligenceService;

/** DI bag for the full Revenue Intelligence stack. */
export interface RevenueDependencies {
  engine?: RevenueIntelligenceEngine;
  revenueIntelligence?: RevenueIntelligence;
  revenueDashboard?: RevenueDashboard;
  pricingDashboard?: PricingDashboard;
  marginDashboard?: MarginDashboard;
  customerValueDashboard?: CustomerValueDashboard;
  revenueHealth?: RevenueHealth;
  revenueStrategyEngine?: RevenueStrategyEngine;
  revenueMixAnalysis?: RevenueMixAnalysis;
  revenueDiversification?: RevenueDiversification;
  recurringRevenueAnalysis?: RecurringRevenueAnalysis;
  revenueRiskAnalysis?: RevenueRiskAnalysis;
  revenueOptimization?: RevenueOptimization;
  revenueGrowthPlanner?: RevenueGrowthPlanner;
  revenueForecasting?: RevenueForecasting;
  revenueScenarioPlanning?: RevenueScenarioPlanning;
  pricingEngine?: PricingEngine;
  dynamicPricing?: DynamicPricing;
  priceElasticity?: PriceElasticity;
  competitivePricing?: CompetitivePricing;
  discountOptimization?: DiscountOptimization;
  scholarshipPricing?: ScholarshipPricing;
  contractPricing?: ContractPricing;
  subscriptionPricing?: SubscriptionPricing;
  offeringAnalysis?: OfferingAnalysis;
  productProfitability?: ProductProfitability;
  serviceProfitability?: ServiceProfitability;
  marginAnalysis?: MarginAnalysis;
  lifecycleAnalysis?: LifecycleAnalysis;
  expansionRecommendations?: ExpansionRecommendations;
  retirementRecommendations?: RetirementRecommendations;
  customerLifetimeValue?: CustomerLifetimeValue;
  retentionRevenue?: RetentionRevenue;
  expansionRevenue?: ExpansionRevenue;
  crossSellEngine?: CrossSellEngine;
  upsellEngine?: UpsellEngine;
  customerProfitability?: CustomerProfitability;
  segmentProfitability?: SegmentProfitability;
  pipelineForecast?: PipelineForecast;
  winRateAnalysis?: WinRateAnalysis;
  salesPerformance?: SalesPerformance;
  salesCapacity?: SalesCapacity;
  territoryOptimization?: TerritoryOptimization;
  conversionAnalysis?: ConversionAnalysis;
  marketExpansion?: MarketExpansion;
  competitorRevenue?: CompetitorRevenue;
  demandForecast?: DemandForecast;
  opportunityScoring?: OpportunityScoring;
  geographicExpansion?: GeographicExpansion;
  industryBenchmarks?: IndustryBenchmarks;
  grossMarginAnalysis?: GrossMarginAnalysis;
  netMarginAnalysis?: NetMarginAnalysis;
  contributionMargin?: ContributionMargin;
  breakEvenAnalysis?: BreakEvenAnalysis;
  unitEconomics?: UnitEconomics;
  cashGenerationAnalysis?: CashGenerationAnalysis;
  revenueSensitivity?: RevenueSensitivity;
  projection?: RevenueProjection;
  queries?: RevenueQueries;
  briefGenerator?: ExecutiveRevenueBriefGenerator;
  revenueForecastComposer?: RevenueForecastComposer;
  expansionOpportunityAggregator?: ExpansionOpportunityAggregator;
  pricingRecommendationAggregator?: PricingRecommendationAggregator;
  repository?: RevenueRepository;
  now?: () => Date;
  createId?: (prefix: string) => string;
}

/** Re-export recommendation type for consumers of contracts. */
export type { RevenueRecommendationRecord };
