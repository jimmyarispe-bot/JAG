/**
 * Intelligence Platform Infrastructure — Executive Decision module adapter (Sprint 027).
 *
 * Wraps existing createExecutiveDecisionIntelligence — does not regenerate Sprint 026.
 */

import {
  createExecutiveDecisionIntelligence,
  createPresetScenario,
  EXECUTIVE_DECISION_INTELLIGENCE_VERSION,
  type CreateExecutiveDecisionOptions,
  type DecisionScenarioDefinition,
  type ExecutiveDecisionStack,
} from "@/lib/platform/intelligence/executive-decision";
import type {
  Graph,
  GraphAnalysisResult,
  GraphBuildInput,
} from "@/lib/platform/intelligence/executive-graph/types";
import type {
  IntelligenceExecutionContext,
  IntelligenceModule,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import { createModuleResult } from "@/lib/platform/intelligence/infrastructure/module-result";

export function createExecutiveDecisionModule(
  options: CreateExecutiveDecisionOptions = {},
  stack?: ExecutiveDecisionStack
): IntelligenceModule {
  const decision =
    stack ??
    createExecutiveDecisionIntelligence({
      ...options,
      wireGraphAnalyzer: options.wireGraphAnalyzer ?? false,
    });

  return {
    id: "executive-decision",
    name: "Executive Decision Intelligence",
    version: EXECUTIVE_DECISION_INTELLIGENCE_VERSION,
    dependencies: ["executive-graph"],
    capabilities: [
      { key: "decision.evaluate", description: "Evaluate strategic what-if decisions" },
      { key: "decision.simulate", description: "Simulate decision scenarios" },
    ],
    async execute(context: IntelligenceExecutionContext) {
      const startedAt = new Date().toISOString();
      try {
        const graphBundle = context.get<{
          graph?: Graph;
          analysis?: GraphAnalysisResult;
          graphInput?: GraphBuildInput;
        }>("executiveGraph");

        const input = context.input as
          | {
              scenarios?: DecisionScenarioDefinition[];
              question?: string;
            }
          | undefined;

        const scenarios =
          input?.scenarios && input.scenarios.length > 0
            ? input.scenarios
            : [createPresetScenario("enrollment_drop", { magnitude: 0.1 })];

        const question =
          typeof input?.question === "string"
            ? input.question
            : "Which strategic moves should leadership simulate?";

        const result = decision.service.evaluate({
          requestId: context.runId,
          question,
          scenarios,
          graph: graphBundle?.graph,
          analysis: graphBundle?.analysis,
          graphInput: graphBundle?.graphInput,
          scope: {
            organizationId: context.scope.organizationId ?? undefined,
            schoolId: context.scope.schoolId ?? undefined,
          },
        });

        context.set("executiveDecision", result);

        return createModuleResult({
          moduleId: "executive-decision",
          context,
          startedAt,
          ok: true,
          data: result,
        });
      } catch (error) {
        return createModuleResult({
          moduleId: "executive-decision",
          context,
          startedAt,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  };
}
