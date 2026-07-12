/**
 * Intelligence Platform Infrastructure — Opportunity module adapter (Sprint 035).
 *
 * Wraps existing createOpportunityIntelligence — does not regenerate Sprint 021–034.
 */

import {
  createOpportunityIntelligence,
  OPPORTUNITY_INTELLIGENCE_VERSION,
  type CreateOpportunityOptions,
  type OpportunityStack,
} from "@/lib/platform/intelligence/opportunity";
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
import type {
  IntelligenceExecutionContext,
  IntelligenceModule,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import { createModuleResult } from "@/lib/platform/intelligence/infrastructure/module-result";

export function createOpportunityModule(
  options: CreateOpportunityOptions = {},
  stack?: OpportunityStack
): IntelligenceModule {
  const opportunity =
    stack ??
    createOpportunityIntelligence({
      ...options,
      wireOrganizationDna: options.wireOrganizationDna ?? false,
      wireOios: options.wireOios ?? false,
    });

  return {
    id: "opportunity",
    name: "Opportunity Intelligence",
    version: OPPORTUNITY_INTELLIGENCE_VERSION,
    dependencies: ["funding"],
    capabilities: [
      {
        key: "opportunity.discovery",
        description: "Discover opportunities across 22 organizational categories",
      },
      {
        key: "opportunity.analysis",
        description: "Score ROI, impact, risk, confidence, dependencies, and time-to-value",
      },
      {
        key: "opportunity.ranking",
        description: "Rank by ROI, quick wins, strategic, mission, confidence, and risk",
      },
      {
        key: "opportunity.exchange",
        description: "Common opportunity contract for every OIOS domain to publish into",
      },
      {
        key: "opportunity.dashboards",
        description: "Top, quick-win, strategic, mission, heat map, and pipeline dashboards",
      },
      {
        key: "opportunity.brief",
        description: "Executive Opportunity Brief with five-lens recommendation narratives",
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

        const input = context.input as
          | {
              question?: string;
              periodLabel?: string;
            }
          | undefined;

        const result = opportunity.service.build({
          requestId: context.runId,
          question:
            typeof input?.question === "string"
              ? input.question
              : "What opportunities will make the organization healthier, stronger, and more sustainable?",
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
                opportunityScore: {
                  value:
                    revenueResult.opportunities &&
                    revenueResult.opportunities.length > 0
                      ? Math.round(
                          revenueResult.opportunities.reduce(
                            (sum, item) => sum + item.score,
                            0
                          ) / revenueResult.opportunities.length
                        )
                      : revenueResult.growthScore?.value,
                },
                baseline: {
                  annualRevenue: revenueResult.baseline?.annualRevenue,
                  diversificationIndex:
                    revenueResult.baseline?.diversificationIndex,
                },
                recommendations: revenueResult.recommendations,
              }
            : undefined,
          fundingResult: fundingResult
            ? {
                healthScore: { value: fundingResult.healthScore?.value },
                opportunityScore: { value: fundingResult.opportunityScore?.value },
                baseline: {
                  annualFundingNeed: fundingResult.baseline?.annualFundingNeed,
                  pipelineFunding: fundingResult.baseline?.pipelineFunding,
                  cashRunwayMonths: fundingResult.baseline?.cashRunwayMonths,
                },
                topOpportunities: fundingResult.topOpportunities?.map((item) => ({
                  id: item.id,
                  name: item.name,
                  amount: item.amount,
                  score: item.score,
                })),
                recommendations: fundingResult.recommendations,
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

        context.set("opportunity", result);

        return createModuleResult({
          moduleId: "opportunity",
          context,
          startedAt,
          ok: true,
          data: result,
        });
      } catch (error) {
        return createModuleResult({
          moduleId: "opportunity",
          context,
          startedAt,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  };
}
