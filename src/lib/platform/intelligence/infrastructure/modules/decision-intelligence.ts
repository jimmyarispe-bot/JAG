/**
 * Intelligence Platform Infrastructure - Decision Intelligence module adapter (Sprint 064).
 *
 * Wraps createDecisionIntelligence — decision support after executive-memory.
 * Soft-reads executive-memory + briefing lights.
 * Distinct from early cognitive `intelligence/decision` DecisionResolver.
 */

import {
  createDecisionIntelligence,
  DECISION_INTELLIGENCE_VERSION,
  type CreateDecisionIntelligenceOptions,
  type DecisionIntelligenceStack,
  type DecisionContextLight,
  type ExecutiveMemoryResultLight,
} from "@/lib/platform/intelligence/decision-intelligence";
import type {
  IntelligenceExecutionContext,
  IntelligenceModule,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import { createModuleResult } from "@/lib/platform/intelligence/infrastructure/module-result";

export function createDecisionIntelligenceModule(
  options: CreateDecisionIntelligenceOptions = {},
  stack?: DecisionIntelligenceStack
): IntelligenceModule {
  const decision =
    stack ??
    createDecisionIntelligence({
      ...options,
    });

  return {
    id: "decision-intelligence",
    name: "Decision Intelligence",
    version: DECISION_INTELLIGENCE_VERSION,
    dependencies: ["executive-memory"],
    capabilities: [
      { key: "decision.options", description: "Multi-option decision generation" },
      { key: "decision.scoring", description: "Multi-criteria scorecards" },
      { key: "decision.ranking", description: "Recommendation ranking with trade-offs" },
      { key: "decision.history", description: "Historical lookup via executive-memory" },
      { key: "decision.policies", description: "Policy-aware approval flags" },
      { key: "decision.explainability", description: "Why / evidence / assumptions" },
    ],
    async execute(context: IntelligenceExecutionContext) {
      const startedAt = new Date().toISOString();
      try {
        const input = context.input as
          | {
              periodLabel?: string;
              question?: string;
              issueTitle?: string;
              issueKind?: string;
            }
          | undefined;

        const memoryRaw = context.get<Record<string, unknown>>("executive-memory")
          ?? context.get<Record<string, unknown>>("executiveMemory");
        const briefingRaw = context.get<Record<string, unknown>>("briefing");

        const result = decision.service.build({
          requestId: context.runId,
          scope: {
            organizationId: context.scope.organizationId ?? null,
            schoolId: context.scope.schoolId ?? null,
          },
          briefingResult: briefingRaw as unknown as DecisionContextLight | undefined,
          memoryResult: memoryRaw as unknown as ExecutiveMemoryResultLight | undefined,
          issue: input?.issueTitle
            ? {
                title: input.issueTitle,
                kind: input.issueKind as never,
                summary: input.question,
              }
            : undefined,
          periodLabel: input?.periodLabel,
          metadata: { question: input?.question },
        });

        context.set("decisionIntelligence", result);
        context.set("decision-intelligence", result);
        return createModuleResult({
          moduleId: "decision-intelligence",
          context,
          startedAt,
          ok: true,
          data: result,
        });
      } catch (error) {
        return createModuleResult({
          moduleId: "decision-intelligence",
          context,
          startedAt,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  };
}
