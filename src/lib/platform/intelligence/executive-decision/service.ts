/**
 * Executive Decision Intelligence — ExecutiveDecisionService (Sprint 026).
 *
 * Public façade over DecisionEngine with scenario/history accessors.
 */

import type {
  DecisionHistory as DecisionHistoryContract,
  ExecutiveDecisionDependencies,
  ExecutiveDecisionService as ExecutiveDecisionServiceContract,
  ScenarioRepository as ScenarioRepositoryContract,
} from "@/lib/platform/intelligence/executive-decision/contracts";
import {
  DecisionEngine as DecisionEngineImpl,
  type DecisionEngine,
} from "@/lib/platform/intelligence/executive-decision/engine";
import { deriveBaseline } from "@/lib/platform/intelligence/executive-decision/models";
import type {
  DecisionBaseline,
  DecisionQueryRequest,
  DecisionQueryResult,
  DecisionScenarioDefinition,
  ExecutiveDecisionRecommendation,
  ExecutiveDecisionRequest,
  ExecutiveDecisionResult,
  ScenarioSimulationResult,
} from "@/lib/platform/intelligence/executive-decision/types";
import type {
  Graph,
  GraphAnalysisResult,
  GraphBuildInput,
} from "@/lib/platform/intelligence/executive-graph/types";

export interface ExecutiveDecisionServiceDependencies
  extends ExecutiveDecisionDependencies {
  engine?: DecisionEngine;
}

/**
 * ExecutiveDecisionService — Sprint 026 service entry point.
 */
export class ExecutiveDecisionServiceImpl implements ExecutiveDecisionServiceContract {
  private readonly engine: DecisionEngineImpl;

  constructor(dependencies: ExecutiveDecisionServiceDependencies = {}) {
    this.engine =
      (dependencies.engine as DecisionEngineImpl | undefined) ??
      new DecisionEngineImpl(dependencies);
  }

  evaluate(request: ExecutiveDecisionRequest): ExecutiveDecisionResult {
    return this.engine.evaluate(request);
  }

  simulateScenario(
    scenario: DecisionScenarioDefinition,
    options: {
      graph?: Graph;
      analysis?: GraphAnalysisResult;
      graphInput?: GraphBuildInput;
      baselineOverrides?: Partial<DecisionBaseline>;
      horizonMonths?: number;
    } = {}
  ): ScenarioSimulationResult {
    const result = this.engine.evaluate({
      requestId: `sim-${scenario.id}`,
      question: scenario.question,
      scenarios: [scenario],
      graph: options.graph,
      analysis: options.analysis,
      graphInput: options.graphInput,
      baselineOverrides: options.baselineOverrides,
      horizonMonths: options.horizonMonths,
      scope: scenario.scope,
      maxRecommendations: 1,
    });

    const simulation = result.simulations[0];
    if (!simulation) {
      // Should not happen — synthesize empty shell for type safety
      const baseline = deriveBaseline(
        options.analysis ?? null,
        options.graphInput ?? null,
        options.baselineOverrides ?? undefined
      );
      return {
        scenario,
        forecast: {
          id: "forecast-empty",
          scenarioId: scenario.id,
          baseline,
          projected: baseline,
          dimensions: [],
          financial: {
            revenueDelta: 0,
            costDelta: 0,
            netDelta: 0,
            roi: 0,
            paybackMonths: null,
            narrative: "No forecast produced.",
          },
          operational: {
            capacityDelta: 0,
            staffingDelta: 0,
            serviceLevelDelta: 0,
            narrative: "No operational impact.",
          },
          mission: {
            studentOutcomeDelta: 0,
            communityDelta: 0,
            brandDelta: 0,
            narrative: "No mission impact.",
          },
          cascadeSummaries: [],
          riskSummaries: [],
          confidence: result.confidence,
          horizonMonths: options.horizonMonths ?? 12,
          summary: "Empty simulation.",
        },
        tradeoffs: null,
        strategy: null,
        graphDerived: {
          rootCauseIds: [],
          cascadeIds: [],
          riskOriginIds: [],
          opportunityIds: [],
          graphRecommendationIds: [],
        },
        recommendations: [],
        confidence: result.confidence,
        simulatedAt: result.analyzedAt,
        summary: result.summary,
      };
    }
    return simulation;
  }

  recommend(request: ExecutiveDecisionRequest): ExecutiveDecisionRecommendation[] {
    return this.evaluate(request).recommendations;
  }

  query(
    result: ExecutiveDecisionResult,
    request: DecisionQueryRequest
  ): DecisionQueryResult {
    return this.engine.queries.ask(result, request);
  }

  history(): DecisionHistoryContract {
    return this.engine.history;
  }

  scenarios(): ScenarioRepositoryContract {
    return this.engine.scenarios;
  }
}

/** Alias matching Sprint 026 naming. */
export { ExecutiveDecisionServiceImpl as ExecutiveDecisionService };
