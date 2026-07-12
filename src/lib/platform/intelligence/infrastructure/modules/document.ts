/**
 * Intelligence Platform Infrastructure — Document module adapter (Sprint 041).
 *
 * Wraps existing createDocumentIntelligence — does not regenerate Sprint 021–040.
 */

import {
  createDocumentIntelligence,
  DOCUMENT_INTELLIGENCE_VERSION,
  type CreateDocumentOptions,
  type DocumentStack,
} from "@/lib/platform/intelligence/document";
import type { OrganizationDnaResult } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type {
  Graph,
  GraphAnalysisResult,
  GraphBuildInput,
} from "@/lib/platform/intelligence/executive-graph/types";
import type { ExecutiveDecisionResult } from "@/lib/platform/intelligence/executive-decision/types";
import type { PredictionResult } from "@/lib/platform/intelligence/predictive-intelligence/types";
import type { KnowledgeResult } from "@/lib/platform/intelligence/knowledge/types";
import type { OperationsResult } from "@/lib/platform/intelligence/operations/types";
import type { CustomerResult } from "@/lib/platform/intelligence/customer/types";
import type { HumanCapitalResult } from "@/lib/platform/intelligence/human-capital/types";
import type { RevenueResult } from "@/lib/platform/intelligence/revenue/types";
import type { FundingResult } from "@/lib/platform/intelligence/funding/types";
import type { GovernanceResult } from "@/lib/platform/intelligence/board-governance/types";
import type {
  IntelligenceExecutionContext,
  IntelligenceModule,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import { createModuleResult } from "@/lib/platform/intelligence/infrastructure/module-result";

export function createDocumentModule(
  options: CreateDocumentOptions = {},
  stack?: DocumentStack
): IntelligenceModule {
  const document =
    stack ??
    createDocumentIntelligence({
      ...options,
      wireOrganizationDna: options.wireOrganizationDna ?? false,
      wireOios: options.wireOios ?? false,
    });

  return {
    id: "document",
    name: "Document Intelligence",
    version: DOCUMENT_INTELLIGENCE_VERSION,
    dependencies: ["knowledge"],
    capabilities: [
      {
        key: "document.parse",
        description: "OCR-ready document parsing architecture",
      },
      {
        key: "document.classify",
        description: "Classify documents across 21 organizational document types",
      },
      {
        key: "document.metadata",
        description: "Metadata extraction for ownership, dates, and provenance",
      },
      {
        key: "document.entities",
        description: "Entity and relationship extraction from document corpora",
      },
      {
        key: "document.versions",
        description: "Version comparison and duplicate detection",
      },
      {
        key: "document.summarize",
        description: "Summarization and clause extraction",
      },
      {
        key: "document.risk",
        description:
          "Risk identification across expiration, compliance, and ownership gaps",
      },
      {
        key: "document.compliance",
        description: "Compliance tagging across regulatory and contractual surfaces",
      },
      {
        key: "document.expiration",
        description: "Expiration monitoring for licenses, permits, contracts, and grants",
      },
      {
        key: "document.knowledge",
        description:
          "Automatic validated knowledge contribution into Knowledge Intelligence",
      },
      {
        key: "document.reason",
        description: "Reason over documents — risks, decisions, and missing topics",
      },
      {
        key: "document.brief",
        description:
          "Executive Document Brief with contract, policy, grant, and compliance dashboards",
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
        const knowledgeResult = context.get<KnowledgeResult>("knowledge");
        const operationsResult = context.get<OperationsResult>("operations");
        const customerResult = context.get<CustomerResult>("customer");
        const humanCapitalResult =
          context.get<HumanCapitalResult>("humanCapital");
        const revenueResult = context.get<RevenueResult>("revenue");
        const fundingResult = context.get<FundingResult>("funding");
        const boardGovernanceResult =
          context.get<GovernanceResult>("boardGovernance");

        const input = context.input as
          | {
              question?: string;
              periodLabel?: string;
            }
          | undefined;

        const result = document.service.build({
          requestId: context.runId,
          question:
            typeof input?.question === "string"
              ? input.question
              : "How healthy is our document corpus, and where should we improve classification, expiration monitoring, and knowledge contribution?",
          periodLabel: input?.periodLabel,
          dnaResult: dnaResult ?? undefined,
          dna: dnaResult?.dna,
          oiosResult: oiosResult ?? undefined,
          graph: graphBundle?.graph,
          analysis: graphBundle?.analysis,
          graphInput: graphBundle?.graphInput,
          decisionResult: decisionResult
            ? {
                requestId: decisionResult.requestId,
                healthScore: {
                  value: decisionResult.confidence?.value,
                },
                decisionScore: {
                  value: decisionResult.confidence?.value,
                },
                recommendations: decisionResult.recommendations?.map((r) => r.title),
              }
            : undefined,
          predictionResult: predictionResult ?? undefined,
          knowledgeResult: knowledgeResult
            ? {
                requestId: knowledgeResult.requestId,
                healthScore: { value: knowledgeResult.healthScore?.value },
                coverageScore: { value: knowledgeResult.coverageScore?.value },
                contributionScore: {
                  value: knowledgeResult.qualityScore?.value,
                },
                baseline: {
                  coverageScore: knowledgeResult.baseline?.coverageScore,
                  validatedRatio: knowledgeResult.baseline?.validatedRatio,
                  gapPressure: knowledgeResult.baseline?.gapPressure,
                },
              }
            : undefined,
          operationsResult: operationsResult
            ? {
                requestId: operationsResult.requestId,
                healthScore: { value: operationsResult.healthScore?.value },
                workflowScore: { value: operationsResult.workflowScore?.value },
                baseline: {
                  operationsScore: operationsResult.baseline?.operationsScore,
                  backlogPressure: operationsResult.baseline?.backlogPressure,
                },
              }
            : undefined,
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
                  complaintBurden: customerResult.baseline?.complaintBurden,
                },
              }
            : undefined,
          humanCapitalResult: humanCapitalResult
            ? {
                requestId: humanCapitalResult.requestId,
                healthScore: {
                  value: humanCapitalResult.workforceHealthScore?.value,
                },
                baseline: {
                  trainingCoverage: humanCapitalResult.baseline?.skillsCoverage,
                  successionReadiness:
                    humanCapitalResult.baseline?.successionReadiness,
                },
                knowledgeTransfer: {
                  overallScore:
                    humanCapitalResult.knowledgeTransfer?.length > 0
                      ? Math.min(
                          100,
                          (humanCapitalResult.baseline?.skillsCoverage ?? 60) *
                            0.7 +
                            Math.min(
                              30,
                              humanCapitalResult.knowledgeTransfer.length * 4
                            )
                        )
                      : undefined,
                  criticalGaps: humanCapitalResult.knowledgeTransfer?.length,
                },
              }
            : undefined,
          revenueResult: revenueResult
            ? {
                requestId: revenueResult.requestId,
                healthScore: { value: revenueResult.healthScore?.value },
                baseline: {
                  revenueReliability: revenueResult.baseline?.nrr,
                  billingAccuracy: revenueResult.baseline?.cashConversion,
                  contractCoverage: revenueResult.baseline?.pipelineCoverage,
                },
              }
            : undefined,
          fundingResult: fundingResult
            ? {
                requestId: fundingResult.requestId,
                healthScore: { value: fundingResult.healthScore?.value },
                baseline: {
                  grantReadiness: fundingResult.baseline?.proposalCapacity,
                  awardCompliance: fundingResult.baseline?.complianceReadiness,
                  pipelineCoverage: fundingResult.baseline?.pipelineFunding
                    ? Math.min(
                        100,
                        (fundingResult.baseline.pipelineFunding /
                          Math.max(
                            1,
                            fundingResult.baseline.annualFundingNeed
                          )) *
                          100
                      )
                    : undefined,
                },
              }
            : undefined,
          boardGovernanceResult: boardGovernanceResult
            ? {
                requestId: boardGovernanceResult.requestId,
                healthScore: {
                  value: boardGovernanceResult.confidence?.value
                    ? clamp01ToScore(boardGovernanceResult.confidence.value)
                    : undefined,
                },
                baseline: {
                  policyGovernance: boardGovernanceResult.compliance?.length
                    ? Math.min(100, 50 + boardGovernanceResult.compliance.length * 4)
                    : undefined,
                  minutesCoverage: boardGovernanceResult.packets?.length
                    ? Math.min(100, 55 + boardGovernanceResult.packets.length * 5)
                    : undefined,
                  decisionTraceability: boardGovernanceResult.resolutions?.length
                    ? Math.min(
                        100,
                        50 + boardGovernanceResult.resolutions.length * 5
                      )
                    : undefined,
                },
                recommendations: boardGovernanceResult.recommendations,
              }
            : undefined,
          scope: {
            organizationId: context.scope.organizationId ?? null,
            schoolId: context.scope.schoolId ?? null,
          },
        });

        context.set("document", result);

        return createModuleResult({
          moduleId: "document",
          context,
          startedAt,
          ok: true,
          data: result,
        });
      } catch (error) {
        return createModuleResult({
          moduleId: "document",
          context,
          startedAt,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  };
}

function clamp01ToScore(value: number): number {
  if (value <= 1) return Math.min(100, Math.max(0, value * 100));
  return Math.min(100, Math.max(0, value));
}
