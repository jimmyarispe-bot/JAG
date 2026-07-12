/**
 * Revenue Intelligence — public API (Sprint 033).
 *
 * Sustainable revenue, profitability, mission impact, revenue risk, and
 * long-term financial health — composed on Organizational DNA + OIOS Core.
 */

export {
  REVENUE_INTELLIGENCE_VERSION,
  OFFERING_LIFECYCLE_STAGES,
  PRICING_MODEL_KINDS,
  REVENUE_ARTIFACT_STATUSES,
  REVENUE_CONFIDENCE_LEVELS,
  REVENUE_HEALTH_STATUSES,
  REVENUE_PRIORITY_BANDS,
  SALES_PIPELINE_STAGES,
  type BreakEvenAnalysisResult,
  type CashGenerationAnalysisResult,
  type CompetitorRevenueRecord,
  type CompetitivePricingRecord,
  type ContractPricingRecord,
  type ContributionMarginResult,
  type ConversionAnalysisResult,
  type CrossSellRecord,
  type CustomerLtvRecord,
  type CustomerProfitabilityRecord,
  type CustomerValueDashboardResult,
  type DemandForecastPoint,
  type DemandForecastResult,
  type DiscountOptimizationRecord,
  type DiversificationAnalysisResult,
  type DynamicPricingRecord,
  type ExecutiveRevenueBrief,
  type ExpansionRecommendation,
  type ExpansionRevenueRecord,
  type FinancialSignal,
  type GeographicExpansionRecord,
  type GraphScope,
  type GrossMarginAnalysisResult,
  type HumanCapitalResultLight,
  type IndustryBenchmarkRecord,
  type LifecycleAnalysisResult,
  type MarginAnalysisResult,
  type MarginDashboardResult,
  type MarketExpansionRecord,
  type NetMarginAnalysisResult,
  type OfferingLifecycleStage,
  type OfferingRecord,
  type OpportunityScoreRecord,
  type PipelineForecastResult,
  type PriceElasticityRecord,
  type PricingDashboardResult,
  type PricingModelKind,
  type PricingRecommendation,
  type ProductProfitabilityRecord,
  type RecurringRevenueAnalysisResult,
  type RetentionRevenueRecord,
  type RetirementRecommendation,
  type RevenueArtifactStatus,
  type RevenueBaseline,
  type RevenueConfidenceLevel,
  type RevenueConfidenceScore,
  type RevenueDashboardResult,
  type RevenueForecastPoint,
  type RevenueGrowthPlan,
  type RevenueHealthResult,
  type RevenueHealthStatus,
  type RevenueHistoryRecord,
  type RevenueLensImpact,
  type RevenueMetadata,
  type RevenueMixRecord,
  type RevenueOptimizationRecord,
  type RevenuePriorityBand,
  type RevenueProjectionResult,
  type RevenueQueryRequest,
  type RevenueQueryResult,
  type RevenueRecommendationRecord,
  type RevenueRequest,
  type RevenueResult,
  type RevenueRiskRecord,
  type RevenueScenarioPlan,
  type RevenueScore,
  type RevenueSensitivityRecord,
  type SalesCapacityResult,
  type SalesPerformanceRecord,
  type SalesPipelineStage,
  type ScholarshipPricingRecord,
  type SegmentProfitabilityResult,
  type ServiceProfitabilityRecord,
  type SubscriptionPricingRecord,
  type TerritoryOptimizationRecord,
  type UnitEconomicsResult,
  type UpsellRecord,
  type WinRateAnalysisResult,
} from "@/lib/platform/intelligence/revenue/types";

export type {
  BreakEvenAnalysis as BreakEvenAnalysisContract,
  CashGenerationAnalysis as CashGenerationAnalysisContract,
  CompetitorRevenue as CompetitorRevenueContract,
  CompetitivePricing as CompetitivePricingContract,
  ContractPricing as ContractPricingContract,
  ContributionMargin as ContributionMarginContract,
  ConversionAnalysis as ConversionAnalysisContract,
  CrossSellEngine as CrossSellEngineContract,
  CustomerLifetimeValue as CustomerLifetimeValueContract,
  CustomerProfitability as CustomerProfitabilityContract,
  CustomerValueDashboard as CustomerValueDashboardContract,
  DemandForecast as DemandForecastContract,
  DiscountOptimization as DiscountOptimizationContract,
  DynamicPricing as DynamicPricingContract,
  ExecutiveRevenueBriefGenerator as ExecutiveRevenueBriefGeneratorContract,
  ExpansionOpportunityAggregator as ExpansionOpportunityAggregatorContract,
  ExpansionRecommendations as ExpansionRecommendationsContract,
  ExpansionRevenue as ExpansionRevenueContract,
  GeographicExpansion as GeographicExpansionContract,
  GrossMarginAnalysis as GrossMarginAnalysisContract,
  IndustryBenchmarks as IndustryBenchmarksContract,
  LifecycleAnalysis as LifecycleAnalysisContract,
  MarginAnalysis as MarginAnalysisContract,
  MarginDashboard as MarginDashboardContract,
  MarketExpansion as MarketExpansionContract,
  NetMarginAnalysis as NetMarginAnalysisContract,
  OfferingAnalysis as OfferingAnalysisContract,
  OpportunityScoring as OpportunityScoringContract,
  PipelineForecast as PipelineForecastContract,
  PriceElasticity as PriceElasticityContract,
  PricingDashboard as PricingDashboardContract,
  PricingEngine as PricingEngineContract,
  PricingRecommendationAggregator as PricingRecommendationAggregatorContract,
  ProductProfitability as ProductProfitabilityContract,
  RecurringRevenueAnalysis as RecurringRevenueAnalysisContract,
  RetentionRevenue as RetentionRevenueContract,
  RetirementRecommendations as RetirementRecommendationsContract,
  RevenueDashboard as RevenueDashboardContract,
  RevenueDependencies,
  RevenueDiversification as RevenueDiversificationContract,
  RevenueEngine as RevenueEngineContract,
  RevenueForecastComposer as RevenueForecastComposerContract,
  RevenueForecasting as RevenueForecastingContract,
  RevenueGrowthPlanner as RevenueGrowthPlannerContract,
  RevenueHealth as RevenueHealthContract,
  RevenueIntelligence as RevenueIntelligenceContract,
  RevenueIntelligenceEngine as RevenueIntelligenceEngineContract,
  RevenueIntelligenceService as RevenueIntelligenceServiceContract,
  RevenueMixAnalysis as RevenueMixAnalysisContract,
  RevenueOptimization as RevenueOptimizationContract,
  RevenueProjection as RevenueProjectionContract,
  RevenueQueries as RevenueQueriesContract,
  RevenueRepository as RevenueRepositoryContract,
  RevenueRiskAnalysis as RevenueRiskAnalysisContract,
  RevenueScenarioPlanning as RevenueScenarioPlanningContract,
  RevenueSensitivity as RevenueSensitivityContract,
  RevenueService as RevenueServiceContract,
  RevenueStrategyEngine as RevenueStrategyEngineContract,
  SalesCapacity as SalesCapacityContract,
  SalesPerformance as SalesPerformanceContract,
  ScholarshipPricing as ScholarshipPricingContract,
  SegmentProfitability as SegmentProfitabilityContract,
  ServiceProfitability as ServiceProfitabilityContract,
  SubscriptionPricing as SubscriptionPricingContract,
  TerritoryOptimization as TerritoryOptimizationContract,
  UnitEconomics as UnitEconomicsContract,
  UpsellEngine as UpsellEngineContract,
  WinRateAnalysis as WinRateAnalysisContract,
} from "@/lib/platform/intelligence/revenue/contracts";

export {
  buildConfidence,
  buildLenses,
  clamp,
  clamp01,
  defaultCreateId,
  defaultPeriodLabel,
  defaultRevenueBaseline,
  deriveRevenueBaseline,
  emptyRevenueScope,
  levelFromValue,
  priorityFromRisk,
  priorityFromScore,
  revenueModels,
  scoreNarrative,
  statusFromScore,
} from "@/lib/platform/intelligence/revenue/models";

export {
  RecurringRevenueAnalysis,
  RevenueDiversification,
  RevenueForecasting,
  RevenueGrowthPlanner,
  RevenueMixAnalysis,
  RevenueOptimization,
  RevenueRiskAnalysis,
  RevenueScenarioPlanning,
  RevenueStrategyEngine,
  StrategyRevenueEngine,
} from "@/lib/platform/intelligence/revenue/strategy-intelligence";

export {
  CompetitivePricing,
  ContractPricing,
  DiscountOptimization,
  DynamicPricing,
  PriceElasticity,
  PricingEngine,
  ScholarshipPricing,
  SubscriptionPricing,
} from "@/lib/platform/intelligence/revenue/pricing-intelligence";

export {
  ExpansionRecommendations,
  LifecycleAnalysis,
  MarginAnalysis,
  OfferingAnalysis,
  ProductProfitability,
  RetirementRecommendations,
  ServiceProfitability,
} from "@/lib/platform/intelligence/revenue/offering-intelligence";

export {
  CrossSellEngine,
  CustomerLifetimeValue,
  CustomerProfitability,
  ExpansionRevenue,
  RetentionRevenue,
  SegmentProfitability,
  UpsellEngine,
} from "@/lib/platform/intelligence/revenue/customer-revenue-intelligence";

export {
  ConversionAnalysis,
  PipelineForecast,
  SalesCapacity,
  SalesPerformance,
  TerritoryOptimization,
  WinRateAnalysis,
} from "@/lib/platform/intelligence/revenue/sales-intelligence";

export {
  CompetitorRevenue,
  DemandForecast,
  GeographicExpansion,
  IndustryBenchmarks,
  MarketExpansion,
  OpportunityScoring,
} from "@/lib/platform/intelligence/revenue/market-intelligence";

export {
  BreakEvenAnalysis,
  CashGenerationAnalysis,
  ContributionMargin,
  GrossMarginAnalysis,
  NetMarginAnalysis,
  RevenueSensitivity,
  UnitEconomics,
} from "@/lib/platform/intelligence/revenue/financial-margin-intelligence";

export {
  CustomerValueDashboard,
  defaultRevenueConfidence,
  ExecutiveRevenueBriefGenerator,
  ExpansionOpportunityAggregator,
  MarginDashboard,
  PricingDashboard,
  PricingRecommendationAggregator,
  RevenueDashboard,
  RevenueForecastComposer,
  RevenueHealth,
  RevenueIntelligence,
} from "@/lib/platform/intelligence/revenue/revenue-intelligence";

export {
  RevenueProjection,
  RevenueQueries,
} from "@/lib/platform/intelligence/revenue/projection";

export {
  RevenueRepository,
  RevenueRepositoryStore,
} from "@/lib/platform/intelligence/revenue/repository";

export {
  RevenueEngine,
  RevenueEngineImpl,
  RevenueIntelligenceEngine,
  RevenueIntelligenceEngineImpl,
} from "@/lib/platform/intelligence/revenue/revenue-engine";

export {
  RevenueIntelligenceService,
  RevenueIntelligenceServiceImpl,
  RevenueService,
  RevenueServiceImpl,
} from "@/lib/platform/intelligence/revenue/service";

import { RevenueIntelligenceEngine } from "@/lib/platform/intelligence/revenue/revenue-engine";
import type { RevenueDependencies } from "@/lib/platform/intelligence/revenue/contracts";
import { RevenueIntelligenceService } from "@/lib/platform/intelligence/revenue/service";
import {
  createOiosOperatingSystem,
  type CreateOiosOptions,
  type OiosStack,
} from "@/lib/platform/oios";
import {
  createOrganizationDnaIntelligence,
  type CreateOrganizationDnaOptions,
  type OrganizationDnaStack,
} from "@/lib/platform/intelligence/organization-dna";

/** Wired Revenue Intelligence stack. */
export interface RevenueStack {
  service: RevenueIntelligenceService;
  engine: RevenueIntelligenceEngine;
  organizationDna: OrganizationDnaStack | null;
  oios: OiosStack | null;
}

export interface CreateRevenueOptions extends RevenueDependencies {
  /** Attach / create Organizational DNA stack. */
  organizationDna?: OrganizationDnaStack;
  organizationDnaOptions?: CreateOrganizationDnaOptions;
  /** When true (default), auto-wire createOrganizationDnaIntelligence if not provided. */
  wireOrganizationDna?: boolean;
  /** Attach / create OIOS Core stack. */
  oios?: OiosStack;
  oiosOptions?: CreateOiosOptions;
  /** When true (default), auto-wire createOiosOperatingSystem if not provided. */
  wireOios?: boolean;
}

/**
 * Create a fully wired Revenue Intelligence stack (DI entry point).
 */
export function createRevenueIntelligence(
  options: CreateRevenueOptions = {}
): RevenueStack {
  const wireDna = options.wireOrganizationDna !== false;
  const wireOios = options.wireOios !== false;

  const organizationDna =
    options.organizationDna ??
    (wireDna
      ? createOrganizationDnaIntelligence({
          ...(options.organizationDnaOptions ?? {}),
          wireGraphAnalyzer: false,
          wireDecision: false,
          wirePredictive: false,
          wireBoardGovernance: false,
        })
      : null);

  const oios =
    options.oios ??
    (wireOios
      ? createOiosOperatingSystem({
          ...(options.oiosOptions ?? {}),
          organizationDnaStack:
            options.oiosOptions?.organizationDnaStack ??
            organizationDna ??
            undefined,
          wireOrganizationDna: false,
        })
      : null);

  const engine = new RevenueIntelligenceEngine(options);
  const service = new RevenueIntelligenceService({
    ...options,
    engine,
  });

  return {
    service,
    engine,
    organizationDna,
    oios,
  };
}
