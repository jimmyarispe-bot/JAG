/** Organizational Improvement Engine orchestration (Sprint 036). */
import type * as C from "@/lib/platform/intelligence/organizational-improvement/contracts";
import { ImprovementSourceEngine } from "@/lib/platform/intelligence/organizational-improvement/sources";
import { ImprovementAnalysisEngine } from "@/lib/platform/intelligence/organizational-improvement/analysis";
import { ImprovementPlanner } from "@/lib/platform/intelligence/organizational-improvement/planner";
import { ImprovementRegistryStore } from "@/lib/platform/intelligence/organizational-improvement/improvement-registry";
import {
  ContinuousImprovementLoop,
  DailyExecutiveBriefGenerator,
  defaultImprovementConfidence,
  ExecutiveImprovementBriefGenerator,
  FinancialImprovementDashboard,
  ImprovementDashboard,
  ImprovementHealth,
  ImprovementHeatMap,
  ImprovementIntelligence,
  MissionImprovementDashboard,
  PeopleImprovementDashboard,
  TodaysPrioritiesComposer,
} from "@/lib/platform/intelligence/organizational-improvement/improvement-intelligence";
import { ImprovementProjection, ImprovementQueries } from "@/lib/platform/intelligence/organizational-improvement/projection";
import { ImprovementRepositoryStore } from "@/lib/platform/intelligence/organizational-improvement/repository";
import {
  defaultPeriodLabel,
  deriveDnaAlignment,
  deriveImprovementBaseline,
  emptyImprovementScope,
} from "@/lib/platform/intelligence/organizational-improvement/models";
import {
  IMPROVEMENT_INTELLIGENCE_VERSION,
  type ImprovementRecord,
  type ImprovementRequest,
  type ImprovementResult,
  type OpportunityResultLight,
} from "@/lib/platform/intelligence/organizational-improvement/types";

export interface ImprovementEngineDependencies extends C.ImprovementDependencies {}

function flattenAndDedupe(
  sources: Record<string, ImprovementRecord[]>,
  published?: ImprovementRecord[]
): ImprovementRecord[] {
  const all = Object.values(sources).flat();
  if (published?.length) {
    for (const item of published) {
      if (!all.some((r) => r.id === item.id)) all.push(item);
    }
  }
  const seen = new Set<string>();
  const deduped: ImprovementRecord[] = [];
  for (const record of all) {
    const key = record.id || `${record.sourceDomain}:${record.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(record);
  }
  return deduped;
}

export class OrganizationalImprovementEngineImpl implements C.OrganizationalImprovementEngine {
  private readonly sourceEngine: C.ImprovementSourceEngine;
  private readonly analysisEngine: C.ImprovementAnalysisEngine;
  private readonly planner: C.ImprovementPlanner;
  private readonly domainRegistry: C.ImprovementRegistry;
  private readonly intelligence: C.ImprovementIntelligence;
  private readonly health: C.ImprovementHealth;
  private readonly dashboard: C.ImprovementDashboard;
  private readonly missionDashboard: C.MissionImprovementDashboard;
  private readonly financialDashboard: C.FinancialImprovementDashboard;
  private readonly peopleDashboard: C.PeopleImprovementDashboard;
  private readonly todaysPriorities: C.TodaysPrioritiesComposer;
  private readonly heatMap: C.ImprovementHeatMap;
  private readonly loop: C.ContinuousImprovementLoop;
  private readonly dailyBrief: C.DailyExecutiveBriefGenerator;
  private readonly brief: C.ExecutiveImprovementBriefGenerator;
  private readonly projection: C.ImprovementProjection;
  private readonly store: C.ImprovementRepository;
  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;
  readonly queries: C.ImprovementQueries;

  constructor(d: ImprovementEngineDependencies = {}) {
    const id =
      d.createId ??
      ((p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
    this.createId = id;
    this.now = d.now ?? (() => new Date());
    this.sourceEngine = d.sourceEngine ?? new ImprovementSourceEngine(d);
    this.analysisEngine = d.analysisEngine ?? new ImprovementAnalysisEngine(d);
    this.planner = d.planner ?? new ImprovementPlanner(d);
    this.domainRegistry = d.registry ?? new ImprovementRegistryStore();
    this.intelligence = d.improvementIntelligence ?? new ImprovementIntelligence();
    this.health = d.improvementHealth ?? new ImprovementHealth();
    this.dashboard = d.improvementDashboard ?? new ImprovementDashboard();
    this.missionDashboard = d.missionDashboard ?? new MissionImprovementDashboard();
    this.financialDashboard = d.financialDashboard ?? new FinancialImprovementDashboard();
    this.peopleDashboard = d.peopleDashboard ?? new PeopleImprovementDashboard();
    this.todaysPriorities = d.todaysPriorities ?? new TodaysPrioritiesComposer();
    this.heatMap = d.heatMap ?? new ImprovementHeatMap();
    this.loop = d.loop ?? new ContinuousImprovementLoop();
    this.dailyBrief = d.dailyBriefGenerator ?? new DailyExecutiveBriefGenerator(id);
    this.brief = d.briefGenerator ?? new ExecutiveImprovementBriefGenerator(id);
    this.projection = d.projection ?? new ImprovementProjection();
    this.queries = d.queries ?? new ImprovementQueries();
    this.store = d.repository ?? new ImprovementRepositoryStore();
  }

  get repository(): C.ImprovementRepository {
    return this.store;
  }

  get registry(): C.ImprovementRegistry {
    return this.domainRegistry;
  }

  build(request: ImprovementRequest): ImprovementResult {
    const now = this.now();
    const scope = request.scope ?? emptyImprovementScope();
    const dna = request.dnaResult?.dna ?? request.dna ?? null;

    // 1. baseline + dna alignment
    const baseline = deriveImprovementBaseline(
      dna,
      request.oiosResult,
      request.analysis,
      request.graphInput,
      request.predictionResult,
      request.governanceResult,
      request.financialSignal,
      request.revenueResult,
      request.fundingResult,
      request.humanCapitalResult,
      (request.opportunityResult as OpportunityResultLight | undefined) ?? null,
      request.baselineOverrides
    );
    const dnaAlignment = deriveDnaAlignment(dna, baseline);
    const common = { baseline, now };
    const periodLabel = request.periodLabel ?? defaultPeriodLabel(now);

    // 2. source discovery
    const sources = this.sourceEngine.discover({
      ...common,
      request,
      createId: this.createId,
    });

    // 3. flatten + dedupe improvements (+ published)
    const improvementsRaw = flattenAndDedupe(sources, request.publishedImprovements);

    // 4. analysis
    const analysis = this.analysisEngine.analyze({
      ...common,
      records: improvementsRaw,
      dnaAlignment,
    });
    const improvements = analysis.scored;

    // 5. planning suite
    const planning = this.planner.planAll({ records: improvements });

    // 6. continuous improvement loop
    const loop = this.loop.run({
      improvements,
      analysis,
      planning,
      createId: this.createId,
    });

    // 7. scores + health
    const scores = this.intelligence.composeScores({
      baseline,
      improvements,
      analysis,
    });
    const improvementHealth = this.health.assess({
      baseline,
      scores,
      improvements,
      loop,
    });

    // 8. dashboards + heat map + todays priorities
    const dashboard = this.dashboard.compose({
      baseline,
      scores,
      improvements,
      planning,
      now,
    });
    const missionDashboard = this.missionDashboard.build({ improvements, now });
    const financialDashboard = this.financialDashboard.build({ improvements, now });
    const peopleDashboard = this.peopleDashboard.build({ improvements, now });
    const heatMap = this.heatMap.compose({ improvements, now });
    const todaysPriorities = this.todaysPriorities.compose({ improvements, now });

    // 9. daily brief, executive brief, projection, confidence, history, recommendations → persist
    const confidence = defaultImprovementConfidence(
      baseline,
      Boolean(dna),
      Boolean(request.oiosResult),
      improvements.length
    );
    const dailyBrief = this.dailyBrief.generate({
      request,
      improvements,
      confidence,
      now,
      createId: this.createId,
    });
    const brief = this.brief.generate({
      request,
      baseline,
      scores,
      improvements,
      planning,
      analysis,
      confidence,
      now,
      createId: this.createId,
    });
    const projection = this.projection.project({
      baseline,
      scores,
      todaysPriorities,
      weeklyPlan: planning.weekly,
      quarterlyRoadmap: planning.quarterly,
      brief,
      dailyBrief,
      dashboard,
      confidence,
    });

    const recommendations = [
      ...todaysPriorities.priorities.slice(0, 3).map(
        (o) =>
          `${o.narrative} Lenses: ${o.lenses.whyNow}; ${o.lenses.financialImpact}; ${o.lenses.missionImpact}; ${o.lenses.peopleImpact}; ${o.lenses.timeToValue}`
      ),
      ...planning.quickWins.items.slice(0, 2).map((o) => `Quick win: ${o.title} — ${o.narrative}`),
    ];

    const historyRecord = {
      id: this.createId("imp-hist"),
      requestId: request.requestId,
      generatedAt: now.toISOString(),
      status: "generated" as const,
      summary: brief.headline,
      scope,
      confidence,
      scores: {
        health: scores.healthScore.value,
        improvement: scores.improvementScore.value,
        risk: scores.riskScore.value,
      },
    };

    const result: ImprovementResult = {
      requestId: request.requestId,
      version: IMPROVEMENT_INTELLIGENCE_VERSION,
      generatedAt: now.toISOString(),
      periodLabel,
      scope,
      baseline,
      sources,
      improvements,
      analysis,
      planning,
      loop,
      ...scores,
      improvementHealth,
      dashboard,
      missionDashboard,
      financialDashboard,
      peopleDashboard,
      todaysPriorities,
      heatMap,
      dailyBrief,
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
  OrganizationalImprovementEngineImpl as OrganizationalImprovementEngine,
  OrganizationalImprovementEngineImpl as ImprovementEngine,
  OrganizationalImprovementEngineImpl as ImprovementEngineImpl,
};
