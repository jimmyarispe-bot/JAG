/**
 * Intelligence Platform Infrastructure — Predictive Intelligence module adapter (Sprint 028).
 *
 * Wraps existing createPredictiveIntelligence — does not regenerate Sprint 025–027.
 */

import {
  createPredictiveIntelligence,
  createForecastScenario,
  PREDICTIVE_INTELLIGENCE_VERSION,
  type CreatePredictiveIntelligenceOptions,
  type ForecastScenarioDefinition,
  type PredictiveIntelligenceStack,
} from "@/lib/platform/intelligence/predictive-intelligence";
import type {
  Graph,
  GraphAnalysisResult,
  GraphBuildInput,
} from "@/lib/platform/intelligence/executive-graph/types";
import type { ExecutiveDecisionResult } from "@/lib/platform/intelligence/executive-decision/types";
import type {
  IntelligenceExecutionContext,
  IntelligenceModule,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import { createModuleResult } from "@/lib/platform/intelligence/infrastructure/module-result";

export function createPredictiveIntelligenceModule(
  options: CreatePredictiveIntelligenceOptions = {},
  stack?: PredictiveIntelligenceStack
): IntelligenceModule {
  const predictive =
    stack ??
    createPredictiveIntelligence({
      ...options,
      wireGraphAnalyzer: options.wireGraphAnalyzer ?? false,
      wireDecision: options.wireDecision ?? false,
    });

  return {
    id: "predictive",
    name: "Predictive Intelligence",
    version: PREDICTIVE_INTELLIGENCE_VERSION,
    dependencies: ["executive-decision"],
    capabilities: [
      {
        key: "predictive.forecast",
        description: "Generate multi-horizon organizational forecasts",
      },
      {
        key: "predictive.trends",
        description: "Analyze accelerating and declining trends",
      },
      {
        key: "predictive.thresholds",
        description: "Predict threshold crossings and emerging risks",
      },
      {
        key: "predictive.actions",
        description: "Recommend preventive executive actions",
      },
    ],
    async execute(context: IntelligenceExecutionContext) {
      const startedAt = new Date().toISOString();
      try {
        const graphBundle = context.get<{
          graph?: Graph;
          analysis?: GraphAnalysisResult;
          graphInput?: GraphBuildInput;
        }>("executiveGraph");

        const decisionResult = context.get<ExecutiveDecisionResult>(
          "executiveDecision"
        );

        const input = context.input as
          | {
              scenarios?: ForecastScenarioDefinition[];
              question?: string;
              horizons?: number[];
            }
          | undefined;

        const scenarios =
          input?.scenarios && input.scenarios.length > 0
            ? input.scenarios
            : [
                createForecastScenario("baseline"),
                createForecastScenario("pessimistic", { magnitude: 0.1 }),
              ];

        const question =
          typeof input?.question === "string"
            ? input.question
            : "What organizational outcomes should leadership anticipate?";

        const result = predictive.service.predict({
          requestId: context.runId,
          question,
          scenarios,
          graph: graphBundle?.graph,
          analysis: graphBundle?.analysis,
          graphInput: graphBundle?.graphInput,
          decisionResult: decisionResult ?? undefined,
          decisionSimulations: decisionResult?.simulations,
          decisionBaseline: decisionResult?.baseline,
          scope: {
            organizationId: context.scope.organizationId ?? undefined,
            schoolId: context.scope.schoolId ?? undefined,
          },
          horizons: input?.horizons as
            | (30 | 90 | 180 | 365)[]
            | undefined,
        });

        context.set("predictive", result);

        return createModuleResult({
          moduleId: "predictive",
          context,
          startedAt,
          ok: true,
          data: result,
        });
      } catch (error) {
        return createModuleResult({
          moduleId: "predictive",
          context,
          startedAt,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  };
}
