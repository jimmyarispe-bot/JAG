/**
 * Intelligence Platform Infrastructure — Revenue module adapter (Sprint 033).
 *
 * Wraps existing createRevenueIntelligence — does not regenerate Sprint 021–032.
 */

import {
  createRevenueIntelligence,
  REVENUE_INTELLIGENCE_VERSION,
  type CreateRevenueOptions,
  type RevenueStack,
} from "@/lib/platform/intelligence/revenue";
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
import type {
  IntelligenceExecutionContext,
  IntelligenceModule,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import { createModuleResult } from "@/lib/platform/intelligence/infrastructure/module-result";

export function createRevenueModule(
  options: CreateRevenueOptions = {},
  stack?: RevenueStack
): IntelligenceModule {
  const revenue =
    stack ??
    createRevenueIntelligence({
      ...options,
      wireOrganizationDna: options.wireOrganizationDna ?? false,
      wireOios: options.wireOios ?? false,
    });

  return {
    id: "revenue",
    name: "Revenue Intelligence",
    version: REVENUE_INTELLIGENCE_VERSION,
    dependencies: ["human-capital"],
    capabilities: [
      {
        key: "revenue.strategy",
        description: "Revenue mix, diversification, growth, and scenario planning",
      },
      {
        key: "revenue.pricing",
        description: "Pricing elasticity, discounts, scholarships, and subscriptions",
      },
      {
        key: "revenue.offerings",
        description: "Product and service profitability and lifecycle intelligence",
      },
      {
        key: "revenue.customers",
        description: "LTV, retention, expansion, and segment profitability",
      },
      {
        key: "revenue.sales",
        description: "Pipeline forecast, win rate, capacity, and conversion",
      },
      {
        key: "revenue.market",
        description: "Market expansion, demand, and competitive revenue signals",
      },
      {
        key: "revenue.margins",
        description: "Gross/net/contribution margin and unit economics",
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

        const input = context.input as
          | {
              question?: string;
              periodLabel?: string;
            }
          | undefined;

        const result = revenue.service.build({
          requestId: context.runId,
          question:
            typeof input?.question === "string"
              ? input.question
              : "How do we maximize sustainable revenue and profitability?",
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
          financialSignal: financial
            ? {
                revenue: financial.revenue ?? 0,
                expenses: financial.expenses ?? 0,
                marginPct: financial.marginPct ?? 0,
              }
            : undefined,
          scope: {
            organizationId: context.scope.organizationId ?? null,
            schoolId: context.scope.schoolId ?? null,
          },
        });

        context.set("revenue", result);

        return createModuleResult({
          moduleId: "revenue",
          context,
          startedAt,
          ok: true,
          data: result,
        });
      } catch (error) {
        return createModuleResult({
          moduleId: "revenue",
          context,
          startedAt,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  };
}
