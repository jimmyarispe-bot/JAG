/**
 * Predictive Intelligence — contracts / interfaces only (Sprint 028).
 *
 * Leaf module: no imports from engine implementations (avoids cycles).
 */

import type {
  DomainForecast,
  EmergingRisk,
  ForecastBaseline,
  ForecastDomain,
  ForecastHistoryRecord,
  ForecastHorizonDays,
  ForecastProjectionResult,
  ForecastQueryRequest,
  ForecastQueryResult,
  ForecastScenarioDefinition,
  ForecastStatus,
  GraphScope,
  HistoricalSignal,
  PredictionConfidenceScore,
  PredictionRequest,
  PredictionResult,
  PreventiveAction,
  ScenarioForecast,
  ThresholdCrossing,
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

export interface ForecastScoring {
  scoreDomainForecast(input: {
    trend: TrendAnalysisResult;
    confidence: number;
    riskScore: number;
  }): number;
  scoreScenario(input: {
    domainScores: number[];
    confidence: number;
    riskCount: number;
  }): number;
  clamp01(value: number): number;
}

export interface PredictionConfidence {
  score(
    factors: Array<{ key: string; label: string; contribution: number }>
  ): PredictionConfidenceScore;
  fromValue(value: number): PredictionConfidenceScore;
  fromGraphAnalysis(
    analysis: GraphAnalysisResult | null | undefined
  ): PredictionConfidenceScore;
  fromSignals(signals: HistoricalSignal[]): PredictionConfidenceScore;
}

export interface TrendAnalyzer {
  analyze(input: {
    domain: ForecastDomain;
    series: number[];
    baselineValue: number;
  }): TrendAnalysisResult;
}

export interface ForecastEngine {
  forecastDomain(input: {
    domain: ForecastDomain;
    baselineValue: number;
    trend: TrendAnalysisResult;
    horizons: ForecastHorizonDays[];
    scenario: ForecastScenarioDefinition;
    now: Date;
  }): DomainForecast;
  detectThresholds(input: {
    domain: ForecastDomain;
    points: DomainForecast["points"];
    threshold: number | undefined;
    now: Date;
  }): ThresholdCrossing[];
}

export interface ForecastRepository {
  save(forecast: ScenarioForecast): ScenarioForecast;
  get(scenarioId: string): ScenarioForecast | null;
  list(scope?: Partial<GraphScope>): ScenarioForecast[];
  remove(scenarioId: string): boolean;
  clear(): void;
}

export interface ForecastQueries {
  ask(
    result: PredictionResult,
    request: ForecastQueryRequest
  ): ForecastQueryResult;
}

export interface ForecastProjection {
  project(input: {
    request: PredictionRequest;
    scenarioForecasts: ScenarioForecast[];
    confidence: PredictionConfidenceScore;
  }): ForecastProjectionResult;
}

export interface ForecastHistory {
  record(result: PredictionResult): ForecastHistoryRecord;
  get(id: string): ForecastHistoryRecord | null;
  list(scope?: Partial<GraphScope>): ForecastHistoryRecord[];
  updateStatus(id: string, status: ForecastStatus): ForecastHistoryRecord | null;
  clear(): void;
}

export interface PredictionEngine {
  predict(request: PredictionRequest): PredictionResult;
}

export interface PredictionService {
  predict(request: PredictionRequest): PredictionResult;
  forecastScenario(
    scenario: ForecastScenarioDefinition,
    options?: {
      graph?: Graph;
      analysis?: GraphAnalysisResult;
      graphInput?: GraphBuildInput;
      baselineOverrides?: Partial<ForecastBaseline>;
      horizons?: ForecastHorizonDays[];
      domains?: ForecastDomain[];
      decisionResult?: ExecutiveDecisionResult;
      decisionSimulations?: ScenarioSimulationResult[];
      decisionBaseline?: DecisionBaseline;
    }
  ): ScenarioForecast;
  analyzeTrends(
    request: PredictionRequest
  ): TrendAnalysisResult[];
  query(
    result: PredictionResult,
    request: ForecastQueryRequest
  ): ForecastQueryResult;
  history(): ForecastHistory;
  repository(): ForecastRepository;
}

/** DI bag for the full Predictive Intelligence stack. */
export interface PredictiveIntelligenceDependencies {
  scoring?: ForecastScoring;
  confidence?: PredictionConfidence;
  trendAnalyzer?: TrendAnalyzer;
  forecastEngine?: ForecastEngine;
  repository?: ForecastRepository;
  queries?: ForecastQueries;
  projection?: ForecastProjection;
  history?: ForecastHistory;
  engine?: PredictionEngine;
  /** Optional graph stack hooks. */
  buildAndAnalyze?: (input?: GraphBuildInput) => {
    graph: Graph;
    analysis: GraphAnalysisResult;
  };
  now?: () => Date;
  createId?: (prefix: string) => string;
}
