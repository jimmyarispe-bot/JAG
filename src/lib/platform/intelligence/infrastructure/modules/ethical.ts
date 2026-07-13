/**
 * Intelligence Platform Infrastructure - Ethical module adapter (Sprint 054).
 *
 * Wraps createEthicalIntelligence - terminal module after cultural.
 */
import {
  createEthicalIntelligence,
  ETHICAL_INTELLIGENCE_VERSION,
  type CreateEthicalOptions,
  type EthicalStack,
  type CulturalResultLight,
  type BehavioralResultLight,
  type LegalComplianceRiskResultLight,
  type DecisionResultLight,
  type OpportunityResultLight,
  type PredictiveResultLight,
  type ReputationResultLight,
} from "@/lib/platform/intelligence/ethical";
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

export function createEthicalModule(
  options: CreateEthicalOptions = {},
  stack?: EthicalStack
): IntelligenceModule {
  const ethical =
    stack ??
    createEthicalIntelligence({
      ...options,
      wireOrganizationDna: options.wireOrganizationDna ?? false,
      wireOios: options.wireOios ?? false,
    });

  return {
    id: "ethical",
    name: "Ethical Intelligence",
    version: ETHICAL_INTELLIGENCE_VERSION,
    dependencies: ["cultural"],
    capabilities: [
      { key: "ethical.areas", description: "Seventeen-area ethical assessment" },
      { key: "ethical.forecasts", description: "Near, medium, and long-horizon ethical forecasts" },
      { key: "ethical.scenarios", description: "Ten ethical scenario monitors" },
      { key: "ethical.analysis", description: "Values, fairness, human impact, AI ethics, and governance analysis" },
      { key: "ethical.early_warning", description: "Early warning alerts from worsening trends and high-prob scenarios" },
      { key: "ethical.learning", description: "Closed learning loop across seven intelligence domains" },
      { key: "ethical.recommendations", description: "Recommendations with the eight-field Ethical Lens" },
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
        const result = ethical.service.build({
          requestId: context.runId,
          question: input?.question ?? "Where is organizational ethics strongest or most fragile across fairness, transparency, AI ethics, and human impact?",
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
          culturalResult: read<CulturalResultLight>(context, "cultural"),
          behavioralResult: read<BehavioralResultLight>(context, "behavioral"),
          legalComplianceRiskResult: read<LegalComplianceRiskResultLight>(context, "legalComplianceRisk"),
          decisionResult: read<DecisionResultLight>(context, "executiveDecision"),
          opportunityResult: read<OpportunityResultLight>(context, "opportunity"),
          predictiveResult: read<PredictiveResultLight>(context, "predictive"),
          reputationResult: read<ReputationResultLight>(context, "reputation"),
        });
        context.set("ethical", result);
        return createModuleResult({ moduleId: "ethical", context, startedAt, ok: true, data: result });
      } catch (error) {
        return createModuleResult({
          moduleId: "ethical",
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
