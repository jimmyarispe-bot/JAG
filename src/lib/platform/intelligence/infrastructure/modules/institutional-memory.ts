/**
 * Intelligence Platform Infrastructure - Institutional Memory module adapter (Sprint 058).
 *
 * Wraps createInstitutionalMemoryIntelligence - terminal module after ecosystem.
 * Soft-reads Sprint 040 knowledge (frozen) plus upstream domains. Does not modify knowledge/.
 */
import {
  createInstitutionalMemoryIntelligence,
  INSTITUTIONAL_MEMORY_INTELLIGENCE_VERSION,
  type CreateInstitutionalMemoryOptions,
  type InstitutionalMemoryStack,
  type KnowledgeResultLight,
  type EcosystemResultLight,
  type ResilienceResultLight,
  type SystemsResultLight,
  type StakeholderResultLight,
  type CulturalResultLight,
  type EthicalResultLight,
  type OpportunityResultLight,
  type DecisionResultLight,
  type PredictiveResultLight,
  type MarketResultLight,
  type CompetitiveResultLight,
  type BehavioralResultLight,
  type OperationsResultLight,
  type CustomerResultLight,
  type HumanCapitalResultLight,
} from "@/lib/platform/intelligence/institutional-memory";
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

export function createInstitutionalMemoryModule(
  options: CreateInstitutionalMemoryOptions = {},
  stack?: InstitutionalMemoryStack
): IntelligenceModule {
  const institutionalMemory =
    stack ??
    createInstitutionalMemoryIntelligence({
      ...options,
      wireOrganizationDna: options.wireOrganizationDna ?? false,
      wireOios: options.wireOios ?? false,
    });

  return {
    id: "institutional-memory",
    name: "Institutional Memory Intelligence",
    version: INSTITUTIONAL_MEMORY_INTELLIGENCE_VERSION,
    dependencies: ["ecosystem"],
    capabilities: [
      { key: "institutional-memory.areas", description: "Seventeen-area institutional memory assessment" },
      { key: "institutional-memory.forecasts", description: "Near, medium, and long-horizon memory forecasts" },
      { key: "institutional-memory.scenarios", description: "Ten institutional memory scenario monitors" },
      { key: "institutional-memory.analysis", description: "Knowledge graph, expertise, validation, and evolution analysis" },
      { key: "institutional-memory.early_warning", description: "Early warning alerts from worsening trends and high-prob scenarios" },
      { key: "institutional-memory.learning", description: "Closed learning loop redistributing validated insights across seven domains" },
      { key: "institutional-memory.recommendations", description: "Recommendations with the eight-field Institutional Memory Lens" },
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
        const result = institutionalMemory.service.build({
          requestId: context.runId,
          question: input?.question ?? "Where is institutional memory most fragile across expertise, validation, and learning redistribution?",
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
          knowledgeResult,
          ecosystemResult: read<EcosystemResultLight>(context, "ecosystem"),
          resilienceResult,
          systemsResult,
          stakeholderResult: read<StakeholderResultLight>(context, "stakeholder"),
          culturalResult: read<CulturalResultLight>(context, "cultural"),
          ethicalResult: read<EthicalResultLight>(context, "ethical"),
          opportunityResult: read<OpportunityResultLight>(context, "opportunity"),
          decisionResult: read<DecisionResultLight>(context, "executiveDecision"),
          predictiveResult: read<PredictiveResultLight>(context, "predictive"),
          marketResult: read<MarketResultLight>(context, "market"),
          competitiveResult: read<CompetitiveResultLight>(context, "competitive"),
          behavioralResult: read<BehavioralResultLight>(context, "behavioral"),
          operationsResult: read<OperationsResultLight>(context, "operations"),
          customerResult: read<CustomerResultLight>(context, "customer"),
          humanCapitalResult: read<HumanCapitalResultLight>(context, "humanCapital"),
        });
        context.set("institutionalMemory", result);
        return createModuleResult({ moduleId: "institutional-memory", context, startedAt, ok: true, data: result });
      } catch (error) {
        return createModuleResult({
          moduleId: "institutional-memory",
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
