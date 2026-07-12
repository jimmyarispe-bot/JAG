/**
 * Intelligence Platform Infrastructure — Economic module adapter (Sprint 046).
 *
 * Wraps existing createEconomicIntelligence — does not regenerate Sprint 021–045.
 */
import {
  createEconomicIntelligence,
  ECONOMIC_INTELLIGENCE_VERSION,
  type BusinessModelResultLight,
  type CreateEconomicOptions,
  type DecisionResultLight,
  type EconomicStack,
  type FundingResultLight,
  type ImpactResultLight,
  type InnovationResultLight,
  type MarketResultLight,
  type OperationsResultLight,
  type OpportunityResultLight,
  type PredictiveResultLight,
  type RevenueResultLight,
} from "@/lib/platform/intelligence/economic";
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

export function createEconomicModule(
  options: CreateEconomicOptions = {},
  stack?: EconomicStack
): IntelligenceModule {
  const economic =
    stack ??
    createEconomicIntelligence({
      ...options,
      wireOrganizationDna: options.wireOrganizationDna ?? false,
      wireOios: options.wireOios ?? false,
    });

  return {
    id: "economic",
    name: "Economic Intelligence",
    version: ECONOMIC_INTELLIGENCE_VERSION,
    dependencies: ["impact"],
    capabilities: [
      { key: "economic.areas", description: "Eighteen-area macroeconomic environment assessment" },
      { key: "economic.forecasts", description: "Near, medium, and long-horizon economic forecasts" },
      { key: "economic.scenarios", description: "Ten macroeconomic scenario monitors" },
      { key: "economic.analysis", description: "Cost, labor, funding, pricing, and sensitivity analysis" },
      { key: "economic.learning", description: "Closed learning loop across seven intelligence domains" },
      { key: "economic.recommendations", description: "Recommendations with the eight-field Economic Lens" },
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
        const result = economic.service.build({
          requestId: context.runId,
          question: input?.question ?? "Which economic forces affect us, what evidence supports them, and what should leadership monitor next?",
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
          marketResult: read<MarketResultLight>(context, "market"),
          revenueResult: read<RevenueResultLight>(context, "revenue"),
          fundingResult: read<FundingResultLight>(context, "funding"),
          businessModelResult: read<BusinessModelResultLight>(context, "business-model"),
          operationsResult: read<OperationsResultLight>(context, "operations"),
          opportunityResult: read<OpportunityResultLight>(context, "opportunity"),
          innovationResult: read<InnovationResultLight>(context, "innovation"),
          impactResult: read<ImpactResultLight>(context, "impact"),
          decisionResult: read<DecisionResultLight>(context, "executiveDecision"),
          predictiveResult: read<PredictiveResultLight>(context, "predictive"),
        });
        context.set("economic", result);
        return createModuleResult({ moduleId: "economic", context, startedAt, ok: true, data: result });
      } catch (error) {
        return createModuleResult({
          moduleId: "economic",
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
