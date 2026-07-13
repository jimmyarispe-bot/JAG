/**
 * Intelligence Platform Infrastructure - Wisdom module adapter (Sprint 060).
 *
 * Wraps createWisdomIntelligence - terminal module after collective.
 * Soft-reads collective and upstream domains. Does not modify
 * collective/ or other prior intelligence packages.
 */
import {
  createWisdomIntelligence,
  WISDOM_INTELLIGENCE_VERSION,
  type CreateWisdomOptions,
  type WisdomStack,
  type CollectiveResultLight,
  type InstitutionalMemoryResultLight,
  type KnowledgeResultLight,
  type DecisionResultLight,
  type PredictiveResultLight,
  type EthicalResultLight,
  type SystemsResultLight,
  type ResilienceResultLight,
  type OpportunityResultLight,
  type BehavioralResultLight,
  type CulturalResultLight,
  type StakeholderResultLight,
  type EcosystemResultLight,
  type MarketResultLight,
  type CompetitiveResultLight,
  type EconomicResultLight,
  type OperationsResultLight,
  type HumanCapitalResultLight,
  type EnvironmentalResultLight,
  type PoliticalResultLight,
  type ReputationResultLight,
} from "@/lib/platform/intelligence/wisdom";
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

export function createWisdomModule(
  options: CreateWisdomOptions = {},
  stack?: WisdomStack
): IntelligenceModule {
  const wisdom =
    stack ??
    createWisdomIntelligence({
      ...options,
      wireOrganizationDna: options.wireOrganizationDna ?? false,
      wireOios: options.wireOios ?? false,
    });

  return {
    id: "wisdom",
    name: "Wisdom Intelligence",
    version: WISDOM_INTELLIGENCE_VERSION,
    dependencies: ["collective"],
    capabilities: [
      { key: "wisdom.areas", description: "Seventeen-area wisdom intelligence assessment" },
      { key: "wisdom.forecasts", description: "Near, medium, and long-horizon wisdom forecasts" },
      { key: "wisdom.scenarios", description: "Ten wisdom scenario monitors" },
      { key: "wisdom.analysis", description: "Strategic value, trade-off, confidence, and ethical analysis" },
      { key: "wisdom.early_warning", description: "Early warning alerts from worsening trends and high-prob scenarios" },
      { key: "wisdom.learning", description: "Closed learning loop redistributing executive wisdom across seven domains" },
      { key: "wisdom.recommendations", description: "Recommendations with the eight-field Wisdom Lens" },
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
        const collectiveRaw = read<{
          healthScore?: { value?: number };
          baseline?: { collectiveConfidence?: number; collaborationQuality?: number; consensusStrength?: number };
        }>(context, "collective");
        const collectiveResult: CollectiveResultLight | undefined = collectiveRaw
          ? {
              healthScore: collectiveRaw.healthScore,
              collectiveConfidence: collectiveRaw.baseline?.collectiveConfidence,
              baseline: collectiveRaw.baseline,
            }
          : undefined;
        const result = wisdom.service.build({
          requestId: context.runId,
          question: input?.question ?? "Where is organizational wisdom most fragile across judgment, trade-offs, and long-term impact?",
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
          collectiveResult,
          institutionalMemoryResult,
          knowledgeResult,
          decisionResult: read<DecisionResultLight>(context, "executiveDecision"),
          predictiveResult: read<PredictiveResultLight>(context, "predictive"),
          ethicalResult: read<EthicalResultLight>(context, "ethical"),
          systemsResult,
          resilienceResult,
          opportunityResult: read<OpportunityResultLight>(context, "opportunity"),
          behavioralResult: read<BehavioralResultLight>(context, "behavioral"),
          culturalResult: read<CulturalResultLight>(context, "cultural"),
          stakeholderResult: read<StakeholderResultLight>(context, "stakeholder"),
          ecosystemResult: read<EcosystemResultLight>(context, "ecosystem"),
          marketResult: read<MarketResultLight>(context, "market"),
          competitiveResult: read<CompetitiveResultLight>(context, "competitive"),
          economicResult: read<EconomicResultLight>(context, "economic"),
          operationsResult: read<OperationsResultLight>(context, "operations"),
          humanCapitalResult: read<HumanCapitalResultLight>(context, "humanCapital"),
          environmentalResult: read<EnvironmentalResultLight>(context, "environmental"),
          politicalResult: read<PoliticalResultLight>(context, "political"),
          reputationResult: read<ReputationResultLight>(context, "reputation"),
        });
        context.set("wisdom", result);
        return createModuleResult({ moduleId: "wisdom", context, startedAt, ok: true, data: result });
      } catch (error) {
        return createModuleResult({
          moduleId: "wisdom",
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
