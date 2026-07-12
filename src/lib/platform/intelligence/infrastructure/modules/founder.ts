/**
 * Intelligence Platform Infrastructure — Founder Intelligence module adapter (Sprint 027).
 *
 * Wraps existing founder brief generator — does not regenerate Founder Intelligence.
 */

import { generateFounderBrief } from "@/lib/platform/intelligence/founder/generator";
import type {
  IntelligenceExecutionContext,
  IntelligenceModule,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import { createModuleResult } from "@/lib/platform/intelligence/infrastructure/module-result";

export const FOUNDER_INTELLIGENCE_MODULE_VERSION = "0.1.0";

export function createFounderIntelligenceModule(): IntelligenceModule {
  return {
    id: "founder",
    name: "Founder Intelligence",
    version: FOUNDER_INTELLIGENCE_MODULE_VERSION,
    dependencies: ["organization-health", "financial"],
    capabilities: [
      { key: "founder.brief", description: "Founder executive brief generation" },
      { key: "founder.priorities", description: "Founder priority signals" },
    ],
    async execute(context: IntelligenceExecutionContext) {
      const startedAt = new Date().toISOString();
      try {
        const brief = await generateFounderBrief();
        const orgHealth = context.get("organizationHealth");
        const financial = context.get("financial");
        const data = {
          brief,
          organizationHealth: orgHealth ?? null,
          financial: financial ?? null,
        };
        context.set("founder", data);

        return createModuleResult({
          moduleId: "founder",
          context,
          startedAt,
          ok: true,
          data,
        });
      } catch (error) {
        return createModuleResult({
          moduleId: "founder",
          context,
          startedAt,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  };
}
