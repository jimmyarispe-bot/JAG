/**
 * Executive Decision Intelligence — public API (Sprint 026).
 *
 * Decision engine that sits on top of the Executive Graph Analyzer and allows
 * JAG to simulate strategic decisions before they are made.
 */

export {
  DECISION_CONFIDENCE_LEVELS,
  DECISION_IMPACT_DIMENSIONS,
  DECISION_PRIORITY_BANDS,
  DECISION_SCENARIO_KINDS,
  DECISION_STATUSES,
  DECISION_TIMING_OPTIONS,
  EXECUTIVE_DECISION_INTELLIGENCE_VERSION,
  STRATEGY_INITIATIVE_KINDS,
  type DecisionBaseline,
  type DecisionConfidenceLevel,
  type DecisionConfidenceScore,
  type DecisionDependencyItem,
  type DecisionEvidenceItem,
  type DecisionHistoryRecord,
  type DecisionImpactDimension,
  type DecisionMetadata,
  type DecisionPriorityBand,
  type DecisionProjectionResult,
  type DecisionQueryRequest,
  type DecisionQueryResult,
  type DecisionRiskItem,
  type DecisionScenarioDefinition,
  type DecisionScenarioKind,
  type DecisionStatus,
  type DecisionTimingOption,
  type DimensionImpact,
  type ExecutiveDecisionRecommendation,
  type ExecutiveDecisionRequest,
  type ExecutiveDecisionResult,
  type FinancialImpact,
  type ImpactForecastResult,
  type MissionImpact,
  type OperationalImpact,
  type ScenarioShock,
  type ScenarioSimulationResult,
  type StrategyAnalysisResult,
  type StrategyInitiative,
  type StrategyInitiativeKind,
  type StrategyRanking,
  type TradeoffAnalysisResult,
  type TradeoffItem,
} from "@/lib/platform/intelligence/executive-decision/types";

export type {
  DecisionConfidence as DecisionConfidenceContract,
  DecisionEngine as DecisionEngineContract,
  DecisionHistory as DecisionHistoryContract,
  DecisionProjection as DecisionProjectionContract,
  DecisionQueries as DecisionQueriesContract,
  DecisionScoring as DecisionScoringContract,
  ExecutiveDecisionDependencies,
  ExecutiveDecisionService as ExecutiveDecisionServiceContract,
  ImpactForecast as ImpactForecastContract,
  RecommendationEngine as RecommendationEngineContract,
  ScenarioRepository as ScenarioRepositoryContract,
  ScenarioSimulator as ScenarioSimulatorContract,
  StrategyEngine as StrategyEngineContract,
  TradeoffAnalyzer as TradeoffAnalyzerContract,
} from "@/lib/platform/intelligence/executive-decision/contracts";

export {
  applyShocksToBaseline,
  createPresetScenario,
  decisionModels,
  defaultBaseline,
  deriveBaseline,
} from "@/lib/platform/intelligence/executive-decision/models";

export {
  DecisionScoring,
  DecisionScoringEngine,
  clamp01,
  levelFromValue,
  priorityBandFromScore,
} from "@/lib/platform/intelligence/executive-decision/scoring";

export {
  DecisionConfidence,
  DecisionConfidenceEngine,
} from "@/lib/platform/intelligence/executive-decision/confidence";

export {
  ImpactForecast,
  ImpactForecastEngine,
} from "@/lib/platform/intelligence/executive-decision/impact-forecast";

export {
  TradeoffAnalyzer,
  TradeoffAnalyzerEngine,
} from "@/lib/platform/intelligence/executive-decision/tradeoff";

export {
  StrategyEngine,
  StrategyEngineImpl,
} from "@/lib/platform/intelligence/executive-decision/strategy";

export {
  ScenarioSimulator,
  ScenarioSimulatorEngine,
} from "@/lib/platform/intelligence/executive-decision/scenarios";

export {
  RecommendationEngine,
  RecommendationEngineImpl,
} from "@/lib/platform/intelligence/executive-decision/recommendations";

export {
  DecisionHistory,
  DecisionHistoryStore,
} from "@/lib/platform/intelligence/executive-decision/history";

export {
  ScenarioRepository,
  ScenarioRepositoryStore,
} from "@/lib/platform/intelligence/executive-decision/scenario-repository";

export {
  DecisionQueries,
  DecisionQueriesEngine,
} from "@/lib/platform/intelligence/executive-decision/queries";

export {
  DecisionProjection,
  DecisionProjectionEngine,
} from "@/lib/platform/intelligence/executive-decision/projection";

export {
  DecisionEngine,
  DecisionEngineImpl,
} from "@/lib/platform/intelligence/executive-decision/engine";

export {
  ExecutiveDecisionService,
  ExecutiveDecisionServiceImpl,
} from "@/lib/platform/intelligence/executive-decision/service";

import { DecisionEngine } from "@/lib/platform/intelligence/executive-decision/engine";
import type { ExecutiveDecisionDependencies } from "@/lib/platform/intelligence/executive-decision/contracts";
import { ExecutiveDecisionService } from "@/lib/platform/intelligence/executive-decision/service";
import {
  createExecutiveGraphAnalyzer,
  type CreateExecutiveGraphAnalyzerOptions,
  type ExecutiveGraphAnalyzerStack,
} from "@/lib/platform/intelligence/executive-graph";

/** Wired Executive Decision Intelligence stack. */
export interface ExecutiveDecisionStack {
  service: ExecutiveDecisionService;
  engine: DecisionEngine;
  graphAnalyzer: ExecutiveGraphAnalyzerStack | null;
}

export interface CreateExecutiveDecisionOptions extends ExecutiveDecisionDependencies {
  /** Attach / create an Executive Graph Analyzer for graphInput builds. */
  graphAnalyzer?: ExecutiveGraphAnalyzerStack;
  graphAnalyzerOptions?: CreateExecutiveGraphAnalyzerOptions;
  /** When true (default), auto-wire createExecutiveGraphAnalyzer if not provided. */
  wireGraphAnalyzer?: boolean;
}

/**
 * Create a fully wired Executive Decision Intelligence stack (DI entry point).
 */
export function createExecutiveDecisionIntelligence(
  options: CreateExecutiveDecisionOptions = {}
): ExecutiveDecisionStack {
  const wireGraph = options.wireGraphAnalyzer !== false;
  const graphAnalyzer =
    options.graphAnalyzer ??
    (wireGraph
      ? createExecutiveGraphAnalyzer(options.graphAnalyzerOptions ?? {})
      : null);

  const buildAndAnalyze =
    options.buildAndAnalyze ??
    (graphAnalyzer
      ? (input?: Parameters<ExecutiveGraphAnalyzerStack["buildAndAnalyze"]>[0]) =>
          graphAnalyzer.buildAndAnalyze(input)
      : undefined);

  const engine = new DecisionEngine({
    ...options,
    buildAndAnalyze,
  });

  const service = new ExecutiveDecisionService({
    ...options,
    engine,
    buildAndAnalyze,
  });

  return {
    service,
    engine,
    graphAnalyzer,
  };
}
