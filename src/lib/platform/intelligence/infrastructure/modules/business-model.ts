/**
 * Intelligence Platform Infrastructure — Business Model module adapter (Sprint 037).
 *
 * Wraps existing createBusinessModelIntelligence — does not regenerate Sprint 021–036.
 * Distinct from organization-dna's BusinessModelEngine artifact builder.
 */

import {
  createBusinessModelIntelligence,
  BUSINESS_MODEL_INTELLIGENCE_VERSION,
  type CreateBusinessModelOptions,
  type BusinessModelStack,
} from "@/lib/platform/intelligence/business-model";
import type { OrganizationDnaResult } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type {
  Graph,
  GraphAnalysisResult,
  GraphBuildInput,
} from "@/lib/platform/intelligence/executive-graph/types";
import type { ExecutiveDecisionResult } from "@/lib/platform/intelligence/executive-decision/types";
import type { PredictionResult } from "@/lib/platform/intelligence/predictive-intelligence/types";
import type { GovernanceResult } from "@/lib/platform/intelligence/board-governance/types";
import type { HumanCapitalResult } from "@/lib/platform/intelligence/human-capital/types";
import type { RevenueResult } from "@/lib/platform/intelligence/revenue/types";
import type { FundingResult } from "@/lib/platform/intelligence/funding/types";
import type { OpportunityResult } from "@/lib/platform/intelligence/opportunity/types";
import type { ImprovementResult } from "@/lib/platform/intelligence/organizational-improvement/types";
import type {
  IntelligenceExecutionContext,
  IntelligenceModule,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import { createModuleResult } from "@/lib/platform/intelligence/infrastructure/module-result";

export function createBusinessModelModule(
  options: CreateBusinessModelOptions = {},
  stack?: BusinessModelStack
): IntelligenceModule {
  const businessModel =
    stack ??
    createBusinessModelIntelligence({
      ...options,
      wireOrganizationDna: options.wireOrganizationDna ?? false,
      wireOios: options.wireOios ?? false,
    });

  return {
    id: "business-model",
    name: "Business Model Intelligence",
    version: BUSINESS_MODEL_INTELLIGENCE_VERSION,
    dependencies: ["organizational-improvement"],
    capabilities: [
      {
        key: "business-model.canvas",
        description: "Business Model Canvas and Lean Canvas composition",
      },
      {
        key: "business-model.design",
        description: "Organization design and alternative business models",
      },
      {
        key: "business-model.simulation",
        description: "Multi-model simulation and forecast comparison",
      },
      {
        key: "business-model.scenarios",
        description: "Current, alternative, competitor, and future scenario planning",
      },
      {
        key: "business-model.health",
        description: "Business model health, clarity, scalability, and sustainability",
      },
      {
        key: "business-model.brief",
        description: "Executive Business Brief with six-lens narratives",
      },
    ],
    async execute(context: IntelligenceExecutionContext) {
      const startedAt = new Date().toISOString();
      try {
        const dnaResult = context.get<OrganizationDnaResult>("organizationDna");
        const oiosResult = context.get<OiosResult>("oios");
        const financial = context.get<{
          revenue?: number;
          expenses?: number;
          marginPct?: number;
          cash?: number;
        }>("financial");
        const graphBundle = context.get<{
          graph?: Graph;
          analysis?: GraphAnalysisResult;
          graphInput?: GraphBuildInput;
        }>("executiveGraph");
        const decisionResult =
          context.get<ExecutiveDecisionResult>("executiveDecision");
        const predictionResult = context.get<PredictionResult>("predictive");
        const governanceResult =
          context.get<GovernanceResult>("boardGovernance");
        const humanCapitalResult =
          context.get<HumanCapitalResult>("humanCapital");
        const revenueResult = context.get<RevenueResult>("revenue");
        const fundingResult = context.get<FundingResult>("funding");
        const opportunityResult =
          context.get<OpportunityResult>("opportunity");
        const improvementResult = context.get<ImprovementResult>(
          "organizational-improvement"
        );

        const input = context.input as
          | {
              question?: string;
              periodLabel?: string;
            }
          | undefined;

        const result = businessModel.service.build({
          requestId: context.runId,
          question:
            typeof input?.question === "string"
              ? input.question
              : "How should we create, deliver, and capture value more effectively?",
          periodLabel: input?.periodLabel,
          dnaResult: dnaResult ?? undefined,
          dna: dnaResult?.dna,
          oiosResult: oiosResult ?? undefined,
          graph: graphBundle?.graph,
          analysis: graphBundle?.analysis,
          graphInput: graphBundle?.graphInput,
          decisionResult: decisionResult ?? undefined,
          predictionResult: predictionResult ?? undefined,
          governanceResult: governanceResult ?? undefined,
          humanCapitalResult: humanCapitalResult
            ? {
                requestId: humanCapitalResult.requestId,
                workforceHealthScore: {
                  value: humanCapitalResult.workforceHealthScore?.value,
                },
                recommendations: humanCapitalResult.recommendations,
              }
            : undefined,
          revenueResult: revenueResult
            ? {
                healthScore: { value: revenueResult.healthScore?.value },
                growthScore: { value: revenueResult.growthScore?.value },
                baseline: {
                  annualRevenue: revenueResult.baseline?.annualRevenue,
                  grossMargin: revenueResult.baseline?.grossMargin,
                  diversificationIndex:
                    revenueResult.baseline?.diversificationIndex,
                },
                recommendations: revenueResult.recommendations,
              }
            : undefined,
          fundingResult: fundingResult
            ? {
                healthScore: { value: fundingResult.healthScore?.value },
                opportunityScore: {
                  value: fundingResult.opportunityScore?.value,
                },
                baseline: {
                  annualFundingNeed: fundingResult.baseline?.annualFundingNeed,
                  cashRunwayMonths: fundingResult.baseline?.cashRunwayMonths,
                },
                recommendations: fundingResult.recommendations,
              }
            : undefined,
          opportunityResult: opportunityResult
            ? {
                opportunityScore: {
                  value: opportunityResult.opportunityScore?.value,
                },
                healthScore: { value: opportunityResult.healthScore?.value },
                recommendations: opportunityResult.recommendations,
              }
            : undefined,
          improvementResult: improvementResult
            ? {
                improvementScore: {
                  value: improvementResult.improvementScore?.value,
                },
                healthScore: { value: improvementResult.healthScore?.value },
                recommendations: improvementResult.recommendations,
              }
            : undefined,
          financialSignal: financial
            ? {
                revenue: financial.revenue ?? 0,
                expenses: financial.expenses ?? 0,
                marginPct: financial.marginPct ?? 0,
                cash: financial.cash,
              }
            : undefined,
          scope: {
            organizationId: context.scope.organizationId ?? null,
            schoolId: context.scope.schoolId ?? null,
          },
        });

        context.set("business-model", result);

        return createModuleResult({
          moduleId: "business-model",
          context,
          startedAt,
          ok: true,
          data: result,
        });
      } catch (error) {
        return createModuleResult({
          moduleId: "business-model",
          context,
          startedAt,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  };
}
