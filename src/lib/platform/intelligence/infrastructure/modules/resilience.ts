/**
 * Intelligence Platform Infrastructure - Resilience module adapter (Sprint 056).
 *
 * Wraps createResilienceIntelligence - terminal module after systems.
 */
import {
  createResilienceIntelligence,
  RESILIENCE_INTELLIGENCE_VERSION,
  type CreateResilienceOptions,
  type ResilienceStack,
  type SystemsResultLight,
  type OperationsResultLight,
  type LegalComplianceRiskResultLight,
  type PredictiveResultLight,
  type DecisionResultLight,
  type EconomicResultLight,
  type OpportunityResultLight,
} from "@/lib/platform/intelligence/resilience";
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

export function createResilienceModule(
  options: CreateResilienceOptions = {},
  stack?: ResilienceStack
): IntelligenceModule {
  const resilience =
    stack ??
    createResilienceIntelligence({
      ...options,
      wireOrganizationDna: options.wireOrganizationDna ?? false,
      wireOios: options.wireOios ?? false,
    });

  return {
    id: "resilience",
    name: "Resilience Intelligence",
    version: RESILIENCE_INTELLIGENCE_VERSION,
    dependencies: ["systems"],
    capabilities: [
      { key: "resilience.areas", description: "Seventeen-area resilience assessment" },
      { key: "resilience.forecasts", description: "Near, medium, and long-horizon resilience forecasts" },
      { key: "resilience.scenarios", description: "Ten resilience scenario monitors" },
      { key: "resilience.analysis", description: "Readiness, recovery, continuity, and stress analysis" },
      { key: "resilience.early_warning", description: "Early warning alerts from worsening trends and high-prob scenarios" },
      { key: "resilience.learning", description: "Closed learning loop across seven intelligence domains" },
      { key: "resilience.recommendations", description: "Recommendations with the eight-field Resilience Lens" },
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
        const result = resilience.service.build({
          requestId: context.runId,
          question: input?.question ?? "Where is organizational resilience most fragile across readiness, recovery, continuity, and adaptive capacity?",
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
          systemsResult,
          operationsResult: read<OperationsResultLight>(context, "operations"),
          legalComplianceRiskResult: read<LegalComplianceRiskResultLight>(context, "legalComplianceRisk"),
          predictiveResult: read<PredictiveResultLight>(context, "predictive"),
          decisionResult: read<DecisionResultLight>(context, "executiveDecision"),
          economicResult: read<EconomicResultLight>(context, "economic"),
          opportunityResult: read<OpportunityResultLight>(context, "opportunity"),
        });
        context.set("resilience", result);
        return createModuleResult({ moduleId: "resilience", context, startedAt, ok: true, data: result });
      } catch (error) {
        return createModuleResult({
          moduleId: "resilience",
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
