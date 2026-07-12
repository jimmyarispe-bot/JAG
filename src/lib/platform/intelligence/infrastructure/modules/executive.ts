/**
 * Intelligence Platform Infrastructure — Executive Intelligence module adapter (Sprint 027).
 *
 * Wraps existing executive domain resolver — does not regenerate it.
 */

import {
  createExecutiveIntelligenceDomain,
  EXECUTIVE_INTELLIGENCE_VERSION,
} from "@/lib/platform/intelligence/domains/executive";
import type {
  IntelligenceExecutionContext,
  IntelligenceModule,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import { createModuleResult } from "@/lib/platform/intelligence/infrastructure/module-result";

export function createExecutiveIntelligenceModule(): IntelligenceModule {
  const resolver = createExecutiveIntelligenceDomain();

  return {
    id: "executive",
    name: "Executive Intelligence",
    version: EXECUTIVE_INTELLIGENCE_VERSION,
    dependencies: ["organization-health", "financial", "founder"],
    capabilities: [
      { key: "executive.analyze", description: "Executive request analysis" },
      { key: "executive.briefing", description: "Executive briefing projection" },
    ],
    async execute(context: IntelligenceExecutionContext) {
      const startedAt = new Date().toISOString();
      try {
        const subject =
          typeof context.input === "object" &&
          context.input !== null &&
          "subject" in context.input &&
          typeof (context.input as { subject?: unknown }).subject === "string"
            ? (context.input as { subject: string }).subject
            : "Executive platform health review";

        const analysis = resolver.analyze({
          requestId: context.runId,
          subject,
          description: "Sprint 027 platform infrastructure execution",
          workspace: context.scope.workspaceId ?? undefined,
          metadata: {
            organizationHealth: context.get("organizationHealth"),
            financial: context.get("financial"),
            founder: context.get("founder"),
          },
        });

        context.set("executive", analysis);

        return createModuleResult({
          moduleId: "executive",
          context,
          startedAt,
          ok: true,
          data: analysis,
        });
      } catch (error) {
        return createModuleResult({
          moduleId: "executive",
          context,
          startedAt,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  };
}
