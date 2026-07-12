/**
 * Market Intelligence Engine — Sprint 043 orchestrator.
 */

import type {
  CompetitiveIntelligence as CompetitiveIntelligenceContract,
  CustomerDemandIntelligence as CustomerDemandIntelligenceContract,
  DemographicIntelligence as DemographicIntelligenceContract,
  EconomicTrendIntelligence as EconomicTrendIntelligenceContract,
  ExecutiveMarketBriefGenerator as ExecutiveMarketBriefGeneratorContract,
  GeographicExpansionIntelligence as GeographicExpansionIntelligenceContract,
  IndustryIntelligence as IndustryIntelligenceContract,
  MarketDashboard as MarketDashboardContract,
  MarketDependencies,
  MarketEngine as MarketEngineContract,
  MarketHealth as MarketHealthContract,
  MarketIntelligence as MarketIntelligenceContract,
  MarketKnowledgeContributionEngine as MarketKnowledgeContributionEngineContract,
  MarketOpportunityAnalyzer as MarketOpportunityAnalyzerContract,
  MarketProjection as MarketProjectionContract,
  MarketQueries as MarketQueriesContract,
  MarketReasoner as MarketReasonerContract,
  MarketRecommendationComposer as MarketRecommendationComposerContract,
  MarketRegistry as MarketRegistryContract,
  MarketRepository as MarketRepositoryContract,
  MarketRiskAnalyzer as MarketRiskAnalyzerContract,
  MarketSizeIntelligence as MarketSizeIntelligenceContract,
  MarketSpecializedDashboards as MarketSpecializedDashboardsContract,
  MergersAcquisitionsIntelligence as MergersAcquisitionsIntelligenceContract,
  PartnershipIntelligence as PartnershipIntelligenceContract,
  PricingIntelligence as PricingIntelligenceContract,
  TechnologyTrendIntelligence as TechnologyTrendIntelligenceContract,
  WhiteSpaceIntelligence as WhiteSpaceIntelligenceContract,
} from "@/lib/platform/intelligence/market/contracts";
import { CompetitiveIntelligence } from "@/lib/platform/intelligence/market/competitive-intelligence";
import { CustomerDemandIntelligence } from "@/lib/platform/intelligence/market/customer-demand-intelligence";
import { DemographicIntelligence } from "@/lib/platform/intelligence/market/demographic-intelligence";
import { EconomicTrendIntelligence } from "@/lib/platform/intelligence/market/economic-trend-intelligence";
import { GeographicExpansionIntelligence } from "@/lib/platform/intelligence/market/geographic-expansion-intelligence";
import { IndustryIntelligence } from "@/lib/platform/intelligence/market/industry-intelligence";
import { MarketKnowledgeContributionEngine } from "@/lib/platform/intelligence/market/knowledge-contribution";
import { MarketReasoner } from "@/lib/platform/intelligence/market/market-reasoner";
import { MarketRegistryStore } from "@/lib/platform/intelligence/market/market-registry";
import { MarketSizeIntelligence } from "@/lib/platform/intelligence/market/market-size-intelligence";
import { MergersAcquisitionsIntelligence } from "@/lib/platform/intelligence/market/mergers-acquisitions-intelligence";
import { PartnershipIntelligence } from "@/lib/platform/intelligence/market/partnership-intelligence";
import { PricingIntelligence } from "@/lib/platform/intelligence/market/pricing-intelligence";
import { TechnologyTrendIntelligence } from "@/lib/platform/intelligence/market/technology-trend-intelligence";
import { WhiteSpaceIntelligence } from "@/lib/platform/intelligence/market/white-space-intelligence";
import {
  composeMarketSignals,
  defaultMarketConfidence,
  ExecutiveMarketBriefGenerator,
  MarketDashboard,
  MarketHealth,
  MarketIntelligence,
  MarketOpportunityAnalyzer,
  MarketRecommendationComposer,
  MarketRiskAnalyzer,
  MarketSpecializedDashboards,
} from "@/lib/platform/intelligence/market/market-intelligence";
import {
  MarketProjection,
  MarketQueries,
} from "@/lib/platform/intelligence/market/projection";
import { MarketRepositoryStore } from "@/lib/platform/intelligence/market/repository";
import {
  defaultCreateId,
  defaultPeriodLabel,
  deriveMarketBaseline,
  emptyMarketScope,
} from "@/lib/platform/intelligence/market/models";
import {
  MARKET_INTELLIGENCE_VERSION,
  type MarketRequest,
  type MarketResult,
  type PredictiveResultLight,
} from "@/lib/platform/intelligence/market/types";

export interface MarketEngineDependencies extends MarketDependencies {}

export class MarketIntelligenceEngineImpl implements MarketEngineContract {
  private readonly industryIntelligence: IndustryIntelligenceContract;
  private readonly competitiveIntelligence: CompetitiveIntelligenceContract;
  private readonly marketSizeIntelligence: MarketSizeIntelligenceContract;
  private readonly pricingIntelligence: PricingIntelligenceContract;
  private readonly customerDemandIntelligence: CustomerDemandIntelligenceContract;
  private readonly demographicIntelligence: DemographicIntelligenceContract;
  private readonly geographicExpansionIntelligence: GeographicExpansionIntelligenceContract;
  private readonly economicTrendIntelligence: EconomicTrendIntelligenceContract;
  private readonly technologyTrendIntelligence: TechnologyTrendIntelligenceContract;
  private readonly partnershipIntelligence: PartnershipIntelligenceContract;
  private readonly mergersAcquisitionsIntelligence: MergersAcquisitionsIntelligenceContract;
  private readonly whiteSpaceIntelligence: WhiteSpaceIntelligenceContract;
  private readonly reasoner: MarketReasonerContract;
  private readonly knowledgeContributionEngine: MarketKnowledgeContributionEngineContract;
  private readonly intelligence: MarketIntelligenceContract;
  private readonly health: MarketHealthContract;
  private readonly dashboard: MarketDashboardContract;
  private readonly specializedDashboards: MarketSpecializedDashboardsContract;
  private readonly riskAnalyzer: MarketRiskAnalyzerContract;
  private readonly opportunityAnalyzer: MarketOpportunityAnalyzerContract;
  private readonly recommendationComposer: MarketRecommendationComposerContract;
  private readonly briefGenerator: ExecutiveMarketBriefGeneratorContract;
  private readonly projectionEngine: MarketProjectionContract;
  readonly queries: MarketQueriesContract;
  readonly registry: MarketRegistryContract;
  readonly repository: MarketRepositoryContract;
  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;

  constructor(d: MarketEngineDependencies = {}) {
    this.createId = d.createId ?? defaultCreateId;
    this.now = d.now ?? (() => new Date());
    this.industryIntelligence = d.industryIntelligence ?? new IndustryIntelligence();
    this.competitiveIntelligence = d.competitiveIntelligence ?? new CompetitiveIntelligence();
    this.marketSizeIntelligence = d.marketSizeIntelligence ?? new MarketSizeIntelligence();
    this.pricingIntelligence = d.pricingIntelligence ?? new PricingIntelligence();
    this.customerDemandIntelligence = d.customerDemandIntelligence ?? new CustomerDemandIntelligence();
    this.demographicIntelligence = d.demographicIntelligence ?? new DemographicIntelligence();
    this.geographicExpansionIntelligence =
      d.geographicExpansionIntelligence ?? new GeographicExpansionIntelligence();
    this.economicTrendIntelligence = d.economicTrendIntelligence ?? new EconomicTrendIntelligence();
    this.technologyTrendIntelligence = d.technologyTrendIntelligence ?? new TechnologyTrendIntelligence();
    this.partnershipIntelligence = d.partnershipIntelligence ?? new PartnershipIntelligence();
    this.mergersAcquisitionsIntelligence =
      d.mergersAcquisitionsIntelligence ?? new MergersAcquisitionsIntelligence();
    this.whiteSpaceIntelligence = d.whiteSpaceIntelligence ?? new WhiteSpaceIntelligence();
    this.reasoner = d.reasoner ?? new MarketReasoner();
    this.knowledgeContributionEngine =
      d.knowledgeContributionEngine ?? new MarketKnowledgeContributionEngine();
    this.intelligence = d.intelligence ?? new MarketIntelligence();
    this.health = d.health ?? new MarketHealth();
    this.dashboard = d.dashboard ?? new MarketDashboard();
    this.specializedDashboards = d.specializedDashboards ?? new MarketSpecializedDashboards();
    this.riskAnalyzer = d.riskAnalyzer ?? new MarketRiskAnalyzer(this.createId);
    this.opportunityAnalyzer = d.opportunityAnalyzer ?? new MarketOpportunityAnalyzer(this.createId);
    this.recommendationComposer =
      d.recommendationComposer ?? new MarketRecommendationComposer(this.createId);
    this.briefGenerator = d.briefGenerator ?? new ExecutiveMarketBriefGenerator();
    this.projectionEngine = d.projection ?? new MarketProjection();
    this.queries = d.queries ?? new MarketQueries();
    this.registry = d.registry ?? new MarketRegistryStore();
    this.repository = d.repository ?? new MarketRepositoryStore();
  }

  build(request: MarketRequest): MarketResult {
    const now = this.now();
    const scope = request.scope ?? emptyMarketScope();
    const dna = request.dna ?? request.dnaResult?.dna ?? null;
    const createId = this.createId;

    const baseline = deriveMarketBaseline(
      dna,
      request.oiosResult,
      request.analysis,
      request.graphInput,
      toPredictiveLight(request.predictionResult),
      request.knowledgeResult,
      request.documentResult,
      request.legalComplianceRiskResult,
      request.revenueResult,
      request.fundingResult,
      request.customerResult,
      request.businessModelResult,
      request.operationsResult,
      request.opportunityResult,
      request.baselineOverrides
    );

    const industry = this.industryIntelligence.assess({ baseline, now, createId });
    const competitive = this.competitiveIntelligence.assess({ baseline, industry, now, createId });
    const marketSize = this.marketSizeIntelligence.assess({
      baseline,
      industry,
      competitive,
      now,
      createId,
    });
    const pricing = this.pricingIntelligence.assess({ baseline, competitive, marketSize, now, createId });
    const customerDemand = this.customerDemandIntelligence.assess({ baseline, pricing, now, createId });
    const demographic = this.demographicIntelligence.assess({ baseline, customerDemand, now, createId });
    const geographicExpansion = this.geographicExpansionIntelligence.assess({
      baseline,
      demographic,
      marketSize,
      now,
      createId,
    });
    const economicTrend = this.economicTrendIntelligence.assess({ baseline, now, createId });
    const technologyTrend = this.technologyTrendIntelligence.assess({
      baseline,
      economicTrend,
      now,
      createId,
    });
    const partnership = this.partnershipIntelligence.assess({
      baseline,
      competitive,
      geographicExpansion,
      now,
      createId,
    });
    const mergersAcquisitions = this.mergersAcquisitionsIntelligence.assess({
      baseline,
      competitive,
      industry,
      now,
      createId,
    });
    const whiteSpace = this.whiteSpaceIntelligence.assess({
      baseline,
      customerDemand,
      competitive,
      marketSize,
      now,
      createId,
    });
    const knowledgeContribution = this.knowledgeContributionEngine.contribute({
      baseline,
      industry,
      competitive,
      whiteSpace,
      now,
      createId,
    });

    const signals = composeMarketSignals({
      baseline,
      industry,
      competitive,
      customerDemand,
      demographic,
      economicTrend,
      technologyTrend,
      mergersAcquisitions,
      createId,
    });

    const reasoning = this.reasoner.reason({
      baseline,
      competitive,
      whiteSpace,
      geographicExpansion,
      signals,
      question: request.question,
      now,
    });

    const risks = this.riskAnalyzer.analyze({
      baseline,
      competitive,
      technologyTrend,
      economicTrend,
      mergersAcquisitions,
      now,
    });
    const opportunities = this.opportunityAnalyzer.analyze({
      baseline,
      whiteSpace,
      geographicExpansion,
      partnership,
      knowledgeContribution,
      now,
    });
    const recommendations = this.recommendationComposer.compose({
      baseline,
      risks,
      opportunities,
      competitive,
      marketSize,
      whiteSpace,
      geographicExpansion,
      now,
    });

    const scores = this.intelligence.composeScores({
      baseline,
      industry,
      competitive,
      marketSize,
      pricing,
      customerDemand,
      demographic,
      geographicExpansion,
      economicTrend,
      technologyTrend,
      partnership,
      mergersAcquisitions,
      whiteSpace,
      signals,
      knowledgeContribution,
      reasoning,
      risks,
      opportunities,
    });
    const healthResult = this.health.assess({
      baseline,
      scores,
      competitive,
      whiteSpace,
      geographicExpansion,
    });
    const dashboard = this.dashboard.compose({ scores, risks, opportunities, now });
    const competitiveDashboard = this.specializedDashboards.competitive({ competitive, now });
    const expansionDashboard = this.specializedDashboards.expansion({
      geographicExpansion,
      whiteSpace,
      now,
    });
    const trendDashboard = this.specializedDashboards.trend({
      economicTrend,
      technologyTrend,
      customerDemand,
      signals,
      now,
    });
    const confidence = defaultMarketConfidence({ baseline, competitive, marketSize, signals });
    const brief = this.briefGenerator.generate({
      request,
      scores,
      risks,
      opportunities,
      signals,
      recommendations,
      confidence,
      now,
    });
    const projection = this.projectionEngine.project({
      request,
      scores,
      dashboard,
      competitiveDashboard,
      expansionDashboard,
      trendDashboard,
      brief,
      confidence,
      baseline,
      marketSize,
    });
    const historyRecord = {
      id: this.createId("mkt-history"),
      requestId: request.requestId,
      scope,
      status: "assessed" as const,
      healthScore: scores.healthScore.value,
      competitivePositionScore: scores.competitivePositionScore.value,
      marketRiskScore: scores.marketRiskScore.value,
      generatedAt: now.toISOString(),
      summary: brief.headline,
      metadata: request.metadata ?? {},
    };

    const result: MarketResult = {
      requestId: request.requestId,
      version: MARKET_INTELLIGENCE_VERSION,
      generatedAt: now.toISOString(),
      periodLabel: request.periodLabel ?? defaultPeriodLabel(now),
      scope,
      baseline,
      healthScore: scores.healthScore,
      competitivePositionScore: scores.competitivePositionScore,
      expansionOpportunityScore: scores.expansionOpportunityScore,
      marketRiskScore: scores.marketRiskScore,
      industryScore: scores.industryScore,
      marketSizeScore: scores.marketSizeScore,
      pricingScore: scores.pricingScore,
      demandScore: scores.demandScore,
      demographicScore: scores.demographicScore,
      geographicScore: scores.geographicScore,
      economicScore: scores.economicScore,
      technologyScore: scores.technologyScore,
      partnershipScore: scores.partnershipScore,
      maScore: scores.maScore,
      whiteSpaceScore: scores.whiteSpaceScore,
      knowledgeScore: scores.knowledgeScore,
      health: healthResult,
      brief,
      projection,
      confidence,
      dashboard,
      competitiveDashboard,
      expansionDashboard,
      trendDashboard,
      recommendations,
      risks,
      opportunities,
      historyRecord,
      industry,
      competitive,
      marketSize,
      pricing,
      customerDemand,
      demographic,
      geographicExpansion,
      economicTrend,
      technologyTrend,
      partnership,
      mergersAcquisitions,
      whiteSpace,
      signals,
      knowledgeContribution,
      reasoning,
      requestMetadata: {
        ...(request.metadata ?? {}),
        registryPublishers: this.registry.list().length,
        graphAligned: Boolean(request.graph),
        legalComplianceRiskAligned: Boolean(request.legalComplianceRiskResult),
        revenueAligned: Boolean(request.revenueResult),
        customerAligned: Boolean(request.customerResult),
      },
    };

    this.registry.register("market", "market_intelligence");
    this.repository.save(result);
    this.repository.saveHistory(historyRecord);
    return result;
  }
}

export { MarketIntelligenceEngineImpl as MarketIntelligenceEngine };
export { MarketIntelligenceEngineImpl as MarketEngine };
export { MarketIntelligenceEngineImpl as MarketEngineImpl };

function toPredictiveLight(
  value: MarketRequest["predictionResult"]
): PredictiveResultLight | null {
  if (!value) return null;
  const candidate = value as PredictiveResultLight;
  return {
    requestId: candidate.requestId,
    healthScore: candidate.healthScore,
    baseline: candidate.baseline,
    recommendations: candidate.recommendations,
  };
}
