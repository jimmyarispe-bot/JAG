/**
 * Intelligence Platform Infrastructure — Board & Governance module adapter (Sprint 029).
 *
 * Wraps existing createBoardGovernanceIntelligence — does not regenerate Sprint 025–028.
 */

import {
  createBoardGovernanceIntelligence,
  BOARD_GOVERNANCE_INTELLIGENCE_VERSION,
  type CreateBoardGovernanceOptions,
  type BoardGovernanceStack,
  type BoardPacketKind,
} from "@/lib/platform/intelligence/board-governance";
import type {
  Graph,
  GraphAnalysisResult,
  GraphBuildInput,
} from "@/lib/platform/intelligence/executive-graph/types";
import type { ExecutiveDecisionResult } from "@/lib/platform/intelligence/executive-decision/types";
import type { PredictionResult } from "@/lib/platform/intelligence/predictive-intelligence/types";
import type {
  IntelligenceExecutionContext,
  IntelligenceModule,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import { createModuleResult } from "@/lib/platform/intelligence/infrastructure/module-result";

export function createBoardGovernanceModule(
  options: CreateBoardGovernanceOptions = {},
  stack?: BoardGovernanceStack
): IntelligenceModule {
  const governance =
    stack ??
    createBoardGovernanceIntelligence({
      ...options,
      wireGraphAnalyzer: options.wireGraphAnalyzer ?? false,
      wireDecision: options.wireDecision ?? false,
      wirePredictive: options.wirePredictive ?? false,
    });

  return {
    id: "board-governance",
    name: "Board & Governance Intelligence",
    version: BOARD_GOVERNANCE_INTELLIGENCE_VERSION,
    dependencies: ["predictive"],
    capabilities: [
      {
        key: "governance.board_packet",
        description: "Generate monthly board packets and strategic reviews",
      },
      {
        key: "governance.executive_brief",
        description: "Produce executive briefings for board distribution",
      },
      {
        key: "governance.risk_register",
        description: "Maintain risk register and heat map",
      },
      {
        key: "governance.compliance",
        description: "Monitor compliance posture for board oversight",
      },
      {
        key: "governance.initiatives",
        description: "Track strategic initiatives and resolutions",
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
        const predictionResult = context.get<PredictionResult>("predictive");

        const input = context.input as
          | {
              question?: string;
              periodLabel?: string;
              packetKinds?: BoardPacketKind[];
            }
          | undefined;

        const question =
          typeof input?.question === "string"
            ? input.question
            : "What should the board review this cycle?";

        const result = governance.service.generate({
          requestId: context.runId,
          question,
          periodLabel: input?.periodLabel,
          packetKinds: input?.packetKinds,
          graph: graphBundle?.graph,
          analysis: graphBundle?.analysis,
          graphInput: graphBundle?.graphInput,
          decisionResult: decisionResult ?? undefined,
          predictionResult: predictionResult ?? undefined,
          scope: {
            organizationId: context.scope.organizationId ?? null,
            schoolId: context.scope.schoolId ?? null,
          },
        });

        context.set("boardGovernance", result);

        return createModuleResult({
          moduleId: "board-governance",
          context,
          startedAt,
          ok: true,
          data: result,
        });
      } catch (error) {
        return createModuleResult({
          moduleId: "board-governance",
          context,
          startedAt,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  };
}
