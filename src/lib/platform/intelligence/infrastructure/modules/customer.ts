/**
 * Intelligence Platform Infrastructure — Customer module adapter (Sprint 039).
 *
 * Wraps existing createCustomerIntelligence — does not regenerate Sprint 021–038.
 * Distinct from Revenue's customer-revenue suite and DNA personas.
 */

import {
  createCustomerIntelligence,
  CUSTOMER_INTELLIGENCE_VERSION,
  type CreateCustomerOptions,
  type CustomerStack,
} from "@/lib/platform/intelligence/customer";
import type { OrganizationDnaResult } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type {
  Graph,
  GraphAnalysisResult,
  GraphBuildInput,
} from "@/lib/platform/intelligence/executive-graph/types";
import type { ExecutiveDecisionResult } from "@/lib/platform/intelligence/executive-decision/types";
import type { PredictionResult } from "@/lib/platform/intelligence/predictive-intelligence/types";
import type { RevenueResult } from "@/lib/platform/intelligence/revenue/types";
import type { OperationsResult } from "@/lib/platform/intelligence/operations/types";
import type {
  IntelligenceExecutionContext,
  IntelligenceModule,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import { createModuleResult } from "@/lib/platform/intelligence/infrastructure/module-result";

export function createCustomerModule(
  options: CreateCustomerOptions = {},
  stack?: CustomerStack
): IntelligenceModule {
  const customer =
    stack ??
    createCustomerIntelligence({
      ...options,
      wireOrganizationDna: options.wireOrganizationDna ?? false,
      wireOios: options.wireOios ?? false,
    });

  return {
    id: "customer",
    name: "Customer Intelligence",
    version: CUSTOMER_INTELLIGENCE_VERSION,
    dependencies: ["operations"],
    capabilities: [
      {
        key: "customer.journey",
        description:
          "Journey map across inquiry through advocacy lifecycle stages",
      },
      {
        key: "customer.engagement",
        description:
          "Student engagement across attendance, participation, and progress",
      },
      {
        key: "customer.satisfaction",
        description: "Satisfaction signals including NPS proxy and trust",
      },
      {
        key: "customer.retention",
        description: "Retention risk watchlist across six risk factors",
      },
      {
        key: "customer.community",
        description: "Community belonging across five pillars",
      },
      {
        key: "customer.brief",
        description: "Executive Customer Brief with six-lens narratives",
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
        const revenueResult = context.get<RevenueResult>("revenue");
        const operationsResult = context.get<OperationsResult>("operations");

        const input = context.input as
          | {
              question?: string;
              periodLabel?: string;
            }
          | undefined;

        const result = customer.service.build({
          requestId: context.runId,
          question:
            typeof input?.question === "string"
              ? input.question
              : "How healthy is our family and student experience, and where should we improve?",
          periodLabel: input?.periodLabel,
          dnaResult: dnaResult ?? undefined,
          dna: dnaResult?.dna,
          oiosResult: oiosResult ?? undefined,
          graph: graphBundle?.graph,
          analysis: graphBundle?.analysis,
          graphInput: graphBundle?.graphInput,
          decisionResult: decisionResult ?? undefined,
          predictionResult: predictionResult ?? undefined,
          revenueResult: revenueResult
            ? {
                requestId: revenueResult.requestId,
                healthScore: { value: revenueResult.healthScore?.value },
                recommendations: revenueResult.recommendations,
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
                  studentAttendance:
                    operationsResult.baseline?.studentAttendance,
                },
                processMonitoring: {
                  overallScore: operationsResult.processMonitoring?.overallScore,
                  hottestBottleneck:
                    operationsResult.processMonitoring?.hottestBottleneck,
                },
                recommendations: operationsResult.recommendations?.map(
                  (r) => r.title
                ),
              }
            : undefined,
          scope: {
            organizationId: context.scope.organizationId ?? null,
            schoolId: context.scope.schoolId ?? null,
          },
        });

        context.set("customer", result);

        return createModuleResult({
          moduleId: "customer",
          context,
          startedAt,
          ok: true,
          data: result,
        });
      } catch (error) {
        return createModuleResult({
          moduleId: "customer",
          context,
          startedAt,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  };
}
