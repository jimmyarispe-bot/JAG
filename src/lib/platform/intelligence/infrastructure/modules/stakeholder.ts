/**
 * Intelligence Platform Infrastructure — Stakeholder module adapter (Sprint 050).
 *
 * Wraps createStakeholderIntelligence — terminal module after environmental.
 */
import {
  createStakeholderIntelligence,
  STAKEHOLDER_INTELLIGENCE_VERSION,
  type CompetitiveResultLight,
  type CreateStakeholderOptions,
  type CustomerResultLight,
  type DecisionResultLight,
  type EnvironmentalResultLight,
  type HumanCapitalResultLight,
  type OpportunityResultLight,
  type PoliticalResultLight,
  type PredictiveResultLight,
  type StakeholderStack,
} from "@/lib/platform/intelligence/stakeholder";
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

export function createStakeholderModule(
  options: CreateStakeholderOptions = {},
  stack?: StakeholderStack
): IntelligenceModule {
  const stakeholder =
    stack ??
    createStakeholderIntelligence({
      ...options,
      wireOrganizationDna: options.wireOrganizationDna ?? false,
      wireOios: options.wireOios ?? false,
    });

  return {
    id: "stakeholder",
    name: "Stakeholder Intelligence",
    version: STAKEHOLDER_INTELLIGENCE_VERSION,
    dependencies: ["environmental"],
    capabilities: [
      { key: "stakeholder.areas", description: "Seventeen-area stakeholder assessment" },
      { key: "stakeholder.forecasts", description: "Near, medium, and long-horizon stakeholder forecasts" },
      { key: "stakeholder.scenarios", description: "Ten stakeholder scenario monitors" },
      { key: "stakeholder.analysis", description: "Influence, relationship, engagement, and sentiment analysis" },
      { key: "stakeholder.early_warning", description: "Early warning alerts from worsening trends and high-prob scenarios" },
      { key: "stakeholder.learning", description: "Closed learning loop across seven intelligence domains" },
      { key: "stakeholder.recommendations", description: "Recommendations with the eight-field Stakeholder Lens" },
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
        const result = stakeholder.service.build({
          requestId: context.runId,
          question: input?.question ?? "Which stakeholder relationships most determine institutional success, and where are influence, trust, and engagement at risk?",
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
          customerResult: read<CustomerResultLight>(context, "customer"),
          humanCapitalResult: read<HumanCapitalResultLight>(context, "humanCapital"),
          politicalResult: read<PoliticalResultLight>(context, "political"),
          competitiveResult: read<CompetitiveResultLight>(context, "competitive"),
          environmentalResult: read<EnvironmentalResultLight>(context, "environmental"),
          opportunityResult: read<OpportunityResultLight>(context, "opportunity"),
          decisionResult: read<DecisionResultLight>(context, "executiveDecision"),
          predictiveResult: read<PredictiveResultLight>(context, "predictive"),
        });
        context.set("stakeholder", result);
        return createModuleResult({ moduleId: "stakeholder", context, startedAt, ok: true, data: result });
      } catch (error) {
        return createModuleResult({
          moduleId: "stakeholder",
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
