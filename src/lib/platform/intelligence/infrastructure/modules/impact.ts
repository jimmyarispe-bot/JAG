/**
 * Intelligence Platform Infrastructure — Impact module adapter (Sprint 045).
 *
 * Wraps existing createImpactIntelligence — does not regenerate Sprint 021–044.
 */
import {
  createImpactIntelligence,
  IMPACT_INTELLIGENCE_VERSION,
  type CreateImpactOptions,
  type CustomerResultLight,
  type DecisionResultLight,
  type DocumentResultLight,
  type FundingResultLight,
  type HumanCapitalResultLight,
  type ImprovementResultLight,
  type InnovationResultLight,
  type KnowledgeResultLight,
  type MarketResultLight,
  type OperationsResultLight,
  type OpportunityResultLight,
  type RevenueResultLight,
  type ImpactStack,
} from "@/lib/platform/intelligence/impact";
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

export function createImpactModule(
  options: CreateImpactOptions = {},
  stack?: ImpactStack
): IntelligenceModule {
  const impact =
    stack ??
    createImpactIntelligence({
      ...options,
      wireOrganizationDna: options.wireOrganizationDna ?? false,
      wireOios: options.wireOios ?? false,
    });

  return {
    id: "impact",
    name: "Impact Intelligence",
    version: IMPACT_INTELLIGENCE_VERSION,
    dependencies: ["innovation"],
    capabilities: [
      { key: "impact.areas", description: "Twelve-area organizational impact assessment" },
      { key: "impact.measurement", description: "KPIs, OKRs, indicators, baselines, trends, and forecasts" },
      { key: "impact.outcomes", description: "Outcome achievement and cause attribution" },
      { key: "impact.roi", description: "ROI and social return on investment" },
      { key: "impact.learning", description: "Closed learning loop across four intelligence domains" },
      { key: "impact.recommendations", description: "Recommendations with the eight-field Impact Lens" },
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
        const result = impact.service.build({
          requestId: context.runId,
          question: input?.question ?? "Which outcomes were achieved, what evidence supports them, and what should improve next?",
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
          innovationResult: read<InnovationResultLight>(context, "innovation"),
          knowledgeResult: read<KnowledgeResultLight>(context, "knowledge"),
          documentResult: read<DocumentResultLight>(context, "document"),
          humanCapitalResult: read<HumanCapitalResultLight>(context, "human-capital"),
          customerResult: read<CustomerResultLight>(context, "customer"),
          revenueResult: read<RevenueResultLight>(context, "revenue"),
          fundingResult: read<FundingResultLight>(context, "funding"),
          operationsResult: read<OperationsResultLight>(context, "operations"),
          improvementResult: read<ImprovementResultLight>(context, "organizational-improvement"),
          marketResult: read<MarketResultLight>(context, "market"),
          decisionResult: read<DecisionResultLight>(context, "executiveDecision"),
          opportunityResult: read<OpportunityResultLight>(context, "opportunity"),
        });
        context.set("impact", result);
        return createModuleResult({ moduleId: "impact", context, startedAt, ok: true, data: result });
      } catch (error) {
        return createModuleResult({
          moduleId: "impact",
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
