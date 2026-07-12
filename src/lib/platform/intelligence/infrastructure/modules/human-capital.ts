/**
 * Intelligence Platform Infrastructure — Human Capital module adapter (Sprint 032).
 *
 * Wraps existing createHumanCapitalIntelligence — does not regenerate Sprint 021–031.
 */

import {
  createHumanCapitalIntelligence,
  HUMAN_CAPITAL_INTELLIGENCE_VERSION,
  type CreateHumanCapitalOptions,
  type HumanCapitalStack,
} from "@/lib/platform/intelligence/human-capital";
import type { OrganizationDnaResult } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type {
  Graph,
  GraphAnalysisResult,
  GraphBuildInput,
} from "@/lib/platform/intelligence/executive-graph/types";
import type { ExecutiveDecisionResult } from "@/lib/platform/intelligence/executive-decision/types";
import type { PredictionResult } from "@/lib/platform/intelligence/predictive-intelligence/types";
import type { GovernanceResult } from "@/lib/platform/intelligence/board-governance/types";
import type {
  IntelligenceExecutionContext,
  IntelligenceModule,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import { createModuleResult } from "@/lib/platform/intelligence/infrastructure/module-result";

export function createHumanCapitalModule(
  options: CreateHumanCapitalOptions = {},
  stack?: HumanCapitalStack
): IntelligenceModule {
  const humanCapital =
    stack ??
    createHumanCapitalIntelligence({
      ...options,
      wireOrganizationDna: options.wireOrganizationDna ?? false,
      wireOios: options.wireOios ?? false,
    });

  return {
    id: "human-capital",
    name: "Human Capital Intelligence",
    version: HUMAN_CAPITAL_INTELLIGENCE_VERSION,
    dependencies: ["board-governance"],
    capabilities: [
      {
        key: "human_capital.workforce",
        description: "Workforce health, capacity, and planning intelligence",
      },
      {
        key: "human_capital.recruiting",
        description: "Candidate pipeline, scoring, and hiring recommendations",
      },
      {
        key: "human_capital.talent",
        description: "Retention, engagement, and talent risk intelligence",
      },
      {
        key: "human_capital.leadership",
        description: "Succession, bench strength, and leadership assessment",
      },
      {
        key: "human_capital.development",
        description: "Learning plans, coaching, and career pathing",
      },
      {
        key: "human_capital.compensation",
        description: "Salary benchmarking, pay equity, and incentives",
      },
    ],
    async execute(context: IntelligenceExecutionContext) {
      const startedAt = new Date().toISOString();
      try {
        const dnaResult = context.get<OrganizationDnaResult>("organizationDna");
        const oiosResult = context.get<OiosResult>("oios");
        const orgHealth = context.get<{
          workforce?: { score: number; status?: string };
        }>("organizationHealth");
        const graphBundle = context.get<{
          graph?: Graph;
          analysis?: GraphAnalysisResult;
          graphInput?: GraphBuildInput;
        }>("executiveGraph");
        const decisionResult =
          context.get<ExecutiveDecisionResult>("executiveDecision");
        const predictionResult = context.get<PredictionResult>("predictive");
        const governanceResult =
          context.get<GovernanceResult>("boardGovernance");

        const input = context.input as
          | {
              question?: string;
              periodLabel?: string;
            }
          | undefined;

        const result = humanCapital.service.build({
          requestId: context.runId,
          question:
            typeof input?.question === "string"
              ? input.question
              : "How healthy is our workforce and where should we invest in talent?",
          periodLabel: input?.periodLabel,
          dnaResult: dnaResult ?? undefined,
          dna: dnaResult?.dna,
          oiosResult: oiosResult ?? undefined,
          graph: graphBundle?.graph,
          analysis: graphBundle?.analysis,
          graphInput: graphBundle?.graphInput,
          decisionResult: decisionResult ?? undefined,
          predictionResult: predictionResult ?? undefined,
          governanceResult: governanceResult ?? undefined,
          workforceHealth: orgHealth?.workforce,
          scope: {
            organizationId: context.scope.organizationId ?? null,
            schoolId: context.scope.schoolId ?? null,
          },
        });

        context.set("humanCapital", result);

        return createModuleResult({
          moduleId: "human-capital",
          context,
          startedAt,
          ok: true,
          data: result,
        });
      } catch (error) {
        return createModuleResult({
          moduleId: "human-capital",
          context,
          startedAt,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  };
}
