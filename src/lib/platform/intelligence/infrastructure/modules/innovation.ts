/**
 * Intelligence Platform Infrastructure — Innovation module adapter (Sprint 044).
 *
 * Wraps existing createInnovationIntelligence — does not regenerate Sprint 021–043.
 * Terminal module: runs after `market`. First Future Intelligence domain.
 */

import {
  createInnovationIntelligence,
  INNOVATION_INTELLIGENCE_VERSION,
  type CreateInnovationOptions,
  type InnovationStack,
} from "@/lib/platform/intelligence/innovation";
import type { OrganizationDnaResult } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type {
  Graph,
  GraphAnalysisResult,
  GraphBuildInput,
} from "@/lib/platform/intelligence/executive-graph/types";
import type { PredictionResult } from "@/lib/platform/intelligence/predictive-intelligence/types";
import type { MarketResult } from "@/lib/platform/intelligence/market/types";
import type { OpportunityResult } from "@/lib/platform/intelligence/opportunity/types";
import type { KnowledgeResult } from "@/lib/platform/intelligence/knowledge/types";
import type { DocumentResult } from "@/lib/platform/intelligence/document/types";
import type { BusinessModelResult } from "@/lib/platform/intelligence/business-model/types";
import type { ImprovementResult } from "@/lib/platform/intelligence/organizational-improvement/types";
import type { ExecutiveDecisionResult } from "@/lib/platform/intelligence/executive-decision/types";
import type {
  IntelligenceExecutionContext,
  IntelligenceModule,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import { createModuleResult } from "@/lib/platform/intelligence/infrastructure/module-result";

export function createInnovationModule(
  options: CreateInnovationOptions = {},
  stack?: InnovationStack
): IntelligenceModule {
  const innovation =
    stack ??
    createInnovationIntelligence({
      ...options,
      wireOrganizationDna: options.wireOrganizationDna ?? false,
      wireOios: options.wireOios ?? false,
    });

  return {
    id: "innovation",
    name: "Innovation Intelligence",
    version: INNOVATION_INTELLIGENCE_VERSION,
    dependencies: ["market"],
    capabilities: [
      { key: "innovation.ideas", description: "Idea intake, screening, and backlog prioritization" },
      { key: "innovation.rd", description: "Research and development intensity and pipeline" },
      { key: "innovation.product_service", description: "Product and service innovation opportunities" },
      { key: "innovation.process", description: "Process innovation and operational redesign" },
      { key: "innovation.ai", description: "AI opportunity discovery across the organization" },
      { key: "innovation.adoption", description: "Technology adoption readiness and staged rollout" },
      { key: "innovation.emerging", description: "Emerging technology monitoring and radar placement" },
      { key: "innovation.portfolio", description: "Innovation portfolio balance across H1/H2/H3 horizons" },
      { key: "innovation.experiments", description: "Experiment management and learning velocity" },
      { key: "innovation.poc", description: "Proof of concept tracking and conversion" },
      { key: "innovation.ip", description: "Intellectual property coverage and gaps" },
      { key: "innovation.improvement", description: "Continuous improvement opportunities" },
      { key: "innovation.roadmap", description: "Strategic innovation roadmaps" },
      { key: "innovation.recommendations", description: "Strategic innovation recommendations with 8-field lens" },
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
        const predictionResult = context.get<PredictionResult>("predictive");
        const marketResult = context.get<MarketResult>("market");
        const opportunityResult = context.get<OpportunityResult>("opportunity");
        const knowledgeResult = context.get<KnowledgeResult>("knowledge");
        const documentResult = context.get<DocumentResult>("document");
        const businessModelResult = context.get<BusinessModelResult>("businessModel");
        const improvementResult = context.get<ImprovementResult>("organizational-improvement");
        const decisionResult = context.get<ExecutiveDecisionResult>("executiveDecision");

        const input = context.input as
          | {
              question?: string;
              periodLabel?: string;
            }
          | undefined;

        const result = innovation.service.build({
          requestId: context.runId,
          question:
            typeof input?.question === "string"
              ? input.question
              : "Which innovation opportunities should we prioritize, and what experiments will validate them before we scale?",
          periodLabel: input?.periodLabel,
          dnaResult: dnaResult ?? undefined,
          dna: dnaResult?.dna,
          oiosResult: oiosResult ?? undefined,
          graph: graphBundle?.graph,
          analysis: graphBundle?.analysis,
          graphInput: graphBundle?.graphInput,
          predictionResult: predictionResult
            ? {
                requestId: predictionResult.requestId,
                healthScore: { value: predictionResult.confidence?.value },
                baseline: {
                  growthSignal: predictionResult.confidence?.value
                    ? clamp01ToScore(predictionResult.confidence.value)
                    : undefined,
                  scenarioCoverage: predictionResult.scenarioForecasts?.length
                    ? Math.min(100, 50 + predictionResult.scenarioForecasts.length * 8)
                    : undefined,
                },
              }
            : undefined,
          marketResult: marketResult
            ? {
                requestId: marketResult.requestId,
                healthScore: { value: marketResult.healthScore?.value },
                competitivePositionScore: {
                  value: marketResult.competitivePositionScore?.value,
                },
                expansionOpportunityScore: {
                  value: marketResult.expansionOpportunityScore?.value,
                },
                baseline: {
                  whiteSpaceScore: marketResult.baseline?.whiteSpaceScore,
                  opportunityDensity: marketResult.baseline?.opportunityDensity,
                  technologyDisruptionPressure:
                    marketResult.baseline?.technologyDisruptionPressure,
                  signalDensity: marketResult.baseline?.signalDensity,
                },
              }
            : undefined,
          opportunityResult: opportunityResult
            ? {
                requestId: opportunityResult.requestId,
                healthScore: { value: opportunityResult.healthScore?.value },
                baseline: {
                  opportunityDensity: opportunityResult.healthScore?.value,
                  captureReadiness: opportunityResult.baseline?.executionReadiness,
                },
              }
            : undefined,
          knowledgeResult: knowledgeResult
            ? {
                requestId: knowledgeResult.requestId,
                healthScore: { value: knowledgeResult.healthScore?.value },
                coverageScore: { value: knowledgeResult.coverageScore?.value },
                contributionScore: { value: knowledgeResult.qualityScore?.value },
                baseline: {
                  coverageScore: knowledgeResult.baseline?.coverageScore,
                  validatedRatio: knowledgeResult.baseline?.validatedRatio,
                  gapPressure: knowledgeResult.baseline?.gapPressure,
                },
              }
            : undefined,
          documentResult: documentResult
            ? {
                requestId: documentResult.requestId,
                healthScore: { value: documentResult.healthScore?.value },
                complianceScore: { value: documentResult.complianceScore?.value },
                riskScore: { value: documentResult.riskScore?.value },
                baseline: {
                  complianceCoverage: documentResult.baseline?.complianceCoverage,
                  riskPressure: documentResult.baseline?.riskPressure,
                  documentCount: documentResult.baseline?.documentCount,
                },
              }
            : undefined,
          businessModelResult: businessModelResult
            ? {
                requestId: businessModelResult.requestId,
                healthScore: { value: businessModelResult.healthScore?.value },
                baseline: {
                  businessModelFit: businessModelResult.healthScore?.value,
                  valuePropositionStrength: businessModelResult.baseline?.valueCreationScore,
                  monetizationClarity: businessModelResult.baseline?.valueCaptureScore,
                },
              }
            : undefined,
          improvementResult: improvementResult
            ? {
                requestId: improvementResult.requestId,
                healthScore: { value: improvementResult.healthScore?.value },
                baseline: {
                  improvementMomentum: improvementResult.healthScore?.value,
                  continuousImprovementScore:
                    improvementResult.baseline?.executionReadiness,
                  initiativeThroughput:
                    improvementResult.baseline?.organizationalCapacity,
                },
              }
            : undefined,
          decisionResult: decisionResult
            ? {
                requestId: decisionResult.requestId,
                healthScore: {
                  value: decisionResult.confidence?.value
                    ? clamp01ToScore(decisionResult.confidence.value)
                    : undefined,
                },
                baseline: {
                  decisionTraceability: decisionResult.confidence?.value
                    ? clamp01ToScore(decisionResult.confidence.value)
                    : undefined,
                  decisionVelocity: decisionResult.recommendations?.length
                    ? Math.min(100, 50 + decisionResult.recommendations.length * 5)
                    : undefined,
                  decisionQuality: decisionResult.confidence?.value
                    ? clamp01ToScore(decisionResult.confidence.value)
                    : undefined,
                },
                recommendations: decisionResult.recommendations?.map((r) => r.title),
              }
            : undefined,
          scope: {
            organizationId: context.scope.organizationId ?? null,
            schoolId: context.scope.schoolId ?? null,
          },
        });

        context.set("innovation", result);

        return createModuleResult({
          moduleId: "innovation",
          context,
          startedAt,
          ok: true,
          data: result,
        });
      } catch (error) {
        return createModuleResult({
          moduleId: "innovation",
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
