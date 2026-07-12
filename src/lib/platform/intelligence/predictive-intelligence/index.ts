/**
 * Predictive Intelligence — public API (Sprint 028).
 *
 * Forecasting layer that sits on Executive Graph + Executive Decision
 * intelligence to predict organizational outcomes and recommend prevention.
 */

export {
  FORECAST_DOMAINS,
  FORECAST_HORIZONS,
  FORECAST_PRIORITY_BANDS,
  FORECAST_SCENARIO_KINDS,
  FORECAST_STATUSES,
  PREDICTIVE_INTELLIGENCE_VERSION,
  PREDICTION_CONFIDENCE_LEVELS,
  THRESHOLD_SEVERITIES,
  TREND_DIRECTIONS,
  type DomainForecast,
  type EmergingRisk,
  type ForecastBaseline,
  type ForecastDomain,
  type ForecastHistoryRecord,
  type ForecastHorizonDays,
  type ForecastMetadata,
  type ForecastPoint,
  type ForecastPriorityBand,
  type ForecastProjectionResult,
  type ForecastQueryRequest,
  type ForecastQueryResult,
  type ForecastScenarioDefinition,
  type ForecastScenarioKind,
  type ForecastStatus,
  type GraphScope,
  type HistoricalSignal,
  type PredictionConfidenceLevel,
  type PredictionConfidenceScore,
  type PredictionRequest,
  type PredictionResult,
  type PreventiveAction,
  type ScenarioForecast,
  type ThresholdCrossing,
  type ThresholdSeverity,
  type TrendAnalysisResult,
  type TrendDirection,
} from "@/lib/platform/intelligence/predictive-intelligence/types";

export type {
  ForecastEngine as ForecastEngineContract,
  ForecastHistory as ForecastHistoryContract,
  ForecastProjection as ForecastProjectionContract,
  ForecastQueries as ForecastQueriesContract,
  ForecastRepository as ForecastRepositoryContract,
  ForecastScoring as ForecastScoringContract,
  PredictionConfidence as PredictionConfidenceContract,
  PredictionEngine as PredictionEngineContract,
  PredictionService as PredictionServiceContract,
  PredictiveIntelligenceDependencies,
  TrendAnalyzer as TrendAnalyzerContract,
} from "@/lib/platform/intelligence/predictive-intelligence/contracts";

export {
  baselineValueForDomain,
  createForecastScenario,
  defaultForecastBaseline,
  defaultForecastScenarios,
  defaultThresholds,
  deriveForecastBaseline,
  predictionModels,
  resolveDomains,
  resolveHorizons,
  seriesForDomain,
  synthesizeHistoricalSignals,
} from "@/lib/platform/intelligence/predictive-intelligence/models";

export {
  ForecastScoring,
  ForecastScoringEngine,
  clamp01,
  levelFromValue,
  priorityBandFromScore,
} from "@/lib/platform/intelligence/predictive-intelligence/scoring";

export {
  PredictionConfidence,
  PredictionConfidenceEngine,
} from "@/lib/platform/intelligence/predictive-intelligence/confidence";

export {
  TrendAnalyzer,
  TrendAnalyzerEngine,
} from "@/lib/platform/intelligence/predictive-intelligence/trend-analyzer";

export {
  ForecastEngine,
  ForecastEngineImpl,
} from "@/lib/platform/intelligence/predictive-intelligence/forecast-engine";

export {
  ForecastRepository,
  ForecastRepositoryStore,
} from "@/lib/platform/intelligence/predictive-intelligence/forecast-repository";

export {
  ForecastQueries,
  ForecastQueriesEngine,
} from "@/lib/platform/intelligence/predictive-intelligence/queries";

export {
  ForecastProjection,
  ForecastProjectionEngine,
} from "@/lib/platform/intelligence/predictive-intelligence/projection";

export {
  ForecastHistory,
  ForecastHistoryStore,
} from "@/lib/platform/intelligence/predictive-intelligence/history";

export {
  PredictionEngine,
  PredictionEngineImpl,
} from "@/lib/platform/intelligence/predictive-intelligence/prediction-engine";

export {
  PredictionService,
  PredictionServiceImpl,
} from "@/lib/platform/intelligence/predictive-intelligence/service";

import { PredictionEngine } from "@/lib/platform/intelligence/predictive-intelligence/prediction-engine";
import type { PredictiveIntelligenceDependencies } from "@/lib/platform/intelligence/predictive-intelligence/contracts";
import { PredictionService } from "@/lib/platform/intelligence/predictive-intelligence/service";
import {
  createExecutiveDecisionIntelligence,
  type CreateExecutiveDecisionOptions,
  type ExecutiveDecisionStack,
} from "@/lib/platform/intelligence/executive-decision";
import {
  createExecutiveGraphAnalyzer,
  type CreateExecutiveGraphAnalyzerOptions,
  type ExecutiveGraphAnalyzerStack,
} from "@/lib/platform/intelligence/executive-graph";

/** Wired Predictive Intelligence stack. */
export interface PredictiveIntelligenceStack {
  service: PredictionService;
  engine: PredictionEngine;
  graphAnalyzer: ExecutiveGraphAnalyzerStack | null;
  decision: ExecutiveDecisionStack | null;
}

export interface CreatePredictiveIntelligenceOptions
  extends PredictiveIntelligenceDependencies {
  /** Attach / create an Executive Graph Analyzer for graphInput builds. */
  graphAnalyzer?: ExecutiveGraphAnalyzerStack;
  graphAnalyzerOptions?: CreateExecutiveGraphAnalyzerOptions;
  /** When true (default), auto-wire createExecutiveGraphAnalyzer if not provided. */
  wireGraphAnalyzer?: boolean;
  /** Attach / create Executive Decision Intelligence for decision-linked forecasts. */
  decision?: ExecutiveDecisionStack;
  decisionOptions?: CreateExecutiveDecisionOptions;
  /** When true (default), auto-wire createExecutiveDecisionIntelligence if not provided. */
  wireDecision?: boolean;
}

/**
 * Create a fully wired Predictive Intelligence stack (DI entry point).
 */
export function createPredictiveIntelligence(
  options: CreatePredictiveIntelligenceOptions = {}
): PredictiveIntelligenceStack {
  const wireGraph = options.wireGraphAnalyzer !== false;
  const wireDecision = options.wireDecision !== false;

  const graphAnalyzer =
    options.graphAnalyzer ??
    (wireGraph
      ? createExecutiveGraphAnalyzer(options.graphAnalyzerOptions ?? {})
      : null);

  const decision =
    options.decision ??
    (wireDecision
      ? createExecutiveDecisionIntelligence({
          ...(options.decisionOptions ?? {}),
          graphAnalyzer:
            options.decisionOptions?.graphAnalyzer ?? graphAnalyzer ?? undefined,
          wireGraphAnalyzer: false,
        })
      : null);

  const buildAndAnalyze =
    options.buildAndAnalyze ??
    (graphAnalyzer
      ? (input?: Parameters<ExecutiveGraphAnalyzerStack["buildAndAnalyze"]>[0]) =>
          graphAnalyzer.buildAndAnalyze(input)
      : undefined);

  const engine = new PredictionEngine({
    ...options,
    buildAndAnalyze,
  });

  const service = new PredictionService({
    ...options,
    engine,
    buildAndAnalyze,
  });

  return {
    service,
    engine,
    graphAnalyzer,
    decision,
  };
}
