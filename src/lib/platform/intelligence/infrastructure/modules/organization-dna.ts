/**
 * Intelligence Platform Infrastructure — Organizational DNA module adapter (Sprint 030).
 *
 * Foundational module: no upstream dependencies. Later modules may consume
 * context key `organizationDna`. Optionally enriches from later context when
 * re-run; primary path builds from Company Builder seed in request input.
 */

import {
  createOrganizationDnaIntelligence,
  ORGANIZATION_DNA_VERSION,
  type CreateOrganizationDnaOptions,
  type OrganizationDnaStack,
  type CompanyBuilderSeed,
  type CompanyBuilderArtifactKind,
  type OrganizationStage,
} from "@/lib/platform/intelligence/organization-dna";
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

export function createOrganizationDnaModule(
  options: CreateOrganizationDnaOptions = {},
  stack?: OrganizationDnaStack
): IntelligenceModule {
  const dna =
    stack ??
    createOrganizationDnaIntelligence({
      ...options,
      wireGraphAnalyzer: options.wireGraphAnalyzer ?? false,
      wireDecision: options.wireDecision ?? false,
      wirePredictive: options.wirePredictive ?? false,
      wireBoardGovernance: options.wireBoardGovernance ?? false,
    });

  return {
    id: "organization-dna",
    name: "Organizational DNA & Company Builder",
    version: ORGANIZATION_DNA_VERSION,
    dependencies: [],
    capabilities: [
      {
        key: "dna.organizational_dna",
        description: "Generate foundational Organizational DNA",
      },
      {
        key: "dna.company_builder",
        description: "Build company artifacts from idea through exit",
      },
      {
        key: "dna.stage_detection",
        description: "Detect organization lifecycle stage",
      },
      {
        key: "dna.readiness",
        description: "Assess company readiness and score",
      },
      {
        key: "dna.blueprint_roadmap",
        description: "Produce executive blueprint and roadmap",
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
        const governanceResult = context.get<GovernanceResult>("boardGovernance");

        const input = context.input as
          | {
              question?: string;
              seed?: CompanyBuilderSeed;
              artifactKinds?: CompanyBuilderArtifactKind[];
              stageOverride?: OrganizationStage | null;
            }
          | undefined;

        const question =
          typeof input?.question === "string"
            ? input.question
            : "What is our organizational DNA and company blueprint?";

        const result = dna.service.build({
          requestId: context.runId,
          question,
          seed: input?.seed,
          artifactKinds: input?.artifactKinds,
          stageOverride: input?.stageOverride,
          graph: graphBundle?.graph,
          analysis: graphBundle?.analysis,
          graphInput: graphBundle?.graphInput,
          decisionResult: decisionResult ?? undefined,
          predictionResult: predictionResult ?? undefined,
          governanceResult: governanceResult ?? undefined,
          scope: {
            organizationId: context.scope.organizationId ?? null,
            schoolId: context.scope.schoolId ?? null,
          },
        });

        context.set("organizationDna", result);

        return createModuleResult({
          moduleId: "organization-dna",
          context,
          startedAt,
          ok: true,
          data: result,
        });
      } catch (error) {
        return createModuleResult({
          moduleId: "organization-dna",
          context,
          startedAt,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  };
}
