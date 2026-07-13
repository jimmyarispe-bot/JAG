/**
 * Intelligence Platform Infrastructure — Competitive module adapter (Sprint 047).
 *
 * Wraps createCompetitiveIntelligence — terminal module after economic.
 */
import {
  createCompetitiveIntelligence,
  COMPETITIVE_INTELLIGENCE_VERSION,
  type BusinessModelResultLight,
  type CreateCompetitiveOptions,
  type CompetitiveStack,
  type CustomerResultLight,
  type DecisionResultLight,
  type EconomicResultLight,
  type HumanCapitalResultLight,
  type InnovationResultLight,
  type MarketResultLight,
  type OpportunityResultLight,
  type PredictiveResultLight,
  type RevenueResultLight,
} from "@/lib/platform/intelligence/competitive";
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

export function createCompetitiveModule(
  options: CreateCompetitiveOptions = {},
  stack?: CompetitiveStack
): IntelligenceModule {
  const competitive =
    stack ??
    createCompetitiveIntelligence({
      ...options,
      wireOrganizationDna: options.wireOrganizationDna ?? false,
      wireOios: options.wireOios ?? false,
    });

  return {
    id: "competitive",
    name: "Competitive Intelligence",
    version: COMPETITIVE_INTELLIGENCE_VERSION,
    dependencies: ["economic"],
    capabilities: [
      { key: "competitive.areas", description: "Twelve-area competitive environment assessment" },
      { key: "competitive.forecasts", description: "Near, medium, and long-horizon competitive forecasts" },
      { key: "competitive.scenarios", description: "Ten competitive scenario monitors" },
      { key: "competitive.analysis", description: "Threat, differentiation, win-loss, battlecard, and moat analysis" },
      { key: "competitive.learning", description: "Closed learning loop across seven intelligence domains" },
      { key: "competitive.recommendations", description: "Recommendations with the eight-field Competitive Lens" },
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
        const result = competitive.service.build({
          requestId: context.runId,
          question: input?.question ?? "Who are our competitors, what threats exist, and how do we differentiate to protect enrollment and revenue?",
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
          customerResult: read<CustomerResultLight>(context, "customer"),
          humanCapitalResult: read<HumanCapitalResultLight>(context, "human-capital"),
          businessModelResult: read<BusinessModelResultLight>(context, "business-model"),
          opportunityResult: read<OpportunityResultLight>(context, "opportunity"),
          innovationResult: read<InnovationResultLight>(context, "innovation"),
          economicResult: read<EconomicResultLight>(context, "economic"),
          decisionResult: read<DecisionResultLight>(context, "executiveDecision"),
          predictiveResult: read<PredictiveResultLight>(context, "predictive"),
        });
        context.set("competitive", result);
        return createModuleResult({ moduleId: "competitive", context, startedAt, ok: true, data: result });
      } catch (error) {
        return createModuleResult({
          moduleId: "competitive",
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
