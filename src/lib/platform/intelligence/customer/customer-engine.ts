/**
 * Customer Intelligence — CustomerIntelligenceEngine (Sprint 039).
 *
 * Orchestrates journey map, engagement, satisfaction, retention watchlist,
 * and community belonging for family/student experience.
 *
 * Distinct from Revenue's customer-revenue suite, DNA personas, and JAG
 * Success Intelligence.
 */

import type {
  CommunityBelongingEngine as CommunityBelongingEngineContract,
  CustomerDashboard as CustomerDashboardContract,
  CustomerDependencies,
  CustomerHealth as CustomerHealthContract,
  CustomerIntelligence as CustomerIntelligenceContract,
  CustomerIntelligenceEngine as CustomerIntelligenceEngineContract,
  CustomerOpportunityAnalyzer as CustomerOpportunityAnalyzerContract,
  CustomerProjection as CustomerProjectionContract,
  CustomerQueries as CustomerQueriesContract,
  CustomerRecommendationComposer as CustomerRecommendationComposerContract,
  CustomerRegistry as CustomerRegistryContract,
  CustomerRepository as CustomerRepositoryContract,
  CustomerRiskAnalyzer as CustomerRiskAnalyzerContract,
  EngagementEngine as EngagementEngineContract,
  ExecutiveCustomerBriefGenerator as ExecutiveCustomerBriefGeneratorContract,
  JourneyMapEngine as JourneyMapEngineContract,
  RetentionRiskEngine as RetentionRiskEngineContract,
  SatisfactionEngine as SatisfactionEngineContract,
} from "@/lib/platform/intelligence/customer/contracts";
import {
  defaultCustomerConfidence,
  CustomerDashboard,
  CustomerHealth,
  CustomerIntelligence,
  CustomerOpportunityAnalyzer,
  CustomerRecommendationComposer,
  CustomerRiskAnalyzer,
  ExecutiveCustomerBriefGenerator,
} from "@/lib/platform/intelligence/customer/customer-intelligence";
import {
  EngagementEngine,
  SatisfactionEngine,
} from "@/lib/platform/intelligence/customer/engagement-intelligence";
import { JourneyMapEngine } from "@/lib/platform/intelligence/customer/journey-intelligence";
import { CustomerRegistryStore } from "@/lib/platform/intelligence/customer/customer-registry";
import {
  CustomerProjection,
  CustomerQueries,
} from "@/lib/platform/intelligence/customer/projection";
import { CustomerRepositoryStore } from "@/lib/platform/intelligence/customer/repository";
import {
  CommunityBelongingEngine,
  RetentionRiskEngine,
} from "@/lib/platform/intelligence/customer/retention-intelligence";
import {
  defaultCreateId,
  defaultPeriodLabel,
  deriveCustomerBaseline,
  emptyCustomerScope,
} from "@/lib/platform/intelligence/customer/models";
import {
  CUSTOMER_INTELLIGENCE_VERSION,
  type CustomerRequest,
  type CustomerResult,
} from "@/lib/platform/intelligence/customer/types";

export interface CustomerEngineDependencies extends CustomerDependencies {}

/**
 * CustomerIntelligenceEngine — core orchestrator for customer outputs.
 */
export class CustomerIntelligenceEngineImpl
  implements CustomerIntelligenceEngineContract
{
  private readonly customerIntelligence: CustomerIntelligenceContract;
  private readonly customerDashboard: CustomerDashboardContract;
  private readonly customerHealth: CustomerHealthContract;
  private readonly journeyMapEngine: JourneyMapEngineContract;
  private readonly engagementEngine: EngagementEngineContract;
  private readonly satisfactionEngine: SatisfactionEngineContract;
  private readonly retentionRiskEngine: RetentionRiskEngineContract;
  private readonly communityBelongingEngine: CommunityBelongingEngineContract;
  private readonly customerRiskAnalyzer: CustomerRiskAnalyzerContract;
  private readonly customerOpportunityAnalyzer: CustomerOpportunityAnalyzerContract;
  private readonly customerRecommendationComposer: CustomerRecommendationComposerContract;
  private readonly briefGenerator: ExecutiveCustomerBriefGeneratorContract;
  private readonly projectionEngine: CustomerProjectionContract;
  readonly queries: CustomerQueriesContract;
  readonly registry: CustomerRegistryContract;
  readonly repository: CustomerRepositoryContract;
  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;

  constructor(d: CustomerEngineDependencies = {}) {
    this.createId = d.createId ?? defaultCreateId;
    this.now = d.now ?? (() => new Date());
    this.customerIntelligence =
      d.customerIntelligence ?? new CustomerIntelligence();
    this.customerDashboard = d.customerDashboard ?? new CustomerDashboard();
    this.customerHealth = d.customerHealth ?? new CustomerHealth();
    this.journeyMapEngine = d.journeyMapEngine ?? new JourneyMapEngine();
    this.engagementEngine = d.engagementEngine ?? new EngagementEngine();
    this.satisfactionEngine = d.satisfactionEngine ?? new SatisfactionEngine();
    this.retentionRiskEngine =
      d.retentionRiskEngine ?? new RetentionRiskEngine();
    this.communityBelongingEngine =
      d.communityBelongingEngine ?? new CommunityBelongingEngine();
    this.customerRiskAnalyzer =
      d.customerRiskAnalyzer ?? new CustomerRiskAnalyzer(this.createId);
    this.customerOpportunityAnalyzer =
      d.customerOpportunityAnalyzer ??
      new CustomerOpportunityAnalyzer(this.createId);
    this.customerRecommendationComposer =
      d.customerRecommendationComposer ??
      new CustomerRecommendationComposer(this.createId);
    this.briefGenerator =
      d.briefGenerator ?? new ExecutiveCustomerBriefGenerator();
    this.projectionEngine = d.projection ?? new CustomerProjection();
    this.queries = d.queries ?? new CustomerQueries();
    this.registry = d.registry ?? new CustomerRegistryStore();
    this.repository = d.repository ?? new CustomerRepositoryStore();
  }

  build(request: CustomerRequest): CustomerResult {
    const now = this.now();
    const scope = request.scope ?? emptyCustomerScope();
    const dna = request.dna ?? request.dnaResult?.dna ?? null;

    // 1. Baseline
    const baseline = deriveCustomerBaseline(
      dna,
      request.oiosResult,
      request.analysis,
      request.graphInput,
      request.predictionResult,
      request.revenueResult,
      request.operationsResult,
      request.baselineOverrides
    );

    // 2. Journey + engagement
    const journeyMap = this.journeyMapEngine.map({ baseline, now });
    const engagement = this.engagementEngine.assess({ baseline, now });

    // 3. Satisfaction
    const satisfaction = this.satisfactionEngine.assess({
      baseline,
      engagement,
      now,
    });

    // 4. Retention + community
    const retentionWatchlist = this.retentionRiskEngine.analyze({
      baseline,
      journeyMap,
      engagement,
      satisfaction,
      now,
    });
    const communityHealth = this.communityBelongingEngine.assess({
      baseline,
      engagement,
      now,
    });

    // 5. Risks + opportunities + recommendations
    const risks = this.customerRiskAnalyzer.analyze({
      baseline,
      journeyMap,
      engagement,
      satisfaction,
      retentionWatchlist,
      communityHealth,
      now,
    });
    const opportunities = this.customerOpportunityAnalyzer.analyze({
      baseline,
      journeyMap,
      engagement,
      satisfaction,
      communityHealth,
      now,
    });
    const recommendations = this.customerRecommendationComposer.compose({
      opportunities,
      risks,
      journeyMap,
      retentionWatchlist,
      now,
    });

    // 6. Scores + health + dashboard
    const scores = this.customerIntelligence.composeScores({
      baseline,
      journeyMap,
      engagement,
      satisfaction,
      retentionWatchlist,
      communityHealth,
      risks,
      opportunities,
    });
    const customerHealth = this.customerHealth.assess({
      baseline,
      scores,
      journeyMap,
      engagement,
    });
    const dashboard = this.customerDashboard.compose({
      scores,
      baseline,
      risks,
      opportunities,
      now,
    });

    // 7. Brief, projection, confidence, history → persist
    const confidence = defaultCustomerConfidence(
      baseline,
      journeyMap,
      engagement,
      satisfaction
    );
    const brief = this.briefGenerator.generate({
      request,
      baseline,
      scores,
      risks,
      opportunities,
      journeyMap,
      recommendations,
      confidence,
      now,
    });
    const projection = this.projectionEngine.project({
      request,
      healthScore: scores.healthScore,
      engagementScore: scores.engagementScore,
      journeyScore: scores.journeyScore,
      satisfactionScore: scores.satisfactionScore,
      retentionScore: scores.retentionScore,
      communityScore: scores.communityScore,
      journeyMap,
      engagement,
      satisfaction,
      retentionWatchlist,
      communityHealth,
      brief,
      confidence,
      dashboard,
      baseline,
    });

    const historyRecord = {
      id: this.createId("cust-history"),
      requestId: request.requestId,
      scope,
      status: "generated" as const,
      healthScore: scores.healthScore.value,
      generatedAt: now.toISOString(),
      summary: brief.headline,
      metadata: request.metadata ?? {},
    };

    const result: CustomerResult = {
      requestId: request.requestId,
      version: CUSTOMER_INTELLIGENCE_VERSION,
      generatedAt: now.toISOString(),
      periodLabel: request.periodLabel ?? defaultPeriodLabel(now),
      scope,
      baseline,
      healthScore: scores.healthScore,
      engagementScore: scores.engagementScore,
      journeyScore: scores.journeyScore,
      satisfactionScore: scores.satisfactionScore,
      retentionScore: scores.retentionScore,
      communityScore: scores.communityScore,
      riskScore: scores.riskScore,
      customerHealth,
      journeyMap,
      engagement,
      satisfaction,
      retentionWatchlist,
      communityHealth,
      dashboard,
      risks,
      opportunities,
      brief,
      projection,
      confidence,
      recommendations,
      historyRecord,
      metadata: {
        ...(request.metadata ?? {}),
        registryPublishers: this.registry.list().length,
        decisionAligned: Boolean(request.decisionResult),
        predictionAligned: Boolean(request.predictionResult),
      },
    };

    this.repository.save(result);
    this.repository.saveHistory(historyRecord);
    return result;
  }
}

/** Aliases matching Sprint naming. */
export { CustomerIntelligenceEngineImpl as CustomerIntelligenceEngine };
export { CustomerIntelligenceEngineImpl as CustomerEngine };
export { CustomerIntelligenceEngineImpl as CustomerEngineImpl };
