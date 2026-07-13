/**
 * Intelligence Platform Infrastructure — Cultural module adapter (Sprint 053).
 *
 * Wraps createCulturalIntelligence — terminal module after behavioral.
 */
import {
  createCulturalIntelligence,
  CULTURAL_INTELLIGENCE_VERSION,
  type CreateCulturalOptions,
  type CulturalStack,
  type BehavioralResultLight,
  type StakeholderResultLight,
  type HumanCapitalResultLight,
  type DecisionResultLight,
  type OpportunityResultLight,
  type PredictiveResultLight,
  type KnowledgeResultLight,
} from "@/lib/platform/intelligence/cultural";
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

export function createCulturalModule(
  options: CreateCulturalOptions = {},
  stack?: CulturalStack
): IntelligenceModule {
  const cultural =
    stack ??
    createCulturalIntelligence({
      ...options,
      wireOrganizationDna: options.wireOrganizationDna ?? false,
      wireOios: options.wireOios ?? false,
    });

  return {
    id: "cultural",
    name: "Cultural Intelligence",
    version: CULTURAL_INTELLIGENCE_VERSION,
    dependencies: ["behavioral"],
    capabilities: [
      { key: "cultural.areas", description: "Seventeen-area cultural assessment" },
      { key: "cultural.forecasts", description: "Near, medium, and long-horizon cultural forecasts" },
      { key: "cultural.scenarios", description: "Ten cultural scenario monitors" },
      { key: "cultural.analysis", description: "Culture mapping, mission, values, engagement, and collaboration analysis" },
      { key: "cultural.early_warning", description: "Early warning alerts from worsening trends and high-prob scenarios" },
      { key: "cultural.learning", description: "Closed learning loop across seven intelligence domains" },
      { key: "cultural.recommendations", description: "Recommendations with the eight-field Cultural Lens" },
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
        const behavioral = read<BehavioralResultLight & {
          healthScore?: { value?: number };
          decisionBehaviorScore?: { value?: number };
          motivationScore?: { value?: number };
          collaborationScore?: { value?: number };
        }>(context, "behavioral");
        const stakeholder = read<StakeholderResultLight & {
          health?: { trustScore?: number };
          baseline?: { trustLevel?: number; engagementQuality?: number; relationshipStrength?: number };
        }>(context, "stakeholder");
        const result = cultural.service.build({
          requestId: context.runId,
          question: input?.question ?? "Where is organizational culture strongest or most fragile across mission, values, engagement, and psychological safety?",
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
          behavioralResult: behavioral
            ? {
                ...behavioral,
                healthScore: behavioral.healthScore,
                decisionBehaviorScore: behavioral.decisionBehaviorScore,
                motivationScore: behavioral.motivationScore,
                collaborationScore: behavioral.collaborationScore,
              }
            : undefined,
          stakeholderResult: stakeholder
            ? {
                ...stakeholder,
                trustLevel: stakeholder.trustLevel ?? stakeholder.baseline?.trustLevel ?? stakeholder.health?.trustScore,
                engagementQuality: stakeholder.engagementQuality ?? stakeholder.baseline?.engagementQuality,
                relationshipStrength: stakeholder.relationshipStrength ?? stakeholder.baseline?.relationshipStrength,
              }
            : undefined,
          humanCapitalResult: read<HumanCapitalResultLight>(context, "humanCapital"),
          opportunityResult: read<OpportunityResultLight>(context, "opportunity"),
          decisionResult: read<DecisionResultLight>(context, "executiveDecision"),
          predictiveResult: read<PredictiveResultLight>(context, "predictive"),
          knowledgeResult: read<KnowledgeResultLight>(context, "knowledge"),
        });
        context.set("cultural", result);
        return createModuleResult({ moduleId: "cultural", context, startedAt, ok: true, data: result });
      } catch (error) {
        return createModuleResult({
          moduleId: "cultural",
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
