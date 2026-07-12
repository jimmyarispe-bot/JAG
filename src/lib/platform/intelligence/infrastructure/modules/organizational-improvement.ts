/**
 * Intelligence Platform Infrastructure — Organizational Improvement module adapter (Sprint 036).
 *
 * Wraps existing createOrganizationalImprovementIntelligence — does not regenerate Sprint 021–035.
 */

import {
  createOrganizationalImprovementIntelligence,
  IMPROVEMENT_INTELLIGENCE_VERSION,
  type CreateImprovementOptions,
  type ImprovementStack,
} from "@/lib/platform/intelligence/organizational-improvement";
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
import type {
  IntelligenceExecutionContext,
  IntelligenceModule,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import { createModuleResult } from "@/lib/platform/intelligence/infrastructure/module-result";

export function createOrganizationalImprovementModule(
  options: CreateImprovementOptions = {},
  stack?: ImprovementStack
): IntelligenceModule {
  const improvement =
    stack ??
    createOrganizationalImprovementIntelligence({
      ...options,
      wireOrganizationDna: options.wireOrganizationDna ?? false,
      wireOios: options.wireOios ?? false,
      wireOpportunity: options.wireOpportunity ?? false,
    });

  return {
    id: "organizational-improvement",
    name: "Organizational Improvement Engine",
    version: IMPROVEMENT_INTELLIGENCE_VERSION,
    dependencies: ["opportunity"],
    capabilities: [
      {
        key: "improvement.orchestration",
        description: "Unify every OIOS domain opportunity into prioritized organizational improvements",
      },
      {
        key: "improvement.analysis",
        description: "Score priority, impact, mission, financial, risk, capacity, and confidence",
      },
      {
        key: "improvement.planning",
        description: "Compose quick wins, strategic initiatives, and weekly through annual roadmaps",
      },
      {
        key: "improvement.loop",
        description: "Run the continuous observe→learn→repeat improvement loop",
      },
      {
        key: "improvement.dashboards",
        description: "Mission, financial, people, heat map, and today's priorities dashboards",
      },
      {
        key: "improvement.brief",
        description: "Daily Executive Brief and Executive Improvement Brief with ten-lens narratives",
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

        const input = context.input as
          | {
              question?: string;
              periodLabel?: string;
            }
          | undefined;

        const result = improvement.service.build({
          requestId: context.runId,
          question:
            typeof input?.question === "string"
              ? input.question
              : "What are the highest-impact improvements the organization should take now?",
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
                opportunityScore: {
                  value: fundingResult.opportunityScore?.value,
                },
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
          opportunityResult: opportunityResult
            ? {
                requestId: opportunityResult.requestId,
                opportunityScore: {
                  value: opportunityResult.opportunityScore?.value,
                },
                healthScore: { value: opportunityResult.healthScore?.value },
                exchange: opportunityResult.exchange,
                recommendations: opportunityResult.recommendations,
              }
            : undefined,
          publishedOpportunities: opportunityResult?.exchange,
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

        context.set("organizational-improvement", result);

        return createModuleResult({
          moduleId: "organizational-improvement",
          context,
          startedAt,
          ok: true,
          data: result,
        });
      } catch (error) {
        return createModuleResult({
          moduleId: "organizational-improvement",
          context,
          startedAt,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  };
}
