/**
 * Intelligence Platform Infrastructure - Executive Briefing module adapter (Sprint 062).
 *
 * Wraps createBriefingIntelligence — presentation/reasoning surface after synthesis.
 * Soft-reads synthesis lights. Executive Memory (063) hard-depends on this module.
 */

import {
  createBriefingIntelligence,
  BRIEFING_INTELLIGENCE_VERSION,
  type CreateBriefingOptions,
  type BriefingStack,
  type SynthesisResultLight,
  type BriefingRole,
} from "@/lib/platform/intelligence/briefing";
import type {
  IntelligenceExecutionContext,
  IntelligenceModule,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import { createModuleResult } from "@/lib/platform/intelligence/infrastructure/module-result";

export function createBriefingModule(
  options: CreateBriefingOptions = {},
  stack?: BriefingStack
): IntelligenceModule {
  const briefing =
    stack ??
    createBriefingIntelligence({
      ...options,
    });

  return {
    id: "briefing",
    name: "Executive Briefing Intelligence",
    version: BRIEFING_INTELLIGENCE_VERSION,
    dependencies: ["synthesis"],
    capabilities: [
      { key: "briefing.morning", description: "Executive morning brief generation" },
      { key: "briefing.overnight", description: "Overnight intelligence summaries" },
      { key: "briefing.decisions", description: "Decision queue with explainability" },
      { key: "briefing.opportunities", description: "Opportunity queue" },
      { key: "briefing.timeline", description: "Executive timeline windows" },
      { key: "briefing.personalization", description: "Role-based briefing personalization" },
      { key: "briefing.actions", description: "Actionable card contracts for UX-003/004" },
    ],
    async execute(context: IntelligenceExecutionContext) {
      const startedAt = new Date().toISOString();
      try {
        const input = context.input as
          | {
              question?: string;
              periodLabel?: string;
              role?: BriefingRole;
              greetingName?: string;
            }
          | undefined;

        const synthesisRaw = context.get<Record<string, unknown>>("synthesis");
        const synthesisResult = toSynthesisLight(synthesisRaw);

        const result = briefing.service.build({
          requestId: context.runId,
          scope: {
            organizationId: context.scope.organizationId ?? null,
            schoolId: context.scope.schoolId ?? null,
          },
          synthesisResult,
          role: input?.role ?? "executive",
          greetingName: input?.greetingName,
          periodLabel: input?.periodLabel,
          metadata: {
            question: input?.question,
          },
        });

        context.set("briefing", result);
        return createModuleResult({
          moduleId: "briefing",
          context,
          startedAt,
          ok: true,
          data: result,
        });
      } catch (error) {
        return createModuleResult({
          moduleId: "briefing",
          context,
          startedAt,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  };
}

function toSynthesisLight(
  raw: Record<string, unknown> | undefined
): SynthesisResultLight | undefined {
  if (!raw) return undefined;
  return raw as unknown as SynthesisResultLight;
}
