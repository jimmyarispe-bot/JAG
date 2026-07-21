/**
 * Intelligence Platform Infrastructure - Initiative Intelligence module (Sprint 069).
 *
 * Execution layer after executive-command-center. Soft-reads prior executive-stack lights.
 * Distinct from frozen strategic / execution / board initiative helpers.
 */

import {
  createInitiativeIntelligence,
  INITIATIVE_INTELLIGENCE_VERSION,
  type AutonomousResultLight,
  type BriefingResultLight,
  type CommandCenterResultLight,
  type CopilotResultLight,
  type CreateInitiativeIntelligenceOptions,
  type DecisionIntelligenceResultLight,
  type ExecutiveMemoryResultLight,
  type ExecutivePredictiveResultLight,
  type InitiativeIntelligenceStack,
} from "@/lib/platform/intelligence/initiative-intelligence";
import {
  createExecutiveCommandCenter,
  type CommandCenterResult,
  type CommandCenterRole,
} from "@/lib/platform/intelligence/executive-command-center";
import type {
  IntelligenceExecutionContext,
  IntelligenceModule,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import { createModuleResult } from "@/lib/platform/intelligence/infrastructure/module-result";

export function createInitiativeIntelligenceModule(
  options: CreateInitiativeIntelligenceOptions = {},
  stack?: InitiativeIntelligenceStack
): IntelligenceModule {
  const initiative =
    stack ??
    createInitiativeIntelligence({
      ...options,
    });

  return {
    id: "initiative-intelligence",
    name: "Initiative Intelligence",
    version: INITIATIVE_INTELLIGENCE_VERSION,
    dependencies: ["executive-command-center"],
    capabilities: [
      { key: "ii.lifecycle", description: "Initiative lifecycle with attributable transitions" },
      { key: "ii.milestones", description: "Milestones, tasks, nested work breakdown" },
      { key: "ii.kpis", description: "Measurable KPIs and outcome criteria" },
      { key: "ii.budget", description: "Budget / resource tracking (soft FI consume)" },
      { key: "ii.progress", description: "Progress, health, risk, and blocker intelligence" },
      { key: "ii.graph", description: "Links to briefs, decisions, plans, memory, ECC" },
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
        const eccRaw =
          context.get<Record<string, unknown>>("executive-command-center") ??
          context.get<Record<string, unknown>>("executiveCommandCenter");

        const result = initiative.service.build({
          requestId: context.runId,
          scope: {
            organizationId: context.scope.organizationId ?? null,
            schoolId: context.scope.schoolId ?? null,
          },
          periodLabel: input?.periodLabel,
          briefingResult: briefingRaw as unknown as BriefingResultLight | undefined,
          decisionResult: decisionRaw as unknown as DecisionIntelligenceResultLight | undefined,
          predictiveResult: predictiveRaw as unknown as ExecutivePredictiveResultLight | undefined,
          autonomousResult: autonomousRaw as unknown as AutonomousResultLight | undefined,
          copilotResult: copilotRaw as unknown as CopilotResultLight | undefined,
          memoryResult: memoryRaw as unknown as ExecutiveMemoryResultLight | undefined,
          commandCenterResult: eccRaw as unknown as CommandCenterResultLight | undefined,
        });

        context.set("initiativeIntelligence", result);
        context.set("initiative-intelligence", result);

        // Enrich ECC workspace with initiative widgets (same pipeline pass).
        const role =
          input?.role ??
          ((eccRaw as CommandCenterResult | undefined)?.role as CommandCenterRole | undefined) ??
          "ceo";
        const eccStack = createExecutiveCommandCenter();
        const enrichedEcc = eccStack.service.build({
          requestId: `${context.runId}-ecc-enriched`,
          scope: {
            organizationId: context.scope.organizationId ?? null,
            schoolId: context.scope.schoolId ?? null,
          },
          role,
          periodLabel: input?.periodLabel,
          briefingResult: briefingRaw as never,
          memoryResult: memoryRaw as never,
          decisionResult: decisionRaw as never,
          predictiveResult: predictiveRaw as never,
          autonomousResult: autonomousRaw as never,
          copilotResult: copilotRaw as never,
          initiativeResult: {
            initiatives: result.initiatives.map((i) => ({
              id: i.id,
              title: i.title,
              state: i.state,
              executiveSummary: i.executiveSummary,
              progress: i.progress,
              budget: i.budget,
              milestones: i.milestones.map((m) => ({
                id: m.id,
                title: m.title,
                dueDate: m.dueDate,
                status: m.status,
                percentComplete: m.percentComplete,
              })),
              targetCompletionDate: i.targetCompletionDate,
            })),
            activeCount: result.activeCount,
            atRiskCount: result.atRiskCount,
            completedCount: result.completedCount,
            portfolioHealth: result.portfolioHealth,
            contributingDomains: result.contributingDomains,
          },
        });
        context.set("executiveCommandCenter", enrichedEcc);
        context.set("executive-command-center", enrichedEcc);

        return createModuleResult({
          moduleId: "initiative-intelligence",
          context,
          startedAt,
          ok: true,
          data: result,
        });
      } catch (error) {
        return createModuleResult({
          moduleId: "initiative-intelligence",
          context,
          startedAt,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  };
}
