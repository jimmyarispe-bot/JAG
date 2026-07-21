/**
 * Intelligence Platform Infrastructure - Predictive Intelligence module adapter (Sprint 065).
 *
 * Wraps createExecutivePredictiveIntelligence — forecasting after decision-intelligence.
 * Soft-reads decision-intelligence + executive-memory + briefing lights.
 * Distinct from Sprint 028 `predictive-intelligence/` (module id `predictive`).
 */

import {
  createExecutivePredictiveIntelligence,
  EXECUTIVE_PREDICTIVE_VERSION,
  type BriefingResultLight,
  type CreateExecutivePredictiveOptions,
  type DecisionIntelligenceResultLight,
  type ExecutiveMemoryResultLight,
  type ExecutivePredictiveStack,
  type HistoricalSignal,
} from "@/lib/platform/intelligence/executive-predictive";
import type {
  IntelligenceExecutionContext,
  IntelligenceModule,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import { createModuleResult } from "@/lib/platform/intelligence/infrastructure/module-result";

export function createExecutivePredictiveModule(
  options: CreateExecutivePredictiveOptions = {},
  stack?: ExecutivePredictiveStack
): IntelligenceModule {
  const predictive =
    stack ??
    createExecutivePredictiveIntelligence({
      ...options,
    });

  return {
    id: "executive-predictive",
    name: "Predictive Intelligence",
    version: EXECUTIVE_PREDICTIVE_VERSION,
    dependencies: ["decision-intelligence"],
    capabilities: [
      { key: "predict.forecast", description: "Organizational forecasting with assumptions" },
      { key: "predict.scenarios", description: "Best / expected / worst scenario analysis" },
      { key: "predict.signals", description: "Emerging weak-signal detection" },
      { key: "predict.decision-impact", description: "Decision option impact forecasting" },
      { key: "predict.explainability", description: "Why / evidence / invalidators / confidence" },
      { key: "predict.drift", description: "Forecast vs actual drift monitoring" },
    ],
    async execute(context: IntelligenceExecutionContext) {
      const startedAt = new Date().toISOString();
      try {
        const input = context.input as
          | {
              periodLabel?: string;
              historicalSignals?: HistoricalSignal[];
              actuals?: Array<{ subject: string; value: number; at?: string }>;
              customScenario?: { label: string; magnitude?: number; narrative?: string };
            }
          | undefined;

        const decisionRaw =
          context.get<Record<string, unknown>>("decision-intelligence") ??
          context.get<Record<string, unknown>>("decisionIntelligence");
        const memoryRaw =
          context.get<Record<string, unknown>>("executive-memory") ??
          context.get<Record<string, unknown>>("executiveMemory");
        const briefingRaw = context.get<Record<string, unknown>>("briefing");

        const result = predictive.service.build({
          requestId: context.runId,
          scope: {
            organizationId: context.scope.organizationId ?? null,
            schoolId: context.scope.schoolId ?? null,
          },
          decisionResult: decisionRaw as unknown as DecisionIntelligenceResultLight | undefined,
          memoryResult: memoryRaw as unknown as ExecutiveMemoryResultLight | undefined,
          briefingResult: briefingRaw as unknown as BriefingResultLight | undefined,
          historicalSignals: input?.historicalSignals,
          actuals: input?.actuals as
            | Array<{ subject: HistoricalSignal["subject"]; value: number; at?: string }>
            | undefined,
          customScenario: input?.customScenario,
          periodLabel: input?.periodLabel,
        });

        context.set("executivePredictive", result);
        context.set("executive-predictive", result);
        return createModuleResult({
          moduleId: "executive-predictive",
          context,
          startedAt,
          ok: true,
          data: result,
        });
      } catch (error) {
        return createModuleResult({
          moduleId: "executive-predictive",
          context,
          startedAt,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  };
}
