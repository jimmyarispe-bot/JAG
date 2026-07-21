/**
 * Intelligence Platform Infrastructure - Executive Command Center module (Sprint 068).
 *
 * Workspace composer after executive-copilot. Soft-reads prior executive-stack lights.
 * Distinct from legacy lib/executive/command-center and Mission Control.
 */

import {
  createExecutiveCommandCenter,
  EXECUTIVE_COMMAND_CENTER_VERSION,
  type AutonomousResultLight,
  type BriefingResultLight,
  type CommandCenterRole,
  type CopilotResultLight,
  type CreateExecutiveCommandCenterOptions,
  type DecisionIntelligenceResultLight,
  type ExecutiveCommandCenterStack,
  type ExecutiveMemoryResultLight,
  type ExecutivePredictiveResultLight,
  type SynthesisResultLight,
} from "@/lib/platform/intelligence/executive-command-center";
import type {
  IntelligenceExecutionContext,
  IntelligenceModule,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import { createModuleResult } from "@/lib/platform/intelligence/infrastructure/module-result";

export function createExecutiveCommandCenterModule(
  options: CreateExecutiveCommandCenterOptions = {},
  stack?: ExecutiveCommandCenterStack
): IntelligenceModule {
  const commandCenter =
    stack ??
    createExecutiveCommandCenter({
      ...options,
    });

  return {
    id: "executive-command-center",
    name: "Executive Command Center",
    version: EXECUTIVE_COMMAND_CENTER_VERSION,
    dependencies: ["executive-copilot"],
    capabilities: [
      { key: "ecc.workspace", description: "Single executive workspace" },
      { key: "ecc.widgets", description: "Domain-projected widgets (no duplicated logic)" },
      { key: "ecc.layouts", description: "Role layouts: founder, CEO, board, school leader" },
      { key: "ecc.refresh", description: "Pipeline-driven refresh" },
      { key: "ecc.drilldown", description: "Standardized card drill-down actions" },
    ],
    async execute(context: IntelligenceExecutionContext) {
      const startedAt = new Date().toISOString();
      try {
        const input = context.input as
          | {
              periodLabel?: string;
              role?: CommandCenterRole;
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
        const copilotRaw =
          context.get<Record<string, unknown>>("executive-copilot") ??
          context.get<Record<string, unknown>>("executiveCopilot");

        const result = commandCenter.service.build({
          requestId: context.runId,
          scope: {
            organizationId: context.scope.organizationId ?? null,
            schoolId: context.scope.schoolId ?? null,
          },
          role: input?.role ?? "ceo",
          periodLabel: input?.periodLabel,
          synthesisResult: synthesisRaw as unknown as SynthesisResultLight | undefined,
          briefingResult: briefingRaw as unknown as BriefingResultLight | undefined,
          memoryResult: memoryRaw as unknown as ExecutiveMemoryResultLight | undefined,
          decisionResult: decisionRaw as unknown as DecisionIntelligenceResultLight | undefined,
          predictiveResult: predictiveRaw as unknown as ExecutivePredictiveResultLight | undefined,
          autonomousResult: autonomousRaw as unknown as AutonomousResultLight | undefined,
          copilotResult: copilotRaw as unknown as CopilotResultLight | undefined,
        });

        context.set("executiveCommandCenter", result);
        context.set("executive-command-center", result);
        return createModuleResult({
          moduleId: "executive-command-center",
          context,
          startedAt,
          ok: true,
          data: result,
        });
      } catch (error) {
        return createModuleResult({
          moduleId: "executive-command-center",
          context,
          startedAt,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  };
}
