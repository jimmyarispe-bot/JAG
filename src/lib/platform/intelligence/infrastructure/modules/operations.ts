/**
 * Intelligence Platform Infrastructure — Operations module adapter (Sprint 038).
 *
 * Wraps existing createOperationsIntelligence — does not regenerate Sprint 021–037.
 * Distinct from organization-health's operations.ts stub.
 */

import {
  createOperationsIntelligence,
  OPERATIONS_INTELLIGENCE_VERSION,
  type CreateOperationsOptions,
  type OperationsStack,
} from "@/lib/platform/intelligence/operations";
import type { OrganizationDnaResult } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type {
  Graph,
  GraphAnalysisResult,
  GraphBuildInput,
} from "@/lib/platform/intelligence/executive-graph/types";
import type { ExecutiveDecisionResult } from "@/lib/platform/intelligence/executive-decision/types";
import type { PredictionResult } from "@/lib/platform/intelligence/predictive-intelligence/types";
import type { HumanCapitalResult } from "@/lib/platform/intelligence/human-capital/types";
import type { BusinessModelResult } from "@/lib/platform/intelligence/business-model/types";
import type { ImprovementResult } from "@/lib/platform/intelligence/organizational-improvement/types";
import type {
  IntelligenceExecutionContext,
  IntelligenceModule,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import { createModuleResult } from "@/lib/platform/intelligence/infrastructure/module-result";

export function createOperationsModule(
  options: CreateOperationsOptions = {},
  stack?: OperationsStack
): IntelligenceModule {
  const operations =
    stack ??
    createOperationsIntelligence({
      ...options,
      wireOrganizationDna: options.wireOrganizationDna ?? false,
      wireOios: options.wireOios ?? false,
    });

  return {
    id: "operations",
    name: "Operations Intelligence",
    version: OPERATIONS_INTELLIGENCE_VERSION,
    dependencies: ["business-model"],
    capabilities: [
      {
        key: "operations.workflow",
        description: "Workflow health across throughput, cycle time, backlog, and SLA",
      },
      {
        key: "operations.process",
        description: "Process monitoring across enrollment, staffing, and support areas",
      },
      {
        key: "operations.staffing",
        description: "Staffing analytics and adequacy scoring",
      },
      {
        key: "operations.capacity",
        description: "Capacity planning across immediate through annual horizons",
      },
      {
        key: "operations.automation",
        description: "Automation opportunity identification and prioritization",
      },
      {
        key: "operations.brief",
        description: "Executive Operations Brief with six-lens narratives",
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
        const humanCapitalResult =
          context.get<HumanCapitalResult>("humanCapital");
        const businessModelResult =
          context.get<BusinessModelResult>("business-model");
        const improvementResult = context.get<ImprovementResult>(
          "organizational-improvement"
        );

        const input = context.input as
          | {
              question?: string;
              periodLabel?: string;
            }
          | undefined;

        const result = operations.service.build({
          requestId: context.runId,
          question:
            typeof input?.question === "string"
              ? input.question
              : "How healthy are our day-to-day operations, and where should we optimize?",
          periodLabel: input?.periodLabel,
          dnaResult: dnaResult ?? undefined,
          dna: dnaResult?.dna,
          oiosResult: oiosResult ?? undefined,
          graph: graphBundle?.graph,
          analysis: graphBundle?.analysis,
          graphInput: graphBundle?.graphInput,
          decisionResult: decisionResult ?? undefined,
          predictionResult: predictionResult ?? undefined,
          humanCapitalResult: humanCapitalResult
            ? {
                requestId: humanCapitalResult.requestId,
                workforceHealthScore: {
                  value: humanCapitalResult.workforceHealthScore?.value,
                },
                recommendations: humanCapitalResult.recommendations,
              }
            : undefined,
          businessModelResult: businessModelResult
            ? {
                healthScore: { value: businessModelResult.healthScore?.value },
                clarityScore: {
                  value: businessModelResult.clarityScore?.value,
                },
                baseline: {
                  operationalComplexity:
                    businessModelResult.baseline?.operationalComplexity,
                  scalabilityScore:
                    businessModelResult.baseline?.scalabilityScore,
                  sustainabilityScore:
                    businessModelResult.baseline?.sustainabilityScore,
                },
                recommendations: businessModelResult.recommendations?.map(
                  (r) => r.title
                ),
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

        context.set("operations", result);

        return createModuleResult({
          moduleId: "operations",
          context,
          startedAt,
          ok: true,
          data: result,
        });
      } catch (error) {
        return createModuleResult({
          moduleId: "operations",
          context,
          startedAt,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  };
}
