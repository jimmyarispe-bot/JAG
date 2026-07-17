/**
 * Revenue Intelligence — RevenueIntelligenceEngine (Sprint 033).
 *
 * Orchestrates strategy, pricing, offerings, customers, sales, market,
 * and financial margin intelligence into a unified result.
 */

import type {
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
  RevenueForecastComposer as RevenueForecastComposerContract,
  RevenueForecasting as RevenueForecastingContract,
  RevenueGrowthPlanner as RevenueGrowthPlannerContract,
  RevenueHealth as RevenueHealthContract,
  RevenueIntelligence as RevenueIntelligenceContract,
  RevenueIntelligenceEngine as RevenueIntelligenceEngineContract,
  RevenueMixAnalysis as RevenueMixAnalysisContract,
  RevenueOptimization as RevenueOptimizationContract,
  RevenueProjection as RevenueProjectionContract,
  RevenueQueries as RevenueQueriesContract,
  RevenueRepository as RevenueRepositoryContract,
  RevenueRiskAnalysis as RevenueRiskAnalysisContract,
  RevenueScenarioPlanning as RevenueScenarioPlanningContract,
  RevenueSensitivity as RevenueSensitivityContract,
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
import {
  BreakEvenAnalysis,
  CashGenerationAnalysis,
  ContributionMargin,
  GrossMarginAnalysis,
  NetMarginAnalysis,
  RevenueSensitivity,
  UnitEconomics,
} from "@/lib/platform/intelligence/revenue/financial-margin-intelligence";
import {
  CrossSellEngine,
  CustomerLifetimeValue,
  CustomerProfitability,
  ExpansionRevenue,
  RetentionRevenue,
  SegmentProfitability,
  UpsellEngine,
} from "@/lib/platform/intelligence/revenue/customer-revenue-intelligence";
import {
  CompetitorRevenue,
  DemandForecast,
  GeographicExpansion,
  IndustryBenchmarks,
  MarketExpansion,
  OpportunityScoring,
} from "@/lib/platform/intelligence/revenue/market-intelligence";
import {
  ExpansionRecommendations,
  LifecycleAnalysis,
  MarginAnalysis,
  OfferingAnalysis,
  ProductProfitability,
  RetirementRecommendations,
  ServiceProfitability,
} from "@/lib/platform/intelligence/revenue/offering-intelligence";
import {
  CompetitivePricing,
  ContractPricing,
  DiscountOptimization,
  DynamicPricing,
  PriceElasticity,
  PricingEngine,
  ScholarshipPricing,
  SubscriptionPricing,
} from "@/lib/platform/intelligence/revenue/pricing-intelligence";
import {
  ConversionAnalysis,
  PipelineForecast,
  SalesCapacity,
  SalesPerformance,
  TerritoryOptimization,
  WinRateAnalysis,
} from "@/lib/platform/intelligence/revenue/sales-intelligence";
import {
  RecurringRevenueAnalysis,
  RevenueDiversification,
  RevenueForecasting,
  RevenueGrowthPlanner,
  RevenueMixAnalysis,
  RevenueOptimization,
  RevenueRiskAnalysis,
  RevenueScenarioPlanning,
  RevenueStrategyEngine,
} from "@/lib/platform/intelligence/revenue/strategy-intelligence";
import {
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
import {
  RevenueProjection,
  RevenueQueries,
} from "@/lib/platform/intelligence/revenue/projection";
import { RevenueRepositoryStore } from "@/lib/platform/intelligence/revenue/repository";
import {
  defaultPeriodLabel,
  deriveRevenueBaseline,
  emptyRevenueScope,
} from "@/lib/platform/intelligence/revenue/models";
import {
  REVENUE_INTELLIGENCE_VERSION,
  type RevenueRequest,
  type RevenueResult,
} from "@/lib/platform/intelligence/revenue/types";

export type RevenueEngineDependencies = RevenueDependencies;

/**
 * RevenueIntelligenceEngine — core orchestrator for revenue outputs.
 */
export class RevenueIntelligenceEngineImpl
  implements RevenueIntelligenceEngineContract
{
  private readonly revenueIntelligence: RevenueIntelligenceContract;
  private readonly revenueDashboard: RevenueDashboardContract;
  private readonly pricingDashboard: PricingDashboardContract;
  private readonly marginDashboard: MarginDashboardContract;
  private readonly customerValueDashboard: CustomerValueDashboardContract;
  private readonly revenueHealth: RevenueHealthContract;
  private readonly revenueStrategyEngine: RevenueStrategyEngineContract;
  private readonly revenueMixAnalysis: RevenueMixAnalysisContract;
  private readonly revenueDiversification: RevenueDiversificationContract;
  private readonly recurringRevenueAnalysis: RecurringRevenueAnalysisContract;
  private readonly revenueRiskAnalysis: RevenueRiskAnalysisContract;
  private readonly revenueOptimization: RevenueOptimizationContract;
  private readonly revenueGrowthPlanner: RevenueGrowthPlannerContract;
  private readonly revenueForecasting: RevenueForecastingContract;
  private readonly revenueScenarioPlanning: RevenueScenarioPlanningContract;
  private readonly pricingEngine: PricingEngineContract;
  private readonly dynamicPricing: DynamicPricingContract;
  private readonly priceElasticity: PriceElasticityContract;
  private readonly competitivePricing: CompetitivePricingContract;
  private readonly discountOptimization: DiscountOptimizationContract;
  private readonly scholarshipPricing: ScholarshipPricingContract;
  private readonly contractPricing: ContractPricingContract;
  private readonly subscriptionPricing: SubscriptionPricingContract;
  private readonly offeringAnalysis: OfferingAnalysisContract;
  private readonly productProfitability: ProductProfitabilityContract;
  private readonly serviceProfitability: ServiceProfitabilityContract;
  private readonly marginAnalysis: MarginAnalysisContract;
  private readonly lifecycleAnalysis: LifecycleAnalysisContract;
  private readonly expansionRecommendations: ExpansionRecommendationsContract;
  private readonly retirementRecommendations: RetirementRecommendationsContract;
  private readonly customerLifetimeValue: CustomerLifetimeValueContract;
  private readonly retentionRevenue: RetentionRevenueContract;
  private readonly expansionRevenue: ExpansionRevenueContract;
  private readonly crossSellEngine: CrossSellEngineContract;
  private readonly upsellEngine: UpsellEngineContract;
  private readonly customerProfitability: CustomerProfitabilityContract;
  private readonly segmentProfitability: SegmentProfitabilityContract;
  private readonly pipelineForecast: PipelineForecastContract;
  private readonly winRateAnalysis: WinRateAnalysisContract;
  private readonly salesPerformance: SalesPerformanceContract;
  private readonly salesCapacity: SalesCapacityContract;
  private readonly territoryOptimization: TerritoryOptimizationContract;
  private readonly conversionAnalysis: ConversionAnalysisContract;
  private readonly marketExpansion: MarketExpansionContract;
  private readonly competitorRevenue: CompetitorRevenueContract;
  private readonly demandForecast: DemandForecastContract;
  private readonly opportunityScoring: OpportunityScoringContract;
  private readonly geographicExpansion: GeographicExpansionContract;
  private readonly industryBenchmarks: IndustryBenchmarksContract;
  private readonly grossMarginAnalysis: GrossMarginAnalysisContract;
  private readonly netMarginAnalysis: NetMarginAnalysisContract;
  private readonly contributionMargin: ContributionMarginContract;
  private readonly breakEvenAnalysis: BreakEvenAnalysisContract;
  private readonly unitEconomics: UnitEconomicsContract;
  private readonly cashGenerationAnalysis: CashGenerationAnalysisContract;
  private readonly revenueSensitivity: RevenueSensitivityContract;
  private readonly projection: RevenueProjectionContract;
  private readonly briefGenerator: ExecutiveRevenueBriefGeneratorContract;
  private readonly revenueForecastComposer: RevenueForecastComposerContract;
  private readonly expansionOpportunityAggregator: ExpansionOpportunityAggregatorContract;
  private readonly pricingRecommendationAggregator: PricingRecommendationAggregatorContract;
  private readonly repositoryStore: RevenueRepositoryContract;
  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;

  readonly queries: RevenueQueriesContract;

  constructor(dependencies: RevenueEngineDependencies = {}) {
    const now = dependencies.now ?? (() => new Date());
    const createId =
      dependencies.createId ??
      ((prefix) =>
        `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);

    this.now = now;
    this.createId = createId;

    this.revenueIntelligence =
      dependencies.revenueIntelligence ?? new RevenueIntelligence();
    this.revenueDashboard =
      dependencies.revenueDashboard ?? new RevenueDashboard();
    this.pricingDashboard =
      dependencies.pricingDashboard ?? new PricingDashboard();
    this.marginDashboard =
      dependencies.marginDashboard ?? new MarginDashboard();
    this.customerValueDashboard =
      dependencies.customerValueDashboard ?? new CustomerValueDashboard();
    this.revenueHealth = dependencies.revenueHealth ?? new RevenueHealth();
    this.revenueStrategyEngine =
      dependencies.revenueStrategyEngine ??
      new RevenueStrategyEngine({ createId });
    this.revenueMixAnalysis =
      dependencies.revenueMixAnalysis ?? new RevenueMixAnalysis({ createId });
    this.revenueDiversification =
      dependencies.revenueDiversification ?? new RevenueDiversification();
    this.recurringRevenueAnalysis =
      dependencies.recurringRevenueAnalysis ?? new RecurringRevenueAnalysis();
    this.revenueRiskAnalysis =
      dependencies.revenueRiskAnalysis ??
      new RevenueRiskAnalysis({ createId });
    this.revenueOptimization =
      dependencies.revenueOptimization ??
      new RevenueOptimization({ createId });
    this.revenueGrowthPlanner =
      dependencies.revenueGrowthPlanner ??
      new RevenueGrowthPlanner({ createId });
    this.revenueForecasting =
      dependencies.revenueForecasting ?? new RevenueForecasting();
    this.revenueScenarioPlanning =
      dependencies.revenueScenarioPlanning ??
      new RevenueScenarioPlanning({ createId });
    this.pricingEngine =
      dependencies.pricingEngine ?? new PricingEngine({ createId });
    this.dynamicPricing =
      dependencies.dynamicPricing ?? new DynamicPricing({ createId });
    this.priceElasticity =
      dependencies.priceElasticity ?? new PriceElasticity({ createId });
    this.competitivePricing =
      dependencies.competitivePricing ?? new CompetitivePricing({ createId });
    this.discountOptimization =
      dependencies.discountOptimization ??
      new DiscountOptimization({ createId });
    this.scholarshipPricing =
      dependencies.scholarshipPricing ??
      new ScholarshipPricing({ createId });
    this.contractPricing =
      dependencies.contractPricing ?? new ContractPricing({ createId });
    this.subscriptionPricing =
      dependencies.subscriptionPricing ??
      new SubscriptionPricing({ createId });
    this.offeringAnalysis =
      dependencies.offeringAnalysis ?? new OfferingAnalysis({ createId });
    this.productProfitability =
      dependencies.productProfitability ??
      new ProductProfitability({ createId });
    this.serviceProfitability =
      dependencies.serviceProfitability ??
      new ServiceProfitability({ createId });
    this.marginAnalysis =
      dependencies.marginAnalysis ?? new MarginAnalysis();
    this.lifecycleAnalysis =
      dependencies.lifecycleAnalysis ?? new LifecycleAnalysis();
    this.expansionRecommendations =
      dependencies.expansionRecommendations ??
      new ExpansionRecommendations({ createId });
    this.retirementRecommendations =
      dependencies.retirementRecommendations ??
      new RetirementRecommendations({ createId });
    this.customerLifetimeValue =
      dependencies.customerLifetimeValue ??
      new CustomerLifetimeValue({ createId });
    this.retentionRevenue =
      dependencies.retentionRevenue ?? new RetentionRevenue({ createId });
    this.expansionRevenue =
      dependencies.expansionRevenue ?? new ExpansionRevenue({ createId });
    this.crossSellEngine =
      dependencies.crossSellEngine ?? new CrossSellEngine({ createId });
    this.upsellEngine =
      dependencies.upsellEngine ?? new UpsellEngine({ createId });
    this.customerProfitability =
      dependencies.customerProfitability ??
      new CustomerProfitability({ createId });
    this.segmentProfitability =
      dependencies.segmentProfitability ?? new SegmentProfitability();
    this.pipelineForecast =
      dependencies.pipelineForecast ?? new PipelineForecast();
    this.winRateAnalysis =
      dependencies.winRateAnalysis ?? new WinRateAnalysis();
    this.salesPerformance =
      dependencies.salesPerformance ?? new SalesPerformance({ createId });
    this.salesCapacity =
      dependencies.salesCapacity ?? new SalesCapacity();
    this.territoryOptimization =
      dependencies.territoryOptimization ??
      new TerritoryOptimization({ createId });
    this.conversionAnalysis =
      dependencies.conversionAnalysis ?? new ConversionAnalysis();
    this.marketExpansion =
      dependencies.marketExpansion ?? new MarketExpansion({ createId });
    this.competitorRevenue =
      dependencies.competitorRevenue ?? new CompetitorRevenue({ createId });
    this.demandForecast =
      dependencies.demandForecast ?? new DemandForecast();
    this.opportunityScoring =
      dependencies.opportunityScoring ?? new OpportunityScoring({ createId });
    this.geographicExpansion =
      dependencies.geographicExpansion ??
      new GeographicExpansion({ createId });
    this.industryBenchmarks =
      dependencies.industryBenchmarks ??
      new IndustryBenchmarks({ createId });
    this.grossMarginAnalysis =
      dependencies.grossMarginAnalysis ?? new GrossMarginAnalysis();
    this.netMarginAnalysis =
      dependencies.netMarginAnalysis ?? new NetMarginAnalysis();
    this.contributionMargin =
      dependencies.contributionMargin ?? new ContributionMargin();
    this.breakEvenAnalysis =
      dependencies.breakEvenAnalysis ?? new BreakEvenAnalysis();
    this.unitEconomics =
      dependencies.unitEconomics ?? new UnitEconomics();
    this.cashGenerationAnalysis =
      dependencies.cashGenerationAnalysis ?? new CashGenerationAnalysis();
    this.revenueSensitivity =
      dependencies.revenueSensitivity ??
      new RevenueSensitivity({ createId });
    this.projection = dependencies.projection ?? new RevenueProjection();
    this.briefGenerator =
      dependencies.briefGenerator ??
      new ExecutiveRevenueBriefGenerator({ createId });
    this.revenueForecastComposer =
      dependencies.revenueForecastComposer ?? new RevenueForecastComposer();
    this.expansionOpportunityAggregator =
      dependencies.expansionOpportunityAggregator ??
      new ExpansionOpportunityAggregator();
    this.pricingRecommendationAggregator =
      dependencies.pricingRecommendationAggregator ??
      new PricingRecommendationAggregator();
    this.repositoryStore =
      dependencies.repository ?? new RevenueRepositoryStore();
    this.queries = dependencies.queries ?? new RevenueQueries();
  }

  get repository(): RevenueRepositoryContract {
    return this.repositoryStore;
  }

  /** Strategy façade (also composed step-by-step in `build` for DI overrides). */
  get strategyEngine(): RevenueStrategyEngineContract {
    return this.revenueStrategyEngine;
  }

  build(request: RevenueRequest): RevenueResult {
    const now = this.now();
    const scope = request.scope ?? emptyRevenueScope();
    const dna = request.dnaResult?.dna ?? request.dna ?? null;

    // 1. baseline
    const baseline = deriveRevenueBaseline(
      dna,
      request.oiosResult,
      request.analysis,
      request.graphInput,
      request.predictionResult,
      request.financialSignal,
      request.baselineOverrides
    );
    const periodLabel = request.periodLabel ?? defaultPeriodLabel(now);

    // 2. strategy suite (individual modules honor DI)
    const mix = this.revenueMixAnalysis.analyze({ baseline, now });
    const diversification = this.revenueDiversification.analyze({
      mix,
      baseline,
    });
    const recurring = this.recurringRevenueAnalysis.analyze({ baseline });
    const risks = this.revenueRiskAnalysis.analyze({
      baseline,
      diversification,
      recurring,
      now,
    });
    const optimizations = this.revenueOptimization.optimize({
      baseline,
      risks,
      mix,
      now,
    });
    const growthPlans = this.revenueGrowthPlanner.plan({
      baseline,
      optimizations,
      now,
    });
    let forecast = this.revenueForecasting.forecast({
      baseline,
      growthPlans,
      now,
    });
    const scenarios = this.revenueScenarioPlanning.scenarios({
      baseline,
      forecast,
      now,
    });

    // 3–4. offerings then pricing (pricing needs offerings)
    const offerings = this.offeringAnalysis.analyze({ baseline, now });
    const productProfitability = this.productProfitability.analyze({
      offerings,
      baseline,
      now,
    });
    const serviceProfitability = this.serviceProfitability.analyze({
      offerings,
      baseline,
      now,
    });
    const marginAnalysis = this.marginAnalysis.analyze({
      offerings,
      products: productProfitability,
      services: serviceProfitability,
      baseline,
    });
    const lifecycle = this.lifecycleAnalysis.analyze({ offerings, baseline });
    const expansionOpportunitiesRaw = this.expansionRecommendations.recommend({
      offerings,
      baseline,
      now,
    });
    const retirements = this.retirementRecommendations.recommend({
      offerings,
      lifecycle,
      now,
    });

    const pricingRecommendationsRaw = this.pricingEngine.recommend({
      baseline,
      offerings,
      now,
    });
    const dynamicPricing = this.dynamicPricing.adjust({
      baseline,
      offerings,
      now,
    });
    const elasticity = this.priceElasticity.analyze({
      baseline,
      offerings,
      now,
    });
    const competitivePricing = this.competitivePricing.analyze({
      baseline,
      offerings,
      now,
    });
    const discounts = this.discountOptimization.optimize({ baseline, now });
    const scholarships = this.scholarshipPricing.analyze({ baseline, now });
    const contracts = this.contractPricing.analyze({ baseline, now });
    const subscriptions = this.subscriptionPricing.analyze({ baseline, now });

    // 5. customer suite
    const customerLtv = this.customerLifetimeValue.analyze({ baseline, now });
    const retentionRevenue = this.retentionRevenue.analyze({ baseline, now });
    const expansionRevenue = this.expansionRevenue.analyze({ baseline, now });
    const crossSell = this.crossSellEngine.recommend({
      offerings,
      baseline,
      now,
    });
    const upsell = this.upsellEngine.recommend({
      baseline,
      subscriptions,
      now,
    });
    const customerProfitability = this.customerProfitability.analyze({
      baseline,
      now,
    });
    const segmentProfitability = this.segmentProfitability.analyze({
      customers: customerProfitability,
      baseline,
    });

    // 6. sales suite
    const pipeline = this.pipelineForecast.forecast({ baseline, now });
    const winRate = this.winRateAnalysis.analyze({ baseline });
    const salesPerformance = this.salesPerformance.analyze({ baseline, now });
    const salesCapacity = this.salesCapacity.analyze({ baseline });
    const territories = this.territoryOptimization.optimize({ baseline, now });
    const conversion = this.conversionAnalysis.analyze({ baseline, pipeline });

    // 7. market suite
    const marketExpansion = this.marketExpansion.analyze({ baseline, now });
    const competitors = this.competitorRevenue.analyze({ baseline, now });
    const demandForecast = this.demandForecast.forecast({ baseline, now });
    const opportunities = this.opportunityScoring.score({
      baseline,
      marketExpansion,
      now,
    });
    const geographicExpansion = this.geographicExpansion.analyze({
      baseline,
      now,
    });
    const industryBenchmarks = this.industryBenchmarks.analyze({
      baseline,
      now,
    });

    // 8. financial margin suite
    const grossMargin = this.grossMarginAnalysis.analyze({
      baseline,
      marginAnalysis,
    });
    const netMargin = this.netMarginAnalysis.analyze({
      baseline,
      grossMargin,
    });
    const contributionMargin = this.contributionMargin.analyze({
      baseline,
      marginAnalysis,
    });
    const breakEven = this.breakEvenAnalysis.analyze({ baseline });
    const unitEconomics = this.unitEconomics.analyze({ baseline });
    const cashGeneration = this.cashGenerationAnalysis.analyze({ baseline });
    const sensitivity = this.revenueSensitivity.analyze({ baseline, now });

    // Aggregate expansion + pricing + forecast
    const expansionOpportunities =
      this.expansionOpportunityAggregator.aggregate({
        expansions: expansionOpportunitiesRaw,
        marketExpansion,
        opportunities,
      });
    const pricingRecommendations =
      this.pricingRecommendationAggregator.aggregate({
        pricing: pricingRecommendationsRaw,
        dynamic: dynamicPricing,
        discounts,
      });
    forecast = this.revenueForecastComposer.compose({
      forecast,
      demandForecast,
      scenarios,
    });

    // 9. compose scores
    const scores = this.revenueIntelligence.composeScores({
      baseline,
      diversification,
      recurring,
      risks,
      grossMargin,
      growthPlans,
    });
    const revenueHealth = this.revenueHealth.assess({
      baseline,
      scores,
      diversification,
      recurring,
      cashGeneration: cashGeneration,
    });

    // 10. dashboards
    const dashboard = this.revenueDashboard.compose({
      scores,
      baseline,
      now,
    });
    const pricingDashboard = this.pricingDashboard.build({
      recommendations: pricingRecommendations,
      baseline,
      now,
    });
    const marginDashboard = this.marginDashboard.build({
      grossMargin,
      netMargin,
      contributionMargin,
      now,
    });
    const customerValueDashboard = this.customerValueDashboard.build({
      customerLtv,
      baseline,
      recurring,
      now,
    });

    // 11. brief, projection, recommendations, confidence, history
    const confidence = defaultRevenueConfidence(
      baseline,
      Boolean(dna),
      Boolean(request.oiosResult)
    );

    const brief = this.briefGenerator.generate({
      request,
      baseline,
      healthScore: scores.healthScore,
      growthScore: scores.growthScore,
      riskScore: scores.riskScore,
      diversification,
      recurring,
      risks,
      expansionOpportunities,
      confidence,
      now,
    });

    const projection = this.projection.project({
      request,
      healthScore: scores.healthScore,
      growthScore: scores.growthScore,
      riskScore: scores.riskScore,
      forecast,
      expansionOpportunities,
      pricingRecommendations,
      brief,
      confidence,
      dashboard,
      pricingDashboard,
      marginDashboard,
      customerValueDashboard,
      baseline,
    });

    const recommendations = [
      ...optimizations.slice(0, 2).map((o) => o.narrative),
      ...pricingRecommendations.slice(0, 2).map((p) => p.narrative),
      ...expansionOpportunities.slice(0, 2).map((e) => e.narrative),
      scores.riskScore.value >= 45
        ? "Prioritize mitigation for elevated revenue risks while protecting mission funding"
        : "Maintain revenue risk watch cadence and diversification rituals",
      revenueHealth.narrative,
    ];

    const historyRecord = {
      id: this.createId("rev-hist"),
      requestId: request.requestId,
      generatedAt: now.toISOString(),
      status: "generated" as const,
      summary: brief.headline,
      scope,
      confidence,
      scores: {
        health: scores.healthScore.value,
        growth: scores.growthScore.value,
        risk: scores.riskScore.value,
      },
    };

    const result: RevenueResult = {
      requestId: request.requestId,
      version: REVENUE_INTELLIGENCE_VERSION,
      generatedAt: now.toISOString(),
      periodLabel,
      scope,
      baseline,
      healthScore: scores.healthScore,
      growthScore: scores.growthScore,
      riskScore: scores.riskScore,
      revenueHealth,
      dashboard,
      pricingDashboard,
      marginDashboard,
      customerValueDashboard,
      mix,
      diversification,
      recurring,
      risks,
      optimizations,
      growthPlans,
      forecast,
      scenarios,
      pricingRecommendations,
      dynamicPricing,
      elasticity,
      competitivePricing,
      discounts,
      scholarships,
      contracts,
      subscriptions,
      offerings,
      productProfitability,
      serviceProfitability,
      marginAnalysis,
      lifecycle,
      expansionOpportunities,
      retirements,
      customerLtv,
      retentionRevenue,
      expansionRevenue,
      crossSell,
      upsell,
      customerProfitability,
      segmentProfitability,
      pipeline,
      winRate,
      salesPerformance,
      salesCapacity,
      territories,
      conversion,
      marketExpansion,
      competitors,
      demandForecast,
      opportunities,
      geographicExpansion,
      industryBenchmarks,
      grossMargin,
      netMargin,
      contributionMargin,
      breakEven,
      unitEconomics,
      cashGeneration,
      sensitivity,
      brief,
      projection,
      confidence,
      historyRecord,
      recommendations,
    };

    // 12. save repository
    this.repositoryStore.save(result);
    this.repositoryStore.saveHistory(historyRecord);
    return result;
  }
}

/** Aliases matching Sprint naming. */
export { RevenueIntelligenceEngineImpl as RevenueIntelligenceEngine };
export { RevenueIntelligenceEngineImpl as RevenueEngine };
export { RevenueIntelligenceEngineImpl as RevenueEngineImpl };
