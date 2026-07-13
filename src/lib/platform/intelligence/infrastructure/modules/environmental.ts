/**
 * Intelligence Platform Infrastructure — Environmental module adapter (Sprint 049).
 *
 * Wraps createEnvironmentalIntelligence — terminal module after political.
 */
import {
  createEnvironmentalIntelligence,
  ENVIRONMENTAL_INTELLIGENCE_VERSION,
  type CreateEnvironmentalOptions,
  type DecisionResultLight,
  type EconomicResultLight,
  type EnvironmentalStack,
  type LegalComplianceRiskResultLight,
  type MarketResultLight,
  type OperationsResultLight,
  type OpportunityResultLight,
  type PoliticalResultLight,
  type PredictiveResultLight,
} from "@/lib/platform/intelligence/environmental";
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

export function createEnvironmentalModule(
  options: CreateEnvironmentalOptions = {},
  stack?: EnvironmentalStack
): IntelligenceModule {
  const environmental =
    stack ??
    createEnvironmentalIntelligence({
      ...options,
      wireOrganizationDna: options.wireOrganizationDna ?? false,
      wireOios: options.wireOios ?? false,
    });

  return {
    id: "environmental",
    name: "Environmental Intelligence",
    version: ENVIRONMENTAL_INTELLIGENCE_VERSION,
    dependencies: ["political"],
    capabilities: [
      { key: "environmental.areas", description: "Seventeen-area environmental assessment" },
      { key: "environmental.forecasts", description: "Near, medium, and long-horizon environmental forecasts" },
      { key: "environmental.scenarios", description: "Ten environmental scenario monitors" },
      { key: "environmental.analysis", description: "Climate, disaster, sustainability, and infrastructure analysis" },
      { key: "environmental.early_warning", description: "Early warning alerts from worsening trends and high-prob scenarios" },
      { key: "environmental.learning", description: "Closed learning loop across seven intelligence domains" },
      { key: "environmental.recommendations", description: "Recommendations with the eight-field Environmental Lens" },
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
        const result = environmental.service.build({
          requestId: context.runId,
          question: input?.question ?? "What climate, resource, disaster, and sustainability forces will impact our facilities, operations, and long-term strategy?",
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
          politicalResult: read<PoliticalResultLight>(context, "political"),
          economicResult: read<EconomicResultLight>(context, "economic"),
          legalComplianceRiskResult: read<LegalComplianceRiskResultLight>(context, "legal-compliance-risk"),
          operationsResult: read<OperationsResultLight>(context, "operations"),
          opportunityResult: read<OpportunityResultLight>(context, "opportunity"),
          decisionResult: read<DecisionResultLight>(context, "executiveDecision"),
          predictiveResult: read<PredictiveResultLight>(context, "predictive"),
          marketResult: read<MarketResultLight>(context, "market"),
        });
        context.set("environmental", result);
        return createModuleResult({ moduleId: "environmental", context, startedAt, ok: true, data: result });
      } catch (error) {
        return createModuleResult({
          moduleId: "environmental",
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
