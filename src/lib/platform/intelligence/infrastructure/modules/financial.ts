/**
 * Intelligence Platform Infrastructure — Financial Intelligence module adapter (Sprint 027).
 *
 * Wraps existing financial-intelligence helpers — does not regenerate them.
 */

import { healthFromMargin } from "@/lib/financial-intelligence/types";
import type {
  IntelligenceExecutionContext,
  IntelligenceModule,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import { createModuleResult } from "@/lib/platform/intelligence/infrastructure/module-result";

export const FINANCIAL_INTELLIGENCE_MODULE_VERSION = "0.1.0";

export function createFinancialIntelligenceModule(): IntelligenceModule {
  return {
    id: "financial",
    name: "Financial Intelligence",
    version: FINANCIAL_INTELLIGENCE_MODULE_VERSION,
    dependencies: ["organization-health"],
    capabilities: [
      { key: "finance.margin-health", description: "Margin health indicator" },
      { key: "finance.snapshot", description: "Financial snapshot projection" },
    ],
    async execute(context: IntelligenceExecutionContext) {
      const startedAt = new Date().toISOString();
      try {
        const orgHealth = context.get<{
          financial?: { revenue?: number; expenses?: number; score?: number };
          overallScore?: number;
        }>("organizationHealth");

        const revenue = Number(orgHealth?.financial?.revenue ?? 0);
        const expenses = Number(orgHealth?.financial?.expenses ?? 0);
        const marginPct =
          revenue === 0 ? 0 : ((revenue - expenses) / Math.max(revenue, 1)) * 100;
        const healthIndicator = healthFromMargin(marginPct);
        const score = Number(
          orgHealth?.financial?.score ?? orgHealth?.overallScore ?? 0
        );

        const data = {
          revenue,
          expenses,
          marginPct,
          healthIndicator,
          score,
          source: "organization-health",
        };
        context.set("financial", data);

        return createModuleResult({
          moduleId: "financial",
          context,
          startedAt,
          ok: true,
          data,
        });
      } catch (error) {
        return createModuleResult({
          moduleId: "financial",
          context,
          startedAt,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  };
}
