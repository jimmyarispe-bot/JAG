/**
 * Intelligence Platform Infrastructure — Knowledge module adapter (Sprint 040).
 *
 * Wraps existing createKnowledgeIntelligence — does not regenerate Sprint 021–039.
 * Distinct from foundation IntelligenceKnowledgeService.
 */

import {
  createKnowledgeIntelligence,
  KNOWLEDGE_INTELLIGENCE_VERSION,
  type CreateKnowledgeOptions,
  type KnowledgeStack,
} from "@/lib/platform/intelligence/knowledge";
import type { OrganizationDnaResult } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type {
  Graph,
  GraphAnalysisResult,
  GraphBuildInput,
} from "@/lib/platform/intelligence/executive-graph/types";
import type { ExecutiveDecisionResult } from "@/lib/platform/intelligence/executive-decision/types";
import type { PredictionResult } from "@/lib/platform/intelligence/predictive-intelligence/types";
import type { CustomerResult } from "@/lib/platform/intelligence/customer/types";
import type { OperationsResult } from "@/lib/platform/intelligence/operations/types";
import type { HumanCapitalResult } from "@/lib/platform/intelligence/human-capital/types";
import type {
  IntelligenceExecutionContext,
  IntelligenceModule,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import { createModuleResult } from "@/lib/platform/intelligence/infrastructure/module-result";

export function createKnowledgeModule(
  options: CreateKnowledgeOptions = {},
  stack?: KnowledgeStack
): IntelligenceModule {
  const knowledge =
    stack ??
    createKnowledgeIntelligence({
      ...options,
      wireOrganizationDna: options.wireOrganizationDna ?? false,
      wireOios: options.wireOios ?? false,
    });

  return {
    id: "knowledge",
    name: "Knowledge Intelligence",
    version: KNOWLEDGE_INTELLIGENCE_VERSION,
    dependencies: ["customer"],
    capabilities: [
      {
        key: "knowledge.catalog",
        description:
          "Institutional knowledge catalog across facts, policies, procedures, and more",
      },
      {
        key: "knowledge.graph",
        description: "Relationship graph with lineage, ownership, and conflicts",
      },
      {
        key: "knowledge.search",
        description: "Semantic search with duplicate detection",
      },
      {
        key: "knowledge.reason",
        description: "Reason over connected knowledge and detect conflicts",
      },
      {
        key: "knowledge.gaps",
        description: "Knowledge gap analysis and documentation recommendations",
      },
      {
        key: "knowledge.expertise",
        description: "Expertise map across organizational domains",
      },
      {
        key: "knowledge.provenance",
        description:
          "Full provenance on every artifact — source, author, owner, dates, trust, version history, approval, related policies/decisions/goals/DNA",
      },
      {
        key: "knowledge.quality",
        description:
          "Knowledge quality engine — validation, freshness, completeness, accuracy, consistency, conflict, redundancy, coverage, lifecycle",
      },
      {
        key: "knowledge.memory",
        description:
          "Organizational memory — board/executive decisions, policies, SOPs, playbooks, lessons, projects, milestones, and more",
      },
      {
        key: "knowledge.evolution",
        description:
          "Continuous knowledge evolution — stale/conflict detection, updates, missing knowledge, expertise, transition preservation",
      },
      {
        key: "knowledge.traceability",
        description:
          "Decision traceability — every recommendation traces to knowledge, confidence, source, validation, and related decisions",
      },
      {
        key: "knowledge.brief",
        description: "Executive Knowledge Brief with six-lens narratives",
      },
    ],
    async execute(context: IntelligenceExecutionContext) {
      const startedAt = new Date().toISOString();
      try {
        const dnaResult = context.get<OrganizationDnaResult>("organizationDna");
        const oiosResult = context.get<OiosResult>("oios");
        const graphBundle = context.get<{
          graph?: Graph;
          analysis?: GraphAnalysisResult;
          graphInput?: GraphBuildInput;
        }>("executiveGraph");
        const decisionResult =
          context.get<ExecutiveDecisionResult>("executiveDecision");
        const predictionResult = context.get<PredictionResult>("predictive");
        const customerResult = context.get<CustomerResult>("customer");
        const operationsResult = context.get<OperationsResult>("operations");
        const humanCapitalResult =
          context.get<HumanCapitalResult>("humanCapital");

        const input = context.input as
          | {
              question?: string;
              periodLabel?: string;
            }
          | undefined;

        const result = knowledge.service.build({
          requestId: context.runId,
          question:
            typeof input?.question === "string"
              ? input.question
              : "How healthy is our institutional memory, and where should we improve knowledge capture and reuse?",
          periodLabel: input?.periodLabel,
          dnaResult: dnaResult ?? undefined,
          dna: dnaResult?.dna,
          oiosResult: oiosResult ?? undefined,
          graph: graphBundle?.graph,
          analysis: graphBundle?.analysis,
          graphInput: graphBundle?.graphInput,
          decisionResult: decisionResult ?? undefined,
          predictionResult: predictionResult ?? undefined,
          customerResult: customerResult
            ? {
                requestId: customerResult.requestId,
                healthScore: { value: customerResult.healthScore?.value },
                engagementScore: {
                  value: customerResult.engagementScore?.value,
                },
                baseline: {
                  familyExperienceScore:
                    customerResult.baseline?.familyExperienceScore,
                  belongingIndex: customerResult.baseline?.belongingIndex,
                  complaintBurden: customerResult.baseline?.complaintBurden,
                },
                recommendations: customerResult.recommendations?.map(
                  (r) => r.title
                ),
              }
            : undefined,
          operationsResult: operationsResult
            ? {
                requestId: operationsResult.requestId,
                healthScore: { value: operationsResult.healthScore?.value },
                workflowScore: { value: operationsResult.workflowScore?.value },
                baseline: {
                  operationsScore: operationsResult.baseline?.operationsScore,
                  slaRisk: operationsResult.baseline?.slaRisk,
                  backlogPressure: operationsResult.baseline?.backlogPressure,
                },
                recommendations: operationsResult.recommendations?.map(
                  (r) => r.title
                ),
              }
            : undefined,
          humanCapitalResult: humanCapitalResult
            ? {
                requestId: humanCapitalResult.requestId,
                healthScore: {
                  value: humanCapitalResult.workforceHealthScore?.value,
                },
                baseline: {
                  successionReadiness:
                    humanCapitalResult.baseline?.successionReadiness,
                  skillsCoverage: humanCapitalResult.baseline?.skillsCoverage,
                  engagementScore: humanCapitalResult.baseline?.engagementScore,
                },
                knowledgeTransfer: {
                  overallScore:
                    humanCapitalResult.knowledgeTransfer?.length > 0
                      ? clampTransferScore(
                          humanCapitalResult.knowledgeTransfer.length,
                          humanCapitalResult.baseline?.skillsCoverage
                        )
                      : undefined,
                  criticalGaps: humanCapitalResult.knowledgeTransfer?.length,
                },
                recommendations: humanCapitalResult.recommendations,
              }
            : undefined,
          scope: {
            organizationId: context.scope.organizationId ?? null,
            schoolId: context.scope.schoolId ?? null,
          },
        });

        context.set("knowledge", result);

        return createModuleResult({
          moduleId: "knowledge",
          context,
          startedAt,
          ok: true,
          data: result,
        });
      } catch (error) {
        return createModuleResult({
          moduleId: "knowledge",
          context,
          startedAt,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  };
}

function clampTransferScore(
  transferCount: number,
  skillsCoverage?: number
): number {
  const base = skillsCoverage ?? 60;
  return Math.min(100, Math.max(0, base * 0.7 + Math.min(30, transferCount * 4)));
}
