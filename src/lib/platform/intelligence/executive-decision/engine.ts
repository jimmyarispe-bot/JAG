/**
 * Executive Decision Intelligence — DecisionEngine (Sprint 026).
 *
 * Orchestrates scenario simulation, recommendations, projection, and history.
 */

import type {
  DecisionConfidence as DecisionConfidenceContract,
  DecisionEngine as DecisionEngineContract,
  DecisionHistory as DecisionHistoryContract,
  DecisionProjection as DecisionProjectionContract,
  DecisionQueries as DecisionQueriesContract,
  ExecutiveDecisionDependencies,
  RecommendationEngine as RecommendationEngineContract,
  ScenarioRepository as ScenarioRepositoryContract,
  ScenarioSimulator as ScenarioSimulatorContract,
} from "@/lib/platform/intelligence/executive-decision/contracts";
import { DecisionConfidenceEngine } from "@/lib/platform/intelligence/executive-decision/confidence";
import { DecisionHistory as DecisionHistoryStore } from "@/lib/platform/intelligence/executive-decision/history";
import { deriveBaseline } from "@/lib/platform/intelligence/executive-decision/models";
import { DecisionProjection as DecisionProjectionEngine } from "@/lib/platform/intelligence/executive-decision/projection";
import { DecisionQueries as DecisionQueriesEngine } from "@/lib/platform/intelligence/executive-decision/queries";
import { RecommendationEngine as RecommendationEngineImpl } from "@/lib/platform/intelligence/executive-decision/recommendations";
import { ScenarioRepository as ScenarioRepositoryStore } from "@/lib/platform/intelligence/executive-decision/scenario-repository";
import { ScenarioSimulator as ScenarioSimulatorEngine } from "@/lib/platform/intelligence/executive-decision/scenarios";
import type {
  ExecutiveDecisionRequest,
  ExecutiveDecisionResult,
  GraphScope,
  ScenarioSimulationResult,
} from "@/lib/platform/intelligence/executive-decision/types";
import { EXECUTIVE_DECISION_INTELLIGENCE_VERSION } from "@/lib/platform/intelligence/executive-decision/types";
import type {
  Graph,
  GraphAnalysisResult,
} from "@/lib/platform/intelligence/executive-graph/types";

export interface DecisionEngineDependencies extends ExecutiveDecisionDependencies {}

/**
 * DecisionEngine — core orchestrator for executive what-if decision intelligence.
 */
export class DecisionEngineImpl implements DecisionEngineContract {
  private readonly confidence: DecisionConfidenceContract;
  private readonly simulator: ScenarioSimulatorContract;
  private readonly recommendations: RecommendationEngineContract;
  private readonly projection: DecisionProjectionContract;
  private readonly historyStore: DecisionHistoryContract;
  private readonly scenarioRepository: ScenarioRepositoryContract;
  private readonly buildAndAnalyze:
    | ((input?: ExecutiveDecisionRequest["graphInput"]) => {
        graph: Graph;
        analysis: GraphAnalysisResult;
      })
    | null;
  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;

  readonly queries: DecisionQueriesContract;

  constructor(dependencies: DecisionEngineDependencies = {}) {
    const now = dependencies.now ?? (() => new Date());
    const createId =
      dependencies.createId ??
      ((prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);

    this.now = now;
    this.createId = createId;
    this.buildAndAnalyze = dependencies.buildAndAnalyze ?? null;

    this.confidence = dependencies.confidence ?? new DecisionConfidenceEngine();
    this.simulator =
      dependencies.simulator ??
      new ScenarioSimulatorEngine({
        confidence: this.confidence,
        now,
        createId,
        impactForecast: dependencies.impactForecast,
        tradeoff: dependencies.tradeoff,
        strategy: dependencies.strategy,
      });
    this.recommendations =
      dependencies.recommendations ??
      new RecommendationEngineImpl({ confidence: this.confidence, createId });
    this.projection =
      dependencies.projection ?? new DecisionProjectionEngine({ now });
    this.historyStore = dependencies.history ?? new DecisionHistoryStore();
    this.scenarioRepository =
      dependencies.scenarioRepository ?? new ScenarioRepositoryStore();
    this.queries =
      dependencies.queries ?? new DecisionQueriesEngine({ confidence: this.confidence });
  }

  get history(): DecisionHistoryContract {
    return this.historyStore;
  }

  get scenarios(): ScenarioRepositoryContract {
    return this.scenarioRepository;
  }

  evaluate(request: ExecutiveDecisionRequest): ExecutiveDecisionResult {
    const { graph, analysis } = this.resolveGraphContext(request);
    const baseline = deriveBaseline(
      analysis,
      request.graphInput,
      request.baselineOverrides
    );
    const horizonMonths = request.horizonMonths ?? 12;

    for (const scenario of request.scenarios) {
      this.scenarioRepository.save(scenario);
    }

    const simulations: ScenarioSimulationResult[] = request.scenarios.map((scenario) =>
      this.simulator.simulate({
        scenario,
        baseline,
        graph,
        analysis,
        horizonMonths,
      })
    );

    const recommendations = this.recommendations.generate({
      request,
      baseline,
      simulations,
      analysis,
      maxRecommendations: request.maxRecommendations,
    });

    // Attach recommendations back onto simulations by scenario id
    const enrichedSimulations = simulations.map((simulation) => ({
      ...simulation,
      recommendations: recommendations.filter((r) =>
        r.relatedScenarioIds.includes(simulation.scenario.id)
      ),
    }));

    const confidence = this.confidence.score([
      {
        key: "graph",
        label: "Graph analysis",
        contribution: this.confidence.fromGraphAnalysis(analysis).value * 0.35,
      },
      {
        key: "simulations",
        label: "Simulation confidence",
        contribution:
          enrichedSimulations.length === 0
            ? 0.1
            : (enrichedSimulations.reduce((s, x) => s + x.confidence.value, 0) /
                enrichedSimulations.length) *
              0.35,
      },
      {
        key: "recommendations",
        label: "Recommendation confidence",
        contribution:
          recommendations.length === 0
            ? 0.1
            : (recommendations.reduce((s, r) => s + r.confidenceScore.value, 0) /
                recommendations.length) *
              0.3,
      },
    ]);

    const projection = this.projection.project({
      request,
      recommendations,
      simulations: enrichedSimulations,
      confidence,
    });

    const scope: GraphScope = {
      organizationId: request.scope?.organizationId ?? null,
      schoolId: request.scope?.schoolId ?? null,
      regionId: request.scope?.regionId ?? null,
      campusId: request.scope?.campusId ?? null,
    };

    const analyzedAt = this.now().toISOString();
    const historyRecord = {
      id: this.createId("history"),
      requestId: request.requestId,
      question: request.question,
      status: "recommended" as const,
      createdAt: analyzedAt,
      updatedAt: analyzedAt,
      scope,
      selectedRecommendationId: recommendations[0]?.id ?? null,
      scenarioIds: request.scenarios.map((s) => s.id),
      projectionHeadline: projection.headline,
      confidence,
      metadata: request.metadata ?? {},
    };

    const result: ExecutiveDecisionResult = {
      requestId: request.requestId,
      question: request.question,
      analyzedAt,
      status: "recommended",
      baseline,
      simulations: enrichedSimulations,
      recommendations,
      projection,
      historyRecord,
      graphId: graph?.id ?? analysis?.graphId ?? null,
      confidence,
      summary: projection.headline,
      metadata: {
        version: EXECUTIVE_DECISION_INTELLIGENCE_VERSION,
        analyzer: "DecisionEngine",
        ...(request.metadata ?? {}),
      },
    };

    this.historyStore.record(result);
    return result;
  }

  private resolveGraphContext(request: ExecutiveDecisionRequest): {
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

/** Alias matching Sprint 026 naming. */
export { DecisionEngineImpl as DecisionEngine };
