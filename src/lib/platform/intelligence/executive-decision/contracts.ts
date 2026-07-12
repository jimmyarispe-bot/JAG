/**
 * Executive Decision Intelligence — contracts / interfaces only (Sprint 026).
 *
 * Leaf module: no imports from engine implementations (avoids cycles).
 */

import type {
  DecisionBaseline,
  DecisionConfidenceScore,
  DecisionHistoryRecord,
  DecisionProjectionResult,
  DecisionQueryRequest,
  DecisionQueryResult,
  DecisionScenarioDefinition,
  DecisionStatus,
  ExecutiveDecisionRecommendation,
  ExecutiveDecisionRequest,
  ExecutiveDecisionResult,
  GraphScope,
  ImpactForecastResult,
  ScenarioSimulationResult,
  StrategyAnalysisResult,
  StrategyInitiative,
  TradeoffAnalysisResult,
} from "@/lib/platform/intelligence/executive-decision/types";
import type {
  Graph,
  GraphAnalysisResult,
  GraphBuildInput,
} from "@/lib/platform/intelligence/executive-graph/types";

export interface DecisionScoring {
  scoreRoi(investment: number, expectedReturn: number, months: number): number;
  scoreComposite(input: {
    roi: number;
    mission: number;
    risk: number;
    confidence: number;
  }): number;
  clamp01(value: number): number;
}

export interface DecisionConfidence {
  score(
    factors: Array<{ key: string; label: string; contribution: number }>
  ): DecisionConfidenceScore;
  fromValue(value: number): DecisionConfidenceScore;
  fromGraphAnalysis(analysis: GraphAnalysisResult | null | undefined): DecisionConfidenceScore;
}

export interface ImpactForecast {
  forecast(input: {
    scenario: DecisionScenarioDefinition;
    baseline: DecisionBaseline;
    analysis: GraphAnalysisResult | null;
    horizonMonths: number;
  }): ImpactForecastResult;
}

export interface TradeoffAnalyzer {
  analyze(input: {
    scenario: DecisionScenarioDefinition;
    forecasts: ImpactForecastResult[];
    labels?: string[];
  }): TradeoffAnalysisResult;
}

export interface StrategyEngine {
  rank(input: {
    scenarioId: string;
    initiatives: StrategyInitiative[];
    baseline: DecisionBaseline;
    analysis: GraphAnalysisResult | null;
  }): StrategyAnalysisResult;
}

export interface ScenarioSimulator {
  simulate(input: {
    scenario: DecisionScenarioDefinition;
    baseline: DecisionBaseline;
    graph: Graph | null;
    analysis: GraphAnalysisResult | null;
    horizonMonths: number;
  }): ScenarioSimulationResult;
}

export interface RecommendationEngine {
  generate(input: {
    request: ExecutiveDecisionRequest;
    baseline: DecisionBaseline;
    simulations: ScenarioSimulationResult[];
    analysis: GraphAnalysisResult | null;
    maxRecommendations?: number;
  }): ExecutiveDecisionRecommendation[];
}

export interface DecisionHistory {
  record(result: ExecutiveDecisionResult): DecisionHistoryRecord;
  get(id: string): DecisionHistoryRecord | null;
  list(scope?: Partial<GraphScope>): DecisionHistoryRecord[];
  updateStatus(id: string, status: DecisionStatus): DecisionHistoryRecord | null;
  clear(): void;
}

export interface ScenarioRepository {
  save(scenario: DecisionScenarioDefinition): DecisionScenarioDefinition;
  get(scenarioId: string): DecisionScenarioDefinition | null;
  list(scope?: Partial<GraphScope>): DecisionScenarioDefinition[];
  remove(scenarioId: string): boolean;
  clear(): void;
}

export interface DecisionQueries {
  ask(
    result: ExecutiveDecisionResult,
    request: DecisionQueryRequest
  ): DecisionQueryResult;
}

export interface DecisionProjection {
  project(input: {
    request: ExecutiveDecisionRequest;
    recommendations: ExecutiveDecisionRecommendation[];
    simulations: ScenarioSimulationResult[];
    confidence: DecisionConfidenceScore;
  }): DecisionProjectionResult;
}

export interface DecisionEngine {
  evaluate(request: ExecutiveDecisionRequest): ExecutiveDecisionResult;
}

export interface ExecutiveDecisionService {
  evaluate(request: ExecutiveDecisionRequest): ExecutiveDecisionResult;
  simulateScenario(
    scenario: DecisionScenarioDefinition,
    options?: {
      graph?: Graph;
      analysis?: GraphAnalysisResult;
      graphInput?: GraphBuildInput;
      baselineOverrides?: Partial<DecisionBaseline>;
      horizonMonths?: number;
    }
  ): ScenarioSimulationResult;
  recommend(request: ExecutiveDecisionRequest): ExecutiveDecisionRecommendation[];
  query(
    result: ExecutiveDecisionResult,
    request: DecisionQueryRequest
  ): DecisionQueryResult;
  history(): DecisionHistory;
  scenarios(): ScenarioRepository;
}

/** DI bag for the full Executive Decision Intelligence stack. */
export interface ExecutiveDecisionDependencies {
  scoring?: DecisionScoring;
  confidence?: DecisionConfidence;
  impactForecast?: ImpactForecast;
  tradeoff?: TradeoffAnalyzer;
  strategy?: StrategyEngine;
  simulator?: ScenarioSimulator;
  recommendations?: RecommendationEngine;
  history?: DecisionHistory;
  scenarioRepository?: ScenarioRepository;
  queries?: DecisionQueries;
  projection?: DecisionProjection;
  engine?: DecisionEngine;
  /** Optional graph stack hooks. */
  buildAndAnalyze?: (input?: GraphBuildInput) => {
    graph: Graph;
    analysis: GraphAnalysisResult;
  };
  now?: () => Date;
  createId?: (prefix: string) => string;
}
