/**
 * Intelligence Platform Infrastructure — Market module adapter (Sprint 043).
 *
 * Wraps existing createMarketIntelligence — does not regenerate Sprint 021–042.
 * Terminal module: runs after `legal-compliance-risk`.
 */

import {
  createMarketIntelligence,
  MARKET_INTELLIGENCE_VERSION,
  type CreateMarketOptions,
  type MarketStack,
} from "@/lib/platform/intelligence/market";
import type { OrganizationDnaResult } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type {
  Graph,
  GraphAnalysisResult,
  GraphBuildInput,
} from "@/lib/platform/intelligence/executive-graph/types";
import type { PredictionResult } from "@/lib/platform/intelligence/predictive-intelligence/types";
import type { KnowledgeResult } from "@/lib/platform/intelligence/knowledge/types";
import type { DocumentResult } from "@/lib/platform/intelligence/document/types";
import type { LegalComplianceRiskResult } from "@/lib/platform/intelligence/legal-compliance-risk/types";
import type { RevenueResult } from "@/lib/platform/intelligence/revenue/types";
import type { FundingResult } from "@/lib/platform/intelligence/funding/types";
import type { CustomerResult } from "@/lib/platform/intelligence/customer/types";
import type { BusinessModelResult } from "@/lib/platform/intelligence/business-model/types";
import type { OperationsResult } from "@/lib/platform/intelligence/operations/types";
import type { OpportunityResult } from "@/lib/platform/intelligence/opportunity/types";
import type {
  IntelligenceExecutionContext,
  IntelligenceModule,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import { createModuleResult } from "@/lib/platform/intelligence/infrastructure/module-result";

export function createMarketModule(
  options: CreateMarketOptions = {},
  stack?: MarketStack
): IntelligenceModule {
  const market =
    stack ??
    createMarketIntelligence({
      ...options,
      wireOrganizationDna: options.wireOrganizationDna ?? false,
      wireOios: options.wireOios ?? false,
    });

  return {
    id: "market",
    name: "Market Intelligence",
    version: MARKET_INTELLIGENCE_VERSION,
    dependencies: ["legal-compliance-risk"],
    capabilities: [
      { key: "market.industry", description: "Industry structure, attractiveness, and growth signals" },
      { key: "market.competitive", description: "Competitive position, launches, and pricing pressure" },
      { key: "market.size", description: "TAM / SAM / SOM market size intelligence" },
      { key: "market.pricing", description: "Pricing power and competitive pricing bands" },
      { key: "market.demand", description: "Customer demand momentum and shift signals" },
      { key: "market.demographic", description: "Demographic fit and population change signals" },
      { key: "market.geographic", description: "Geographic expansion candidates and readiness" },
      { key: "market.economic", description: "Economic indicators and employment trends" },
      { key: "market.technology", description: "Technology disruption and adoption trends" },
      { key: "market.partnership", description: "Partnership density and alliance opportunities" },
      { key: "market.ma", description: "Mergers & acquisitions activity and targets" },
      { key: "market.white_space", description: "White space opportunity identification" },
      { key: "market.recommendations", description: "Strategic market recommendations with 8-field lens" },
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
        const knowledgeResult = context.get<KnowledgeResult>("knowledge");
        const documentResult = context.get<DocumentResult>("document");
        const legalComplianceRiskResult =
          context.get<LegalComplianceRiskResult>("legalComplianceRisk");
        const revenueResult = context.get<RevenueResult>("revenue");
        const fundingResult = context.get<FundingResult>("funding");
        const customerResult = context.get<CustomerResult>("customer");
        const businessModelResult = context.get<BusinessModelResult>("businessModel");
        const operationsResult = context.get<OperationsResult>("operations");
        const opportunityResult = context.get<OpportunityResult>("opportunity");

        const input = context.input as
          | {
              question?: string;
              periodLabel?: string;
            }
          | undefined;

        const result = market.service.build({
          requestId: context.runId,
          question:
            typeof input?.question === "string"
              ? input.question
              : "What market opportunities should we anticipate, and what evidence supports acting now versus waiting?",
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
                  contractDensity: documentResult.baseline?.contractDensity,
                  documentCount: documentResult.baseline?.documentCount,
                },
              }
            : undefined,
          legalComplianceRiskResult: legalComplianceRiskResult
            ? {
                requestId: legalComplianceRiskResult.requestId,
                healthScore: { value: legalComplianceRiskResult.healthScore?.value },
                riskScore: { value: legalComplianceRiskResult.riskScore?.value },
                complianceHealthScore: {
                  value: legalComplianceRiskResult.complianceHealthScore?.value,
                },
                baseline: {
                  riskPressure: legalComplianceRiskResult.baseline?.riskPressure,
                  complianceCoverage: legalComplianceRiskResult.baseline?.complianceCoverage,
                  regulatoryCoverage: legalComplianceRiskResult.baseline?.regulatoryCoverage,
                },
              }
            : undefined,
          revenueResult: revenueResult
            ? {
                requestId: revenueResult.requestId,
                healthScore: { value: revenueResult.healthScore?.value },
                baseline: {
                  revenueDiversification: revenueResult.baseline?.diversificationIndex
                    ? revenueResult.baseline.diversificationIndex * 100
                    : undefined,
                  pricingPower: revenueResult.baseline?.priceCompetitiveness,
                  pipelineCoverage: revenueResult.baseline?.pipelineCoverage,
                },
              }
            : undefined,
          fundingResult: fundingResult
            ? {
                requestId: fundingResult.requestId,
                healthScore: { value: fundingResult.healthScore?.value },
                baseline: {
                  grantReadiness: fundingResult.baseline?.proposalCapacity,
                  pipelineCoverage: fundingResult.baseline?.pipelineFunding
                    ? Math.min(100, fundingResult.baseline.pipelineFunding / 10_000)
                    : undefined,
                  fundingCapacity: fundingResult.healthScore?.value,
                },
              }
            : undefined,
          customerResult: customerResult
            ? {
                requestId: customerResult.requestId,
                healthScore: { value: customerResult.healthScore?.value },
                baseline: {
                  familyExperienceScore: customerResult.baseline?.familyExperienceScore,
                  demandMomentum: customerResult.baseline?.familyExperienceScore,
                  communicationCoverage: customerResult.baseline?.communicationQuality,
                  complaintBurden: customerResult.baseline?.complaintBurden,
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
          operationsResult: operationsResult
            ? {
                requestId: operationsResult.requestId,
                healthScore: { value: operationsResult.healthScore?.value },
                workflowScore: { value: operationsResult.workflowScore?.value },
                baseline: {
                  operationsScore: operationsResult.baseline?.operationsScore,
                  processCoverage: operationsResult.baseline?.processMaturity,
                  capacityScore: operationsResult.baseline?.capacityHeadroom,
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
          scope: {
            organizationId: context.scope.organizationId ?? null,
            schoolId: context.scope.schoolId ?? null,
          },
        });

        context.set("market", result);

        return createModuleResult({
          moduleId: "market",
          context,
          startedAt,
          ok: true,
          data: result,
        });
      } catch (error) {
        return createModuleResult({
          moduleId: "market",
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
