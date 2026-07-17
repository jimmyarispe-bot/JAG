/**
 * Predictive Intelligence — PredictionEngine (Sprint 028).
 *
 * Orchestrates trend analysis, multi-horizon forecasting, risk detection,
 * preventive actions, projection, and history.
 */

import type {
  ForecastEngine as ForecastEngineContract,
  ForecastHistory as ForecastHistoryContract,
  ForecastProjection as ForecastProjectionContract,
  ForecastQueries as ForecastQueriesContract,
  ForecastRepository as ForecastRepositoryContract,
  ForecastScoring as ForecastScoringContract,
  PredictionConfidence as PredictionConfidenceContract,
  PredictionEngine as PredictionEngineContract,
  PredictiveIntelligenceDependencies,
  TrendAnalyzer as TrendAnalyzerContract,
} from "@/lib/platform/intelligence/predictive-intelligence/contracts";
import { PredictionConfidenceEngine } from "@/lib/platform/intelligence/predictive-intelligence/confidence";
import { ForecastEngine as ForecastEngineImpl } from "@/lib/platform/intelligence/predictive-intelligence/forecast-engine";
import { ForecastRepository as ForecastRepositoryStore } from "@/lib/platform/intelligence/predictive-intelligence/forecast-repository";
import { ForecastHistory as ForecastHistoryStore } from "@/lib/platform/intelligence/predictive-intelligence/history";
import {
  baselineValueForDomain,
  defaultForecastScenarios,
  defaultThresholds,
  deriveForecastBaseline,
  resolveDomains,
  resolveHorizons,
  seriesForDomain,
  synthesizeHistoricalSignals,
} from "@/lib/platform/intelligence/predictive-intelligence/models";
import { ForecastProjection as ForecastProjectionEngine } from "@/lib/platform/intelligence/predictive-intelligence/projection";
import { ForecastQueries as ForecastQueriesEngine } from "@/lib/platform/intelligence/predictive-intelligence/queries";
import {
  ForecastScoring as ForecastScoringEngine,
  priorityBandFromScore,
} from "@/lib/platform/intelligence/predictive-intelligence/scoring";
import { TrendAnalyzer as TrendAnalyzerEngine } from "@/lib/platform/intelligence/predictive-intelligence/trend-analyzer";
import type {
  DomainForecast,
  EmergingRisk,
  ForecastBaseline,
  ForecastDomain,
  ForecastHorizonDays,
  ForecastScenarioDefinition,
  GraphScope,
  HistoricalSignal,
  PredictionRequest,
  PredictionResult,
  PreventiveAction,
  ScenarioForecast,
} from "@/lib/platform/intelligence/predictive-intelligence/types";
import { PREDICTIVE_INTELLIGENCE_VERSION } from "@/lib/platform/intelligence/predictive-intelligence/types";
import type {
  Graph,
  GraphAnalysisResult,
} from "@/lib/platform/intelligence/executive-graph/types";

export type PredictionEngineDependencies = PredictiveIntelligenceDependencies;

/**
 * PredictionEngine — core orchestrator for predictive organizational forecasts.
 */
export class PredictionEngineImpl implements PredictionEngineContract {
  private readonly confidence: PredictionConfidenceContract;
  private readonly scoring: ForecastScoringContract;
  private readonly trendAnalyzer: TrendAnalyzerContract;
  private readonly forecastEngine: ForecastEngineContract;
  private readonly projection: ForecastProjectionContract;
  private readonly historyStore: ForecastHistoryContract;
  private readonly repositoryStore: ForecastRepositoryContract;
  private readonly buildAndAnalyze:
    | ((input?: PredictionRequest["graphInput"]) => {
        graph: Graph;
        analysis: GraphAnalysisResult;
      })
    | null;
  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;

  readonly queries: ForecastQueriesContract;

  constructor(dependencies: PredictionEngineDependencies = {}) {
    const now = dependencies.now ?? (() => new Date());
    const createId =
      dependencies.createId ??
      ((prefix) =>
        `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);

    this.now = now;
    this.createId = createId;
    this.buildAndAnalyze = dependencies.buildAndAnalyze ?? null;

    this.confidence =
      dependencies.confidence ?? new PredictionConfidenceEngine();
    this.scoring = dependencies.scoring ?? new ForecastScoringEngine();
    this.trendAnalyzer =
      dependencies.trendAnalyzer ?? new TrendAnalyzerEngine();
    this.forecastEngine =
      dependencies.forecastEngine ??
      new ForecastEngineImpl({ confidence: this.confidence, createId });
    this.projection =
      dependencies.projection ?? new ForecastProjectionEngine({ now });
    this.historyStore = dependencies.history ?? new ForecastHistoryStore();
    this.repositoryStore =
      dependencies.repository ?? new ForecastRepositoryStore();
    this.queries =
      dependencies.queries ??
      new ForecastQueriesEngine({ confidence: this.confidence });
  }

  get history(): ForecastHistoryContract {
    return this.historyStore;
  }

  get repository(): ForecastRepositoryContract {
    return this.repositoryStore;
  }

  predict(request: PredictionRequest): PredictionResult {
    const { graph, analysis } = this.resolveGraphContext(request);
    const baseline = deriveForecastBaseline(
      analysis,
      request.graphInput,
      request.decisionBaseline ?? null,
      request.baselineOverrides
    );
    const horizons = resolveHorizons(request.horizons);
    const domains = resolveDomains(request.domains);
    const scenarios =
      request.scenarios && request.scenarios.length > 0
        ? request.scenarios
        : defaultForecastScenarios();
    const thresholds = {
      ...defaultThresholds(),
      ...(request.thresholds ?? {}),
    };
    const now = this.now();

    const signals =
      request.historicalSignals && request.historicalSignals.length > 0
        ? request.historicalSignals
        : synthesizeHistoricalSignals(baseline, domains, now);

    // Bias from decision simulations when present
    const decisionBias = extractDecisionBias(request);

    const scenarioForecasts: ScenarioForecast[] = scenarios.map((scenario) =>
      this.buildScenarioForecast({
        scenario,
        baseline,
        domains,
        horizons,
        signals,
        thresholds,
        decisionBias,
        now,
        maxRisks: request.maxRisks ?? 5,
        maxActions: request.maxActions ?? 5,
        scope: request.scope,
      })
    );

    for (const forecast of scenarioForecasts) {
      this.repositoryStore.save(forecast);
    }

    const signalConfidence = this.confidence.fromSignals(signals);
    const graphConfidence = this.confidence.fromGraphAnalysis(analysis);
    const scenarioConfidenceAvg =
      scenarioForecasts.length === 0
        ? 0.4
        : scenarioForecasts.reduce((s, f) => s + f.confidence.value, 0) /
          scenarioForecasts.length;

    const confidence = this.confidence.score([
      {
        key: "signals",
        label: "Historical signals",
        contribution: signalConfidence.value * 0.3,
      },
      {
        key: "graph",
        label: "Executive graph",
        contribution: graphConfidence.value * 0.3,
      },
      {
        key: "scenarios",
        label: "Scenario forecasts",
        contribution: scenarioConfidenceAvg * 0.3,
      },
      {
        key: "decision",
        label: "Decision linkage",
        contribution: request.decisionResult || request.decisionSimulations
          ? 0.1
          : 0.05,
      },
    ]);

    const projection = this.projection.project({
      request,
      scenarioForecasts,
      confidence,
    });

    const scope: GraphScope = {
      organizationId: request.scope?.organizationId ?? null,
      schoolId: request.scope?.schoolId ?? null,
      regionId: request.scope?.regionId ?? null,
      campusId: request.scope?.campusId ?? null,
    };

    const generatedAt = now.toISOString();
    const question =
      request.question ??
      "What organizational outcomes should leadership anticipate?";

    const historyRecord = {
      id: this.createId("forecast-history"),
      requestId: request.requestId,
      status: "generated" as const,
      createdAt: generatedAt,
      updatedAt: generatedAt,
      scope,
      scenarioIds: scenarios.map((s) => s.id),
      projectionHeadline: projection.headline,
      confidence,
      metadata: request.metadata ?? {},
    };

    const result: PredictionResult = {
      requestId: request.requestId,
      question,
      generatedAt,
      status: "generated",
      baseline,
      horizons,
      domains,
      scenarioForecasts,
      projection,
      historyRecord,
      graphId: graph?.id ?? analysis?.graphId ?? null,
      confidence,
      summary: projection.headline,
      metadata: {
        version: PREDICTIVE_INTELLIGENCE_VERSION,
        analyzer: "PredictionEngine",
        ...(request.metadata ?? {}),
      },
    };

    this.historyStore.record(result);
    return result;
  }

  private buildScenarioForecast(input: {
    scenario: ForecastScenarioDefinition;
    baseline: ForecastBaseline;
    domains: ForecastDomain[];
    horizons: ForecastHorizonDays[];
    signals: HistoricalSignal[];
    thresholds: Partial<Record<ForecastDomain, number>>;
    decisionBias: Partial<Record<ForecastDomain, number>>;
    now: Date;
    maxRisks: number;
    maxActions: number;
    scope?: PredictionRequest["scope"];
  }): ScenarioForecast {
    const scenario = {
      ...input.scenario,
      scope: input.scenario.scope ?? input.scope,
      domainMultipliers: {
        ...(input.scenario.domainMultipliers ?? {}),
        ...Object.fromEntries(
          Object.entries(input.decisionBias).map(([domain, bias]) => [
            domain,
            (input.scenario.domainMultipliers?.[domain as ForecastDomain] ??
              1) * (bias ?? 1),
          ])
        ),
      },
    };

    const domainForecasts: DomainForecast[] = input.domains.map((domain) => {
      const series = seriesForDomain(input.signals, domain);
      const trend = this.trendAnalyzer.analyze({
        domain,
        series,
        baselineValue: baselineValueForDomain(input.baseline, domain),
      });
      const forecast = this.forecastEngine.forecastDomain({
        domain,
        baselineValue: baselineValueForDomain(input.baseline, domain),
        trend,
        horizons: input.horizons,
        scenario,
        now: input.now,
      });
      const crossings = this.forecastEngine.detectThresholds({
        domain,
        points: forecast.points,
        threshold: input.thresholds[domain],
        now: input.now,
      });
      return {
        ...forecast,
        thresholdCrossings: crossings,
      };
    });

    const emergingRisks = this.detectEmergingRisks(
      domainForecasts,
      input.maxRisks
    );
    const preventiveActions = this.recommendPreventiveActions(
      domainForecasts,
      emergingRisks,
      scenario.id,
      input.maxActions
    );

    const domainScores = domainForecasts.map((d) =>
      this.scoring.scoreDomainForecast({
        trend: d.trend,
        confidence: d.confidence.value,
        riskScore:
          emergingRisks
            .filter((r) => r.domain === d.domain)
            .reduce((s, r) => Math.max(s, r.score), 0) || 0.2,
      })
    );

    const confidence = this.confidence.score([
      {
        key: "domains",
        label: "Domain confidence",
        contribution:
          (domainForecasts.reduce((s, d) => s + d.confidence.value, 0) /
            Math.max(domainForecasts.length, 1)) *
          0.6,
      },
      {
        key: "risk_clarity",
        label: "Risk clarity",
        contribution: clampRiskClarity(emergingRisks.length) * 0.25,
      },
      {
        key: "scenario_kind",
        label: "Scenario kind",
        contribution: scenario.kind === "baseline" ? 0.15 : 0.1,
      },
    ]);

    const score = this.scoring.scoreScenario({
      domainScores,
      confidence: confidence.value,
      riskCount: emergingRisks.length,
    });

    const declining = domainForecasts.filter(
      (d) =>
        d.trend.direction === "declining" ||
        d.trend.direction === "volatile"
    ).length;

    return {
      scenario,
      domains: domainForecasts,
      emergingRisks,
      preventiveActions,
      confidence,
      score,
      generatedAt: input.now.toISOString(),
      summary: `${scenario.title}: ${domainForecasts.length} domains, ${emergingRisks.length} emerging risks, ${declining} declining/volatile trends.`,
    };
  }

  private detectEmergingRisks(
    domains: DomainForecast[],
    maxRisks: number
  ): EmergingRisk[] {
    const risks: EmergingRisk[] = [];

    for (const domain of domains) {
      const crossing = domain.thresholdCrossings[0];
      const declining =
        domain.trend.direction === "declining" ||
        (domain.domain === "risk" && domain.trend.direction === "accelerating");
      const volatile = domain.trend.direction === "volatile";

      if (!crossing && !declining && !volatile) continue;

      const probability = clamp01(
        (crossing ? 0.45 : 0.2) +
          (declining ? 0.25 : 0) +
          (volatile ? 0.15 : 0) +
          Math.abs(domain.trend.slope) * 2
      );
      const impact = clamp01(
        crossing
          ? crossing.severity === "critical"
            ? 0.9
            : crossing.severity === "warning"
              ? 0.7
              : 0.45
          : 0.5
      );
      const score = clamp01(probability * 0.55 + impact * 0.45);
      const horizonDays =
        crossing?.horizonDays ?? domain.points[0]?.horizonDays ?? 90;

      risks.push({
        id: this.createId("risk"),
        title: `${titleCase(domain.domain)} outlook risk`,
        domain: domain.domain,
        probability,
        impact,
        score,
        horizonDays,
        relatedThresholdIds: domain.thresholdCrossings.map((c) => c.id),
        preventiveActionIds: [],
        narrative: crossing
          ? crossing.narrative
          : `${domain.domain} shows a ${domain.trend.direction} trend that may become material within ${horizonDays} days.`,
      });
    }

    return risks.sort((a, b) => b.score - a.score).slice(0, maxRisks);
  }

  private recommendPreventiveActions(
    domains: DomainForecast[],
    risks: EmergingRisk[],
    scenarioId: string,
    maxActions: number
  ): PreventiveAction[] {
    const actions: PreventiveAction[] = [];

    for (const risk of risks) {
      const domainForecast = domains.find((d) => d.domain === risk.domain);
      const priority = priorityBandFromScore(risk.score);
      const action = actionForDomain(risk.domain);
      const confidence = this.confidence.fromValue(
        (domainForecast?.confidence.value ?? 0.5) * 0.7 + risk.probability * 0.3
      );

      const preventive: PreventiveAction = {
        id: this.createId("action"),
        title: `Prevent ${risk.domain} deterioration`,
        action,
        domain: risk.domain,
        priority,
        horizonDays: risk.horizonDays,
        expectedImpact: clamp01(risk.impact * 0.8),
        confidence,
        relatedRiskIds: [risk.id],
        relatedScenarioIds: [scenarioId],
        executiveSummary: `Act within ${risk.horizonDays} days: ${action} (${priority} priority). ${risk.narrative}`,
      };
      actions.push(preventive);
      risk.preventiveActionIds.push(preventive.id);
    }

    // Always surface at least one monitoring action on baseline domains if empty
    if (actions.length === 0 && domains[0]) {
      const d = domains[0];
      actions.push({
        id: this.createId("action"),
        title: `Monitor ${d.domain}`,
        action: `Continue monitoring ${d.domain} against forecast bands.`,
        domain: d.domain,
        priority: "monitor",
        horizonDays: d.points[0]?.horizonDays ?? 90,
        expectedImpact: 0.2,
        confidence: d.confidence,
        relatedRiskIds: [],
        relatedScenarioIds: [scenarioId],
        executiveSummary: `No acute risks; monitor ${d.domain} trajectory.`,
      });
    }

    return actions.slice(0, maxActions);
  }

  private resolveGraphContext(request: PredictionRequest): {
    graph: Graph | null;
    analysis: GraphAnalysisResult | null;
  } {
    if (request.graph && request.analysis) {
      return { graph: request.graph, analysis: request.analysis };
    }
    if (request.analysis && !request.graph) {
      return { graph: null, analysis: request.analysis };
    }
    if (this.buildAndAnalyze && request.graphInput) {
      const built = this.buildAndAnalyze(request.graphInput);
      return { graph: built.graph, analysis: built.analysis };
    }
    if (request.graph) {
      return { graph: request.graph, analysis: request.analysis ?? null };
    }
    return { graph: null, analysis: null };
  }
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function clampRiskClarity(riskCount: number): number {
  if (riskCount === 0) return 0.55;
  if (riskCount <= 3) return 0.75;
  if (riskCount <= 6) return 0.6;
  return 0.4;
}

function titleCase(domain: string): string {
  return domain
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function actionForDomain(domain: ForecastDomain): string {
  switch (domain) {
    case "enrollment":
      return "Launch targeted retention and re-enrollment outreach before the next horizon.";
    case "revenue":
      return "Tighten collections and protect high-yield programs against revenue slippage.";
    case "cash_flow":
      return "Defer non-critical spend and accelerate receivables to protect cash runway.";
    case "expense":
      return "Freeze discretionary expense and renegotiate vendor commitments.";
    case "payroll":
      return "Review hiring timing and overtime controls against payroll forecast.";
    case "staffing":
      return "Prioritize critical role coverage and pause non-essential backfills.";
    case "capacity":
      return "Rebalance classroom / campus capacity before utilization breaches.";
    case "admissions":
      return "Intensify admissions funnel conversion before inquiry volume softens further.";
    case "mission":
      return "Protect student-outcome initiatives most correlated with mission score.";
    case "risk":
      return "Escalate top cascade risks from the Executive Graph into weekly leadership review.";
    case "executive_kpi":
      return "Align founder priorities to the weakest projected KPI drivers.";
    default: {
      const _exhaustive: never = domain;
      return `Review ${_exhaustive} trajectory with executive leadership.`;
    }
  }
}

function extractDecisionBias(
  request: PredictionRequest
): Partial<Record<ForecastDomain, number>> {
  const simulations = request.decisionSimulations ?? request.decisionResult?.simulations;
  if (!simulations || simulations.length === 0) return {};

  const sim = simulations[0]!;
  const forecast = sim.forecast;
  const bias: Partial<Record<ForecastDomain, number>> = {};

  const enrollmentDelta =
    forecast.baseline.enrollment === 0
      ? 0
      : (forecast.projected.enrollment - forecast.baseline.enrollment) /
        forecast.baseline.enrollment;
  const revenueDelta =
    forecast.baseline.revenue === 0
      ? 0
      : (forecast.projected.revenue - forecast.baseline.revenue) /
        forecast.baseline.revenue;
  const payrollDelta =
    forecast.baseline.payroll === 0
      ? 0
      : (forecast.projected.payroll - forecast.baseline.payroll) /
        forecast.baseline.payroll;
  const staffDelta =
    forecast.baseline.staff === 0
      ? 0
      : (forecast.projected.staff - forecast.baseline.staff) /
        forecast.baseline.staff;

  bias.enrollment = 1 + enrollmentDelta * 0.5;
  bias.revenue = 1 + revenueDelta * 0.5;
  bias.payroll = 1 + payrollDelta * 0.5;
  bias.staffing = 1 + staffDelta * 0.5;
  bias.cash_flow = 1 + (revenueDelta - payrollDelta) * 0.35;
  bias.expense = 1 + payrollDelta * 0.4;
  bias.risk = 1 + Math.max(0, -enrollmentDelta) * 0.4;
  bias.executive_kpi = 1 + (enrollmentDelta + revenueDelta) * 0.15;

  return bias;
}

/** Alias matching Sprint 028 naming. */
export { PredictionEngineImpl as PredictionEngine };
