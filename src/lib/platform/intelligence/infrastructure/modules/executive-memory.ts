/**
 * Intelligence Platform Infrastructure - Executive Memory module adapter (Sprint 063).
 *
 * Wraps createExecutiveMemoryIntelligence — memory layer after briefing.
 * Soft-reads briefing lights. Does not modify briefing/ or prior packages.
 * Distinct from Sprint 009 `intelligence/memory` persistent store.
 */

import {
  createExecutiveMemoryIntelligence,
  EXECUTIVE_MEMORY_VERSION,
  type CreateExecutiveMemoryOptions,
  type ExecutiveMemoryStack,
  type BriefingResultLight,
} from "@/lib/platform/intelligence/executive-memory";
import type {
  IntelligenceExecutionContext,
  IntelligenceModule,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import { createModuleResult } from "@/lib/platform/intelligence/infrastructure/module-result";

export function createExecutiveMemoryModule(
  options: CreateExecutiveMemoryOptions = {},
  stack?: ExecutiveMemoryStack
): IntelligenceModule {
  const memory =
    stack ??
    createExecutiveMemoryIntelligence({
      ...options,
    });

  return {
    id: "executive-memory",
    name: "Executive Memory Intelligence",
    version: EXECUTIVE_MEMORY_VERSION,
    dependencies: ["briefing"],
    capabilities: [
      { key: "executive-memory.decisions", description: "Decision memory persistence and recall" },
      { key: "executive-memory.briefs", description: "Executive brief archive" },
      { key: "executive-memory.timeline", description: "Organizational reasoning timeline" },
      { key: "executive-memory.graph", description: "Entity relationship graph" },
      { key: "executive-memory.retrieval", description: "Structured evidence / recall APIs" },
      { key: "executive-memory.lessons", description: "Lessons-learned framework" },
      { key: "executive-memory.retention", description: "Configurable retention policies" },
    ],
    async execute(context: IntelligenceExecutionContext) {
      const startedAt = new Date().toISOString();
      try {
        const input = context.input as
          | { periodLabel?: string; question?: string }
          | undefined;

        const briefingRaw = context.get<Record<string, unknown>>("briefing");
        const briefingResult = toBriefingLight(briefingRaw);

        const result = memory.service.build({
          requestId: context.runId,
          scope: {
            organizationId: context.scope.organizationId ?? null,
            schoolId: context.scope.schoolId ?? null,
          },
          briefingResult,
          periodLabel: input?.periodLabel,
          metadata: {
            question: input?.question,
          },
        });

        context.set("executiveMemory", result);
        context.set("executive-memory", result);
        return createModuleResult({
          moduleId: "executive-memory",
          context,
          startedAt,
          ok: true,
          data: result,
        });
      } catch (error) {
        return createModuleResult({
          moduleId: "executive-memory",
          context,
          startedAt,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  };
}

function toBriefingLight(
  raw: Record<string, unknown> | undefined
): BriefingResultLight | undefined {
  if (!raw) return undefined;
  return raw as unknown as BriefingResultLight;
}
