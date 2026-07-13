/**
 * Intelligence Platform Infrastructure — Political module adapter (Sprint 048).
 *
 * Wraps createPoliticalIntelligence — terminal module after competitive.
 */
import {
  createPoliticalIntelligence,
  POLITICAL_INTELLIGENCE_VERSION,
  type CompetitiveResultLight,
  type CreatePoliticalOptions,
  type DecisionResultLight,
  type EconomicResultLight,
  type FundingResultLight,
  type LegalComplianceRiskResultLight,
  type MarketResultLight,
  type OpportunityResultLight,
  type PoliticalStack,
  type PredictiveResultLight,
} from "@/lib/platform/intelligence/political";
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

export function createPoliticalModule(
  options: CreatePoliticalOptions = {},
  stack?: PoliticalStack
): IntelligenceModule {
  const political =
    stack ??
    createPoliticalIntelligence({
      ...options,
      wireOrganizationDna: options.wireOrganizationDna ?? false,
      wireOios: options.wireOios ?? false,
    });

  return {
    id: "political",
    name: "Political Intelligence",
    version: POLITICAL_INTELLIGENCE_VERSION,
    dependencies: ["competitive"],
    capabilities: [
      { key: "political.areas", description: "Seventeen-area political environment assessment" },
      { key: "political.forecasts", description: "Near, medium, and long-horizon political forecasts" },
      { key: "political.scenarios", description: "Ten political scenario monitors" },
      { key: "political.analysis", description: "Policy, legislative, regulatory, funding, and risk analysis" },
      { key: "political.early_warning", description: "Early warning alerts from worsening trends and high-prob scenarios" },
      { key: "political.learning", description: "Closed learning loop across seven intelligence domains" },
      { key: "political.recommendations", description: "Recommendations with the eight-field Political Lens" },
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
        const result = political.service.build({
          requestId: context.runId,
          question: input?.question ?? "What legislation, regulation, elections, and geopolitical forces will impact our strategy, funding, and operations?",
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
          economicResult: read<EconomicResultLight>(context, "economic"),
          competitiveResult: read<CompetitiveResultLight>(context, "competitive"),
          legalComplianceRiskResult: read<LegalComplianceRiskResultLight>(context, "legal-compliance-risk"),
          opportunityResult: read<OpportunityResultLight>(context, "opportunity"),
          decisionResult: read<DecisionResultLight>(context, "executiveDecision"),
          predictiveResult: read<PredictiveResultLight>(context, "predictive"),
          fundingResult: read<FundingResultLight>(context, "funding"),
        });
        context.set("political", result);
        return createModuleResult({ moduleId: "political", context, startedAt, ok: true, data: result });
      } catch (error) {
        return createModuleResult({
          moduleId: "political",
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
