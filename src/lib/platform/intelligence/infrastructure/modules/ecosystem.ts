/**
 * Intelligence Platform Infrastructure - Ecosystem module adapter (Sprint 057).
 *
 * Wraps createEcosystemIntelligence - terminal module after resilience.
 */
import {
  createEcosystemIntelligence,
  ECOSYSTEM_INTELLIGENCE_VERSION,
  type CreateEcosystemOptions,
  type EcosystemStack,
  type StakeholderResultLight,
  type CompetitiveResultLight,
  type MarketResultLight,
  type SystemsResultLight,
  type ResilienceResultLight,
  type OpportunityResultLight,
  type DecisionResultLight,
  type PredictiveResultLight,
} from "@/lib/platform/intelligence/ecosystem";
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

export function createEcosystemModule(
  options: CreateEcosystemOptions = {},
  stack?: EcosystemStack
): IntelligenceModule {
  const ecosystem =
    stack ??
    createEcosystemIntelligence({
      ...options,
      wireOrganizationDna: options.wireOrganizationDna ?? false,
      wireOios: options.wireOios ?? false,
    });

  return {
    id: "ecosystem",
    name: "Ecosystem Intelligence",
    version: ECOSYSTEM_INTELLIGENCE_VERSION,
    dependencies: ["resilience"],
    capabilities: [
      { key: "ecosystem.areas", description: "Seventeen-area ecosystem assessment" },
      { key: "ecosystem.forecasts", description: "Near, medium, and long-horizon ecosystem forecasts" },
      { key: "ecosystem.scenarios", description: "Ten ecosystem scenario monitors" },
      { key: "ecosystem.analysis", description: "Network, partnership, dependency, and collaboration analysis" },
      { key: "ecosystem.early_warning", description: "Early warning alerts from worsening trends and high-prob scenarios" },
      { key: "ecosystem.learning", description: "Closed learning loop across seven intelligence domains" },
      { key: "ecosystem.recommendations", description: "Recommendations with the eight-field Ecosystem Lens" },
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
        const systemsRaw = read<{
          healthScore?: { value?: number };
          baseline?: { adaptability?: number; cascadingRisk?: number };
        }>(context, "systems");
        const systemsResult: SystemsResultLight | undefined = systemsRaw
          ? {
              healthScore: systemsRaw.healthScore,
              adaptability: systemsRaw.baseline?.adaptability,
              cascadingRisk: systemsRaw.baseline?.cascadingRisk,
            }
          : undefined;
        const resilienceRaw = read<{
          healthScore?: { value?: number };
          baseline?: { adaptiveCapacity?: number };
        }>(context, "resilience");
        const resilienceResult: ResilienceResultLight | undefined = resilienceRaw
          ? {
              healthScore: resilienceRaw.healthScore,
              adaptiveCapacity: resilienceRaw.baseline?.adaptiveCapacity,
            }
          : undefined;
        const result = ecosystem.service.build({
          requestId: context.runId,
          question: input?.question ?? "Where is organizational ecosystem position most fragile across partnerships, networks, and dependencies?",
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
          stakeholderResult: read<StakeholderResultLight>(context, "stakeholder"),
          competitiveResult: read<CompetitiveResultLight>(context, "competitive"),
          marketResult: read<MarketResultLight>(context, "market"),
          systemsResult,
          resilienceResult,
          opportunityResult: read<OpportunityResultLight>(context, "opportunity"),
          decisionResult: read<DecisionResultLight>(context, "executiveDecision"),
          predictiveResult: read<PredictiveResultLight>(context, "predictive"),
        });
        context.set("ecosystem", result);
        return createModuleResult({ moduleId: "ecosystem", context, startedAt, ok: true, data: result });
      } catch (error) {
        return createModuleResult({
          moduleId: "ecosystem",
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
