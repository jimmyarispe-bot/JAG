/**
 * Intelligence Platform Infrastructure — Funding module adapter (Sprint 034).
 *
 * Wraps existing createFundingIntelligence — does not regenerate Sprint 021–033.
 */

import {
  createFundingIntelligence,
  FUNDING_INTELLIGENCE_VERSION,
  type CreateFundingOptions,
  type FundingStack,
} from "@/lib/platform/intelligence/funding";
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
import type {
  IntelligenceExecutionContext,
  IntelligenceModule,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import { createModuleResult } from "@/lib/platform/intelligence/infrastructure/module-result";

export function createFundingModule(
  options: CreateFundingOptions = {},
  stack?: FundingStack
): IntelligenceModule {
  const funding =
    stack ??
    createFundingIntelligence({
      ...options,
      wireOrganizationDna: options.wireOrganizationDna ?? false,
      wireOios: options.wireOios ?? false,
    });

  return {
    id: "funding",
    name: "Funding Intelligence",
    version: FUNDING_INTELLIGENCE_VERSION,
    dependencies: ["revenue"],
    capabilities: [
      {
        key: "funding.government",
        description: "Federal, state, local, education, healthcare, and research funding",
      },
      {
        key: "funding.grants",
        description: "Grant discovery, matching, scoring, calendar, compliance, and renewals",
      },
      {
        key: "funding.contracts",
        description: "Government and corporate contracts, RFPs, bids, and proposals",
      },
      {
        key: "funding.philanthropy",
        description: "Foundations, major donors, corporate giving, and capital campaigns",
      },
      {
        key: "funding.investment",
        description: "Angel, VC, PE, strategic, debt, and revenue-based financing",
      },
      {
        key: "funding.alternative",
        description: "Crowdfunding, tax credits, opportunity zones, licensing, and royalties",
      },
      {
        key: "funding.strategy",
        description: "Funding mix, diversification, risk, runway, and capital planning",
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

        const input = context.input as
          | {
              question?: string;
              periodLabel?: string;
            }
          | undefined;

        const result = funding.service.build({
          requestId: context.runId,
          question:
            typeof input?.question === "string"
              ? input.question
              : "How do we maximize available, diversified, sustainable funding?",
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
                riskScore: { value: revenueResult.riskScore?.value },
                baseline: {
                  annualRevenue: revenueResult.baseline?.annualRevenue,
                  diversificationIndex:
                    revenueResult.baseline?.diversificationIndex,
                },
                recommendations: revenueResult.recommendations,
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

        context.set("funding", result);

        return createModuleResult({
          moduleId: "funding",
          context,
          startedAt,
          ok: true,
          data: result,
        });
      } catch (error) {
        return createModuleResult({
          moduleId: "funding",
          context,
          startedAt,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  };
}
