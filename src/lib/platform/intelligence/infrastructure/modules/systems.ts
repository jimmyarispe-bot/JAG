/**
 * Intelligence Platform Infrastructure - Systems module adapter (Sprint 055).
 *
 * Wraps createSystemsIntelligence - terminal module after ethical.
 */
import {
  createSystemsIntelligence,
  SYSTEMS_INTELLIGENCE_VERSION,
  type CreateSystemsOptions,
  type SystemsStack,
  type OperationsResultLight,
  type LegalComplianceRiskResultLight,
  type PredictiveResultLight,
  type DecisionResultLight,
  type EconomicResultLight,
  type BehavioralResultLight,
  type EthicalResultLight,
  type OpportunityResultLight,
} from "@/lib/platform/intelligence/systems";
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

export function createSystemsModule(
  options: CreateSystemsOptions = {},
  stack?: SystemsStack
): IntelligenceModule {
  const systems =
    stack ??
    createSystemsIntelligence({
      ...options,
      wireOrganizationDna: options.wireOrganizationDna ?? false,
      wireOios: options.wireOios ?? false,
    });

  return {
    id: "systems",
    name: "Systems Intelligence",
    version: SYSTEMS_INTELLIGENCE_VERSION,
    dependencies: ["ethical"],
    capabilities: [
      { key: "systems.areas", description: "Seventeen-area systems assessment" },
      { key: "systems.forecasts", description: "Near, medium, and long-horizon systems forecasts" },
      { key: "systems.scenarios", description: "Ten systems scenario monitors" },
      { key: "systems.analysis", description: "Dependency, bottleneck, feedback, and complexity analysis" },
      { key: "systems.early_warning", description: "Early warning alerts from worsening trends and high-prob scenarios" },
      { key: "systems.learning", description: "Closed learning loop across seven intelligence domains" },
      { key: "systems.recommendations", description: "Recommendations with the eight-field Systems Lens" },
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
        const result = systems.service.build({
          requestId: context.runId,
          question: input?.question ?? "Where are organizational systems most fragile across dependencies, feedback loops, bottlenecks, and cascading risk?",
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
          operationsResult: read<OperationsResultLight>(context, "operations"),
          legalComplianceRiskResult: read<LegalComplianceRiskResultLight>(context, "legalComplianceRisk"),
          predictiveResult: read<PredictiveResultLight>(context, "predictive"),
          decisionResult: read<DecisionResultLight>(context, "executiveDecision"),
          economicResult: read<EconomicResultLight>(context, "economic"),
          behavioralResult: read<BehavioralResultLight>(context, "behavioral"),
          ethicalResult: read<EthicalResultLight>(context, "ethical"),
          opportunityResult: read<OpportunityResultLight>(context, "opportunity"),
        });
        context.set("systems", result);
        return createModuleResult({ moduleId: "systems", context, startedAt, ok: true, data: result });
      } catch (error) {
        return createModuleResult({
          moduleId: "systems",
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
