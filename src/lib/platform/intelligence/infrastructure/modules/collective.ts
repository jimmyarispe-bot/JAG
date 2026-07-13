/**
 * Intelligence Platform Infrastructure - Collective module adapter (Sprint 059).
 *
 * Wraps createCollectiveIntelligence - terminal module after institutional-memory.
 * Soft-reads institutional-memory, knowledge, and upstream domains. Does not modify
 * institutional-memory/ or knowledge/ packages.
 */
import {
  createCollectiveIntelligence,
  COLLECTIVE_INTELLIGENCE_VERSION,
  type CreateCollectiveOptions,
  type CollectiveStack,
  type InstitutionalMemoryResultLight,
  type KnowledgeResultLight,
  type DecisionResultLight,
  type PredictiveResultLight,
  type BehavioralResultLight,
  type CulturalResultLight,
  type StakeholderResultLight,
  type SystemsResultLight,
  type OpportunityResultLight,
  type EcosystemResultLight,
  type ResilienceResultLight,
  type EthicalResultLight,
  type MarketResultLight,
  type CompetitiveResultLight,
  type HumanCapitalResultLight,
  type OperationsResultLight,
} from "@/lib/platform/intelligence/collective";
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

export function createCollectiveModule(
  options: CreateCollectiveOptions = {},
  stack?: CollectiveStack
): IntelligenceModule {
  const collective =
    stack ??
    createCollectiveIntelligence({
      ...options,
      wireOrganizationDna: options.wireOrganizationDna ?? false,
      wireOios: options.wireOios ?? false,
    });

  return {
    id: "collective",
    name: "Collective Intelligence",
    version: COLLECTIVE_INTELLIGENCE_VERSION,
    dependencies: ["institutional-memory"],
    capabilities: [
      { key: "collective.areas", description: "Seventeen-area collective intelligence assessment" },
      { key: "collective.forecasts", description: "Near, medium, and long-horizon collective forecasts" },
      { key: "collective.scenarios", description: "Ten collective scenario monitors" },
      { key: "collective.analysis", description: "Consensus, expertise, synthesis, and collaboration analysis" },
      { key: "collective.early_warning", description: "Early warning alerts from worsening trends and high-prob scenarios" },
      { key: "collective.learning", description: "Closed learning loop redistributing synthesized learning across seven domains" },
      { key: "collective.recommendations", description: "Recommendations with the eight-field Collective Lens" },
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
        const knowledgeRaw = read<{
          healthScore?: { value?: number };
          knowledgeScore?: { value?: number };
          baseline?: { knowledgeConfidence?: number; knowledgeFreshness?: number; knowledgeQuality?: number };
        }>(context, "knowledge");
        const knowledgeResult: KnowledgeResultLight | undefined = knowledgeRaw
          ? {
              healthScore: knowledgeRaw.healthScore,
              knowledgeScore: knowledgeRaw.knowledgeScore,
              baseline: knowledgeRaw.baseline,
            }
          : undefined;
        const institutionalMemoryRaw = read<{
          healthScore?: { value?: number };
          institutionalMemoryScore?: { value?: number };
          baseline?: { knowledgeConfidence?: number; institutionalMemoryCoverage?: number; knowledgeQuality?: number };
        }>(context, "institutionalMemory");
        const institutionalMemoryResult: InstitutionalMemoryResultLight | undefined = institutionalMemoryRaw
          ? {
              healthScore: institutionalMemoryRaw.healthScore,
              institutionalMemoryScore: institutionalMemoryRaw.institutionalMemoryScore,
              baseline: institutionalMemoryRaw.baseline,
            }
          : undefined;
        const result = collective.service.build({
          requestId: context.runId,
          question: input?.question ?? "Where is collective intelligence most fragile across consensus, expertise, and multi-domain synthesis?",
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
          institutionalMemoryResult,
          knowledgeResult,
          decisionResult: read<DecisionResultLight>(context, "executiveDecision"),
          predictiveResult: read<PredictiveResultLight>(context, "predictive"),
          behavioralResult: read<BehavioralResultLight>(context, "behavioral"),
          culturalResult: read<CulturalResultLight>(context, "cultural"),
          stakeholderResult: read<StakeholderResultLight>(context, "stakeholder"),
          systemsResult,
          opportunityResult: read<OpportunityResultLight>(context, "opportunity"),
          ecosystemResult: read<EcosystemResultLight>(context, "ecosystem"),
          resilienceResult,
          ethicalResult: read<EthicalResultLight>(context, "ethical"),
          marketResult: read<MarketResultLight>(context, "market"),
          competitiveResult: read<CompetitiveResultLight>(context, "competitive"),
          humanCapitalResult: read<HumanCapitalResultLight>(context, "humanCapital"),
          operationsResult: read<OperationsResultLight>(context, "operations"),
        });
        context.set("collective", result);
        return createModuleResult({ moduleId: "collective", context, startedAt, ok: true, data: result });
      } catch (error) {
        return createModuleResult({
          moduleId: "collective",
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
