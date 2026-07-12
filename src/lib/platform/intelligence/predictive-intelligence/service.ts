/**
 * Predictive Intelligence — PredictionService (Sprint 028).
 *
 * Public façade over PredictionEngine with repository/history accessors.
 */

import type {
  ForecastHistory as ForecastHistoryContract,
  ForecastRepository as ForecastRepositoryContract,
  PredictionService as PredictionServiceContract,
  PredictiveIntelligenceDependencies,
} from "@/lib/platform/intelligence/predictive-intelligence/contracts";
import {
  PredictionEngine as PredictionEngineImpl,
  type PredictionEngine,
} from "@/lib/platform/intelligence/predictive-intelligence/prediction-engine";
import {
  baselineValueForDomain,
  deriveForecastBaseline,
  resolveDomains,
  seriesForDomain,
  synthesizeHistoricalSignals,
} from "@/lib/platform/intelligence/predictive-intelligence/models";
import { TrendAnalyzer as TrendAnalyzerEngine } from "@/lib/platform/intelligence/predictive-intelligence/trend-analyzer";
import type {
  ForecastBaseline,
  ForecastDomain,
  ForecastHorizonDays,
  ForecastQueryRequest,
  ForecastQueryResult,
  ForecastScenarioDefinition,
  PredictionRequest,
  PredictionResult,
  ScenarioForecast,
  TrendAnalysisResult,
} from "@/lib/platform/intelligence/predictive-intelligence/types";
import type {
  Graph,
  GraphAnalysisResult,
  GraphBuildInput,
} from "@/lib/platform/intelligence/executive-graph/types";
import type {
  DecisionBaseline,
  ExecutiveDecisionResult,
  ScenarioSimulationResult,
} from "@/lib/platform/intelligence/executive-decision/types";

export interface PredictionServiceDependencies
  extends PredictiveIntelligenceDependencies {
  engine?: PredictionEngine;
}

/**
 * PredictionService — Sprint 028 service entry point.
 */
export class PredictionServiceImpl implements PredictionServiceContract {
  private readonly engine: PredictionEngineImpl;
  private readonly trendAnalyzer = new TrendAnalyzerEngine();

  constructor(dependencies: PredictionServiceDependencies = {}) {
    this.engine =
      (dependencies.engine as PredictionEngineImpl | undefined) ??
      new PredictionEngineImpl(dependencies);
  }

  predict(request: PredictionRequest): PredictionResult {
    return this.engine.predict(request);
  }

  forecastScenario(
    scenario: ForecastScenarioDefinition,
    options: {
      graph?: Graph;
      analysis?: GraphAnalysisResult;
      graphInput?: GraphBuildInput;
      baselineOverrides?: Partial<ForecastBaseline>;
      horizons?: ForecastHorizonDays[];
      domains?: ForecastDomain[];
      decisionResult?: ExecutiveDecisionResult;
      decisionSimulations?: ScenarioSimulationResult[];
      decisionBaseline?: DecisionBaseline;
    } = {}
  ): ScenarioForecast {
    const result = this.engine.predict({
      requestId: `forecast-${scenario.id}`,
      question: scenario.description,
      scenarios: [scenario],
      graph: options.graph,
      analysis: options.analysis,
      graphInput: options.graphInput,
      baselineOverrides: options.baselineOverrides,
      horizons: options.horizons,
      domains: options.domains,
      decisionResult: options.decisionResult,
      decisionSimulations: options.decisionSimulations,
      decisionBaseline: options.decisionBaseline,
      scope: scenario.scope,
      maxActions: 3,
      maxRisks: 3,
    });

    const forecast = result.scenarioForecasts[0];
    if (forecast) return forecast;

    // Should not happen — synthesize empty shell for type safety
    return {
      scenario,
      domains: [],
      emergingRisks: [],
      preventiveActions: [],
      confidence: result.confidence,
      score: 0,
      generatedAt: result.generatedAt,
      summary: "Empty forecast.",
    };
  }

  analyzeTrends(request: PredictionRequest): TrendAnalysisResult[] {
    const baseline = deriveForecastBaseline(
      request.analysis ?? null,
      request.graphInput ?? null,
      request.decisionBaseline ?? null,
      request.baselineOverrides
    );
    const domains = resolveDomains(request.domains);
    const now = new Date();
    const signals =
      request.historicalSignals && request.historicalSignals.length > 0
        ? request.historicalSignals
        : synthesizeHistoricalSignals(baseline, domains, now);

    return domains.map((domain) =>
      this.trendAnalyzer.analyze({
        domain,
        series: seriesForDomain(signals, domain),
        baselineValue: baselineValueForDomain(baseline, domain),
      })
    );
  }

  query(
    result: PredictionResult,
    request: ForecastQueryRequest
  ): ForecastQueryResult {
    return this.engine.queries.ask(result, request);
  }

  history(): ForecastHistoryContract {
    return this.engine.history;
  }

  repository(): ForecastRepositoryContract {
    return this.engine.repository;
  }
}

/** Alias matching Sprint 028 naming. */
export { PredictionServiceImpl as PredictionService };
