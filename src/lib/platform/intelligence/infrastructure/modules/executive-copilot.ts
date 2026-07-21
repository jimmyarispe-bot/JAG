/**
 * Intelligence Platform Infrastructure - Executive Copilot module adapter (Sprint 067).
 *
 * Orchestrates prior executive-stack lights after executive-autonomous.
 * Never auto-executes; execution prep references Autonomous only.
 */

import {
  createExecutiveCopilotIntelligence,
  EXECUTIVE_COPILOT_VERSION,
  type AutonomousResultLight,
  type BriefingResultLight,
  type CreateExecutiveCopilotOptions,
  type DecisionIntelligenceResultLight,
  type ExecutiveCopilotStack,
  type ExecutiveMemoryResultLight,
  type ExecutivePredictiveResultLight,
  type SynthesisResultLight,
} from "@/lib/platform/intelligence/executive-copilot";
import type {
  IntelligenceExecutionContext,
  IntelligenceModule,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import { createModuleResult } from "@/lib/platform/intelligence/infrastructure/module-result";

export function createExecutiveCopilotModule(
  options: CreateExecutiveCopilotOptions = {},
  stack?: ExecutiveCopilotStack
): IntelligenceModule {
  const copilot =
    stack ??
    createExecutiveCopilotIntelligence({
      ...options,
    });

  return {
    id: "executive-copilot",
    name: "Executive Copilot",
    version: EXECUTIVE_COPILOT_VERSION,
    dependencies: ["executive-autonomous"],
    capabilities: [
      { key: "copilot.ask", description: "Conversational strategic reasoning" },
      { key: "copilot.orchestrate", description: "Multi-domain context orchestration" },
      { key: "copilot.investigate", description: "Guided strategic investigations" },
      { key: "copilot.compare", description: "Comparative analysis" },
      { key: "copilot.explain", description: "Explainability and domain traces" },
      { key: "copilot.govern", description: "Human governance — no auto-execute" },
    ],
    async execute(context: IntelligenceExecutionContext) {
      const startedAt = new Date().toISOString();
      try {
        const input = context.input as
          | {
              question?: string;
              periodLabel?: string;
              conversationId?: string;
              requestExecutionPrep?: boolean;
            }
          | undefined;

        const synthesisRaw = context.get<Record<string, unknown>>("synthesis");
        const briefingRaw = context.get<Record<string, unknown>>("briefing");
        const memoryRaw =
          context.get<Record<string, unknown>>("executive-memory") ??
          context.get<Record<string, unknown>>("executiveMemory");
        const decisionRaw =
          context.get<Record<string, unknown>>("decision-intelligence") ??
          context.get<Record<string, unknown>>("decisionIntelligence");
        const predictiveRaw =
          context.get<Record<string, unknown>>("executive-predictive") ??
          context.get<Record<string, unknown>>("executivePredictive");
        const autonomousRaw =
          context.get<Record<string, unknown>>("executive-autonomous") ??
          context.get<Record<string, unknown>>("executiveAutonomous");

        const result = copilot.service.build({
          requestId: context.runId,
          question:
            input?.question ??
            "Summarize the current executive situation and top priorities.",
          scope: {
            organizationId: context.scope.organizationId ?? null,
            schoolId: context.scope.schoolId ?? null,
          },
          conversationId: input?.conversationId,
          periodLabel: input?.periodLabel,
          requestExecutionPrep: input?.requestExecutionPrep,
          synthesisResult: synthesisRaw as unknown as SynthesisResultLight | undefined,
          briefingResult: briefingRaw as unknown as BriefingResultLight | undefined,
          memoryResult: memoryRaw as unknown as ExecutiveMemoryResultLight | undefined,
          decisionResult: decisionRaw as unknown as DecisionIntelligenceResultLight | undefined,
          predictiveResult: predictiveRaw as unknown as ExecutivePredictiveResultLight | undefined,
          autonomousResult: autonomousRaw as unknown as AutonomousResultLight | undefined,
        });

        context.set("executiveCopilot", result);
        context.set("executive-copilot", result);
        return createModuleResult({
          moduleId: "executive-copilot",
          context,
          startedAt,
          ok: true,
          data: result,
        });
      } catch (error) {
        return createModuleResult({
          moduleId: "executive-copilot",
          context,
          startedAt,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  };
}
