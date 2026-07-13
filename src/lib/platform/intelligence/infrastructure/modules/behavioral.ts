/**
 * Intelligence Platform Infrastructure — Behavioral module adapter (Sprint 052).
 *
 * Wraps createBehavioralIntelligence — terminal module after reputation.
 */
import {
  createBehavioralIntelligence,
  BEHAVIORAL_INTELLIGENCE_VERSION,
  type CreateBehavioralOptions,
  type BehavioralStack,
  type StakeholderResultLight,
  type ReputationResultLight,
  type HumanCapitalResultLight,
  type CustomerResultLight,
  type DecisionResultLight,
  type OpportunityResultLight,
  type PredictiveResultLight,
  type KnowledgeResultLight,
} from "@/lib/platform/intelligence/behavioral";
import type {
  Graph,
  GraphAnalysisResult,
  GraphBuildInput,
} from "@/lib/platform/intelligence/executive-graph/types";
import type { OrganizationDnaResult } from "@/lib/platform/intelligence/organization-dna/types";
import type {
  IntelligenceExecutionContext,
  IntelligenceModule,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import { createModuleResult } from "@/lib/platform/intelligence/infrastructure/module-result";
import type { OiosResult } from "@/lib/platform/oios/types";

export function createBehavioralModule(
  options: CreateBehavioralOptions = {},
  stack?: BehavioralStack
): IntelligenceModule {
  const behavioral =
    stack ??
    createBehavioralIntelligence({
      ...options,
      wireOrganizationDna: options.wireOrganizationDna ?? false,
      wireOios: options.wireOios ?? false,
    });

  return {
    id: "behavioral",
    name: "Behavioral Intelligence",
    version: BEHAVIORAL_INTELLIGENCE_VERSION,
    dependencies: ["reputation"],
    capabilities: [
      { key: "behavioral.areas", description: "Seventeen-area behavioral assessment" },
      { key: "behavioral.forecasts", description: "Near, medium, and long-horizon behavioral forecasts" },
      { key: "behavioral.scenarios", description: "Ten behavioral scenario monitors" },
      { key: "behavioral.analysis", description: "Decision, bias, motivation, collaboration, and adoption analysis" },
      { key: "behavioral.early_warning", description: "Early warning alerts from worsening trends and high-prob scenarios" },
      { key: "behavioral.learning", description: "Closed learning loop across seven intelligence domains" },
      { key: "behavioral.recommendations", description: "Recommendations with the eight-field Behavioral Lens" },
    ],
    async execute(context: IntelligenceExecutionContext) {
      const startedAt = new Date().toISOString();
      try {
        const dnaResult = context.get<OrganizationDnaResult>("organizationDna");
        const oiosResult = context.get<OiosResult>("oios");
        const graph = context.get<{
          graph?: Graph;
          analysis?: GraphAnalysisResult;
          graphInput?: GraphBuildInput;
        }>("executiveGraph");
        const input = context.input as { question?: string; periodLabel?: string } | undefined;
        const stakeholder = read<StakeholderResultLight & {
          health?: { trustScore?: number };
          baseline?: { trustLevel?: number; engagementQuality?: number; relationshipStrength?: number };
        }>(context, "stakeholder");
        const reputation = read<ReputationResultLight & {
          healthScore?: { value?: number };
          baseline?: { trustLevel?: number; brandStrength?: number; crisisRisk?: number };
          health?: { trustScore?: number; brandScore?: number; crisisScore?: number };
        }>(context, "reputation");
        const result = behavioral.service.build({
          requestId: context.runId,
          question: input?.question ?? "Where is organizational behavior strongest or most fragile across decisions, motivation, change adoption, and collaboration?",
          periodLabel: input?.periodLabel,
          scope: {
            organizationId: context.scope.organizationId ?? null,
            schoolId: context.scope.schoolId ?? null,
          },
          dnaResult: dnaResult ?? undefined,
          dna: dnaResult?.dna,
          oiosResult: oiosResult ?? undefined,
          graph: graph?.graph,
          analysis: graph?.analysis,
          graphInput: graph?.graphInput,
          stakeholderResult: stakeholder
            ? {
                ...stakeholder,
                trustLevel: stakeholder.trustLevel ?? stakeholder.baseline?.trustLevel ?? stakeholder.health?.trustScore,
                engagementQuality: stakeholder.engagementQuality ?? stakeholder.baseline?.engagementQuality,
                relationshipStrength: stakeholder.relationshipStrength ?? stakeholder.baseline?.relationshipStrength,
              }
            : undefined,
          reputationResult: reputation
            ? {
                ...reputation,
                reputationScore: reputation.reputationScore ?? reputation.healthScore,
                trustLevel: reputation.trustLevel ?? reputation.baseline?.trustLevel ?? reputation.health?.trustScore,
                brandStrength: reputation.brandStrength ?? reputation.baseline?.brandStrength ?? reputation.health?.brandScore,
                crisisRisk: reputation.crisisRisk ?? reputation.baseline?.crisisRisk ?? reputation.health?.crisisScore,
              }
            : undefined,
          humanCapitalResult: read<HumanCapitalResultLight>(context, "humanCapital"),
          customerResult: read<CustomerResultLight>(context, "customer"),
          opportunityResult: read<OpportunityResultLight>(context, "opportunity"),
          decisionResult: read<DecisionResultLight>(context, "executiveDecision"),
          predictiveResult: read<PredictiveResultLight>(context, "predictive"),
          knowledgeResult: read<KnowledgeResultLight>(context, "knowledge"),
        });
        context.set("behavioral", result);
        return createModuleResult({ moduleId: "behavioral", context, startedAt, ok: true, data: result });
      } catch (error) {
        return createModuleResult({
          moduleId: "behavioral",
          context,
          startedAt,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  };
}

function read<T>(context: IntelligenceExecutionContext, key: string): T | undefined {
  return context.get<T>(key) ?? undefined;
}
