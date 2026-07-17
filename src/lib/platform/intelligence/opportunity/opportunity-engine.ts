/** Opportunity Intelligence orchestration engine (Sprint 035). */
import type * as C from "@/lib/platform/intelligence/opportunity/contracts";
import { OpportunityCategoryEngine } from "@/lib/platform/intelligence/opportunity/categories";
import { OpportunityAnalysisEngine } from "@/lib/platform/intelligence/opportunity/analysis";
import { OpportunityRankingEngine } from "@/lib/platform/intelligence/opportunity/ranking";
import { OpportunityExchangeStore } from "@/lib/platform/intelligence/opportunity/opportunity-exchange";
import { OpportunityRegistryStore } from "@/lib/platform/intelligence/opportunity/opportunity-registry";
import {
  OpportunityIntelligence,
  OpportunityHealth,
  OpportunityDashboard,
  TopOpportunitiesDashboard,
  QuickWinsDashboard,
  StrategicInvestmentDashboard,
  MissionOpportunityDashboard,
  OpportunityHeatMap,
  OpportunityPipelineComposer,
  ExecutiveOpportunityBriefGenerator,
  defaultOpportunityConfidence,
} from "@/lib/platform/intelligence/opportunity/opportunity-intelligence";
import { OpportunityProjection, OpportunityQueries } from "@/lib/platform/intelligence/opportunity/projection";
import { OpportunityRepositoryStore } from "@/lib/platform/intelligence/opportunity/repository";
import {
  defaultPeriodLabel,
  deriveDnaAlignment,
  deriveOpportunityBaseline,
  emptyOpportunityScope,
} from "@/lib/platform/intelligence/opportunity/models";
import {
  OPPORTUNITY_INTELLIGENCE_VERSION,
  type OpportunityRequest,
  type OpportunityResult,
} from "@/lib/platform/intelligence/opportunity/types";

export type OpportunityEngineDependencies = C.OpportunityDependencies;

export class OpportunityIntelligenceEngineImpl implements C.OpportunityIntelligenceEngine {
  private readonly categories: C.OpportunityCategoryEngine;
  private readonly analysisEngine: C.OpportunityAnalysisEngine;
  private readonly rankingEngine: C.OpportunityRankingEngine;
  private readonly exchangeStore: C.OpportunityExchange;
  private readonly domainRegistry: C.OpportunityRegistry;
  private readonly intelligence: C.OpportunityIntelligence;
  private readonly health: C.OpportunityHealth;
  private readonly dashboard: C.OpportunityDashboard;
  private readonly topDashboard: C.TopOpportunitiesDashboard;
  private readonly quickWinsDashboard: C.QuickWinsDashboard;
  private readonly strategicDashboard: C.StrategicInvestmentDashboard;
  private readonly missionDashboard: C.MissionOpportunityDashboard;
  private readonly heatMap: C.OpportunityHeatMap;
  private readonly pipelineComposer: C.OpportunityPipelineComposer;
  private readonly brief: C.ExecutiveOpportunityBriefGenerator;
  private readonly projection: C.OpportunityProjection;
  private readonly store: C.OpportunityRepository;
  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;
  readonly queries: C.OpportunityQueries;

  constructor(d: OpportunityEngineDependencies = {}) {
    const id =
      d.createId ??
      ((p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
    this.createId = id;
    this.now = d.now ?? (() => new Date());
    this.categories = d.categoryEngine ?? new OpportunityCategoryEngine({ ...d, createId: id });
    this.analysisEngine = d.analysisEngine ?? new OpportunityAnalysisEngine(d);
    this.rankingEngine = d.rankingEngine ?? new OpportunityRankingEngine();
    this.exchangeStore = d.exchange ?? new OpportunityExchangeStore();
    this.domainRegistry = d.registry ?? new OpportunityRegistryStore();
    this.intelligence = d.opportunityIntelligence ?? new OpportunityIntelligence();
    this.health = d.opportunityHealth ?? new OpportunityHealth();
    this.dashboard = d.opportunityDashboard ?? new OpportunityDashboard();
    this.topDashboard = d.topOpportunitiesDashboard ?? new TopOpportunitiesDashboard();
    this.quickWinsDashboard = d.quickWinsDashboard ?? new QuickWinsDashboard();
    this.strategicDashboard = d.strategicInvestmentDashboard ?? new StrategicInvestmentDashboard();
    this.missionDashboard = d.missionOpportunityDashboard ?? new MissionOpportunityDashboard();
    this.heatMap = d.heatMap ?? new OpportunityHeatMap();
    this.pipelineComposer = d.pipelineComposer ?? new OpportunityPipelineComposer();
    this.brief = d.briefGenerator ?? new ExecutiveOpportunityBriefGenerator(id);
    this.projection = d.projection ?? new OpportunityProjection();
    this.queries = d.queries ?? new OpportunityQueries();
    this.store = d.repository ?? new OpportunityRepositoryStore();
  }

  get repository(): C.OpportunityRepository {
    return this.store;
  }

  get exchange(): C.OpportunityExchange {
    return this.exchangeStore;
  }

  get registry(): C.OpportunityRegistry {
    return this.domainRegistry;
  }

  build(request: OpportunityRequest): OpportunityResult {
    const now = this.now();
    const scope = request.scope ?? emptyOpportunityScope();
    const dna = request.dnaResult?.dna ?? request.dna ?? null;

    // 1. baseline
    const baseline = deriveOpportunityBaseline(
      dna,
      request.oiosResult,
      request.analysis,
      request.graphInput,
      request.predictionResult,
      request.financialSignal,
      request.revenueResult,
      request.fundingResult,
      request.humanCapitalResult,
      request.baselineOverrides
    );
    const dnaAlignment = deriveDnaAlignment(dna, baseline);
    const common = { baseline, now };
    const periodLabel = request.periodLabel ?? defaultPeriodLabel(now);

    // 2. category discovery (22 categories)
    const categories = this.categories.discover(common);

    // 3. exchange — normalize category + published domain opportunities
    const exchange = this.exchangeStore.toExchangeRecords({
      categories,
      published: request.publishedOpportunities,
      now,
      dnaAlignment,
    });
    this.exchangeStore.publishMany(exchange, now);

    // 4. analysis suite
    const analysis = this.analysisEngine.analyze({ ...common, records: exchange, dnaAlignment });
    const scoredExchange = analysis.scored;

    // 5. ranking lenses
    const rankings = this.rankingEngine.rankAll({ records: scoredExchange });

    // 6. pipeline
    const pipeline = this.pipelineComposer.compose({ records: scoredExchange });

    // 7. scores and health
    const scores = this.intelligence.composeScores({
      baseline,
      exchange: scoredExchange,
      analysis,
    });
    const opportunityHealth = this.health.assess({
      baseline,
      scores,
      exchange: scoredExchange,
    });

    // 8. dashboards + heat map
    const dashboard = this.dashboard.compose({
      baseline,
      scores,
      exchange: scoredExchange,
      rankings,
      now,
    });
    const topOpportunitiesDashboard = this.topDashboard.build({
      opportunities: scoredExchange,
      now,
    });
    const quickWinsDashboard = this.quickWinsDashboard.build({ rankings, now });
    const strategicInvestmentDashboard = this.strategicDashboard.build({ rankings, now });
    const missionOpportunityDashboard = this.missionDashboard.build({ rankings, now });
    const heatMap = this.heatMap.compose({ exchange: scoredExchange, rankings, now });

    // 9. brief, projection, confidence, history, recommendations
    const confidence = defaultOpportunityConfidence(
      baseline,
      Boolean(dna),
      Boolean(request.oiosResult),
      scoredExchange.length
    );
    const topOpportunities = topOpportunitiesDashboard.opportunities;
    const brief = this.brief.generate({
      request,
      baseline,
      scores,
      topOpportunities,
      rankings,
      analysis,
      confidence,
      now,
    });
    const projection = this.projection.project({
      baseline,
      scores,
      pipeline,
      topOpportunities,
      brief,
      dashboard,
      confidence,
    });

    const recommendations = [
      ...topOpportunities.slice(0, 3).map(
        (o) =>
          `${o.narrative} Five-lens impact: ${o.lenses.organizationalHealth}; ${o.lenses.financialSustainability}; ${o.lenses.missionImpact}; ${o.lenses.longTermValue}; ${o.lenses.timeToValue}`
      ),
      ...quickWinsDashboard.opportunities.slice(0, 2).map(
        (o) => `Quick win: ${o.title} — ${o.lenses.timeToValue}`
      ),
    ];

    const historyRecord = {
      id: this.createId("opp-hist"),
      requestId: request.requestId,
      generatedAt: now.toISOString(),
      status: "generated" as const,
      summary: brief.headline,
      scope,
      confidence,
      scores: {
        health: scores.healthScore.value,
        opportunity: scores.opportunityScore.value,
        risk: scores.riskScore.value,
      },
    };

    const result: OpportunityResult = {
      requestId: request.requestId,
      version: OPPORTUNITY_INTELLIGENCE_VERSION,
      generatedAt: now.toISOString(),
      periodLabel,
      scope,
      baseline,
      categories,
      exchange: scoredExchange,
      analysis,
      rankings,
      pipeline,
      ...scores,
      opportunityHealth,
      dashboard,
      topOpportunitiesDashboard,
      quickWinsDashboard,
      strategicInvestmentDashboard,
      missionOpportunityDashboard,
      heatMap,
      brief,
      projection,
      confidence,
      historyRecord,
      recommendations,
    };

    this.store.save(result);
    this.store.saveHistory(historyRecord);
    return result;
  }
}

export {
  OpportunityIntelligenceEngineImpl as OpportunityIntelligenceEngine,
  OpportunityIntelligenceEngineImpl as OpportunityEngine,
  OpportunityIntelligenceEngineImpl as OpportunityEngineImpl,
};
