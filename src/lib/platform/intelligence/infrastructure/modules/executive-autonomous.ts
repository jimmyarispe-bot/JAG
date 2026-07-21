/**
 * Intelligence Platform Infrastructure - Autonomous Intelligence module adapter (Sprint 066).
 *
 * Prepares execution plans after executive-predictive.
 * Soft-reads decision-intelligence + executive-predictive lights.
 * Never auto-executes organizational actions.
 */

import {
  createExecutiveAutonomousIntelligence,
  EXECUTIVE_AUTONOMOUS_VERSION,
  type CreateExecutiveAutonomousOptions,
  type DecisionIntelligenceResultLight,
  type ExecutiveAutonomousStack,
  type ExecutivePredictiveResultLight,
} from "@/lib/platform/intelligence/executive-autonomous";
import type {
  IntelligenceExecutionContext,
  IntelligenceModule,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import { createModuleResult } from "@/lib/platform/intelligence/infrastructure/module-result";

export function createExecutiveAutonomousModule(
  options: CreateExecutiveAutonomousOptions = {},
  stack?: ExecutiveAutonomousStack
): IntelligenceModule {
  const autonomous =
    stack ??
    createExecutiveAutonomousIntelligence({
      ...options,
    });

  return {
    id: "executive-autonomous",
    name: "Autonomous Intelligence",
    version: EXECUTIVE_AUTONOMOUS_VERSION,
    dependencies: ["executive-predictive"],
    capabilities: [
      { key: "auto.plan", description: "Execution planning from recommendations" },
      { key: "auto.dependencies", description: "Prerequisite / dependency resolution" },
      { key: "auto.workflows", description: "Reusable workflow templates" },
      { key: "auto.approvals", description: "Policy-driven approval routing" },
      { key: "auto.rollback", description: "Rollback planning" },
      { key: "auto.readiness", description: "Readiness assessment" },
      { key: "auto.prepare", description: "Autonomous preparation packages" },
    ],
    async execute(context: IntelligenceExecutionContext) {
      const startedAt = new Date().toISOString();
      try {
        const input = context.input as
          | {
              periodLabel?: string;
              satisfiedPrerequisiteIds?: string[];
              approvedRoles?: string[];
            }
          | undefined;

        const decisionRaw =
          context.get<Record<string, unknown>>("decision-intelligence") ??
          context.get<Record<string, unknown>>("decisionIntelligence");
        const predictiveRaw =
          context.get<Record<string, unknown>>("executive-predictive") ??
          context.get<Record<string, unknown>>("executivePredictive");

        const result = autonomous.service.build({
          requestId: context.runId,
          scope: {
            organizationId: context.scope.organizationId ?? null,
            schoolId: context.scope.schoolId ?? null,
          },
          decisionResult: decisionRaw as unknown as DecisionIntelligenceResultLight | undefined,
          predictiveResult: predictiveRaw as unknown as ExecutivePredictiveResultLight | undefined,
          satisfiedPrerequisiteIds: input?.satisfiedPrerequisiteIds,
          approvedRoles: input?.approvedRoles as never,
          periodLabel: input?.periodLabel,
        });

        context.set("executiveAutonomous", result);
        context.set("executive-autonomous", result);
        return createModuleResult({
          moduleId: "executive-autonomous",
          context,
          startedAt,
          ok: true,
          data: result,
        });
      } catch (error) {
        return createModuleResult({
          moduleId: "executive-autonomous",
          context,
          startedAt,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  };
}
