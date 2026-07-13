/**
 * Intelligence Platform Infrastructure — Reputation module adapter (Sprint 051).
 *
 * Wraps createReputationIntelligence — terminal module after stakeholder.
 */
import {
  createReputationIntelligence,
  REPUTATION_INTELLIGENCE_VERSION,
  type CompetitiveResultLight,
  type CreateReputationOptions,
  type CustomerResultLight,
  type DecisionResultLight,
  type MarketResultLight,
  type OpportunityResultLight,
  type PoliticalResultLight,
  type PredictiveResultLight,
  type ReputationStack,
  type StakeholderResultLight,
} from "@/lib/platform/intelligence/reputation";
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

export function createReputationModule(
  options: CreateReputationOptions = {},
  stack?: ReputationStack
): IntelligenceModule {
  const reputation =
    stack ??
    createReputationIntelligence({
      ...options,
      wireOrganizationDna: options.wireOrganizationDna ?? false,
      wireOios: options.wireOios ?? false,
    });

  return {
    id: "reputation",
    name: "Reputation Intelligence",
    version: REPUTATION_INTELLIGENCE_VERSION,
    dependencies: ["stakeholder"],
    capabilities: [
      { key: "reputation.areas", description: "Seventeen-area reputation assessment" },
      { key: "reputation.forecasts", description: "Near, medium, and long-horizon reputation forecasts" },
      { key: "reputation.scenarios", description: "Ten reputation scenario monitors" },
      { key: "reputation.analysis", description: "Trust, sentiment, narrative, media, and crisis analysis" },
      { key: "reputation.early_warning", description: "Early warning alerts from worsening trends and high-prob scenarios" },
      { key: "reputation.learning", description: "Closed learning loop across seven intelligence domains" },
      { key: "reputation.recommendations", description: "Recommendations with the eight-field Reputation Lens" },
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
        const result = reputation.service.build({
          requestId: context.runId,
          question: input?.question ?? "Where is institutional reputation strongest or most fragile across trust, brand, media, and crisis exposure?",
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
          customerResult: read<CustomerResultLight>(context, "customer"),
          politicalResult: read<PoliticalResultLight>(context, "political"),
          competitiveResult: read<CompetitiveResultLight>(context, "competitive"),
          opportunityResult: read<OpportunityResultLight>(context, "opportunity"),
          decisionResult: read<DecisionResultLight>(context, "executiveDecision"),
          predictiveResult: read<PredictiveResultLight>(context, "predictive"),
          marketResult: read<MarketResultLight>(context, "market"),
        });
        context.set("reputation", result);
        return createModuleResult({ moduleId: "reputation", context, startedAt, ok: true, data: result });
      } catch (error) {
        return createModuleResult({
          moduleId: "reputation",
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
