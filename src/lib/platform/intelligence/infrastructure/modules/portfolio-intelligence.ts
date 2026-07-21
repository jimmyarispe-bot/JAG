/**
 * Intelligence Platform Infrastructure - Portfolio Intelligence module (Sprint 070).
 *
 * Portfolio layer after initiative-intelligence. Soft-reads initiative + executive lights.
 * Distinct from frozen innovation-portfolio-intelligence.
 */

import {
  createPortfolioIntelligence,
  PORTFOLIO_INTELLIGENCE_VERSION,
  type AutonomousResultLight,
  type BriefingResultLight,
  type CreatePortfolioIntelligenceOptions,
  type DecisionIntelligenceResultLight,
  type ExecutivePredictiveResultLight,
  type InitiativeResultLight,
  type PortfolioIntelligenceStack,
} from "@/lib/platform/intelligence/portfolio-intelligence";
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

export function createPortfolioIntelligenceModule(
  options: CreatePortfolioIntelligenceOptions = {},
  stack?: PortfolioIntelligenceStack
): IntelligenceModule {
  const portfolio =
    stack ??
    createPortfolioIntelligence({
      ...options,
    });

  return {
    id: "portfolio-intelligence",
    name: "Portfolio Intelligence",
    version: PORTFOLIO_INTELLIGENCE_VERSION,
    dependencies: ["initiative-intelligence"],
    capabilities: [
      { key: "pi.registry", description: "Enterprise portfolio registry" },
      { key: "pi.prioritization", description: "Composite initiative prioritization" },
      { key: "pi.capacity", description: "Capacity planning & bottlenecks" },
      { key: "pi.allocation", description: "Advisory resource allocation" },
      { key: "pi.health", description: "Portfolio health & analytics" },
      { key: "pi.scenarios", description: "Scenario planning (advisory)" },
    ],
    async execute(context: IntelligenceExecutionContext) {
      const startedAt = new Date().toISOString();
      try {
        const input = context.input as
          | {
              periodLabel?: string;
              role?: CommandCenterRole;
              missionHint?: string;
              visionHint?: string;
            }
          | undefined;

        const initiativeRaw =
          context.get<Record<string, unknown>>("initiative-intelligence") ??
          context.get<Record<string, unknown>>("initiativeIntelligence");
        const briefingRaw = context.get<Record<string, unknown>>("briefing");
        const decisionRaw =
          context.get<Record<string, unknown>>("decision-intelligence") ??
          context.get<Record<string, unknown>>("decisionIntelligence");
        const predictiveRaw =
          context.get<Record<string, unknown>>("executive-predictive") ??
          context.get<Record<string, unknown>>("executivePredictive");
        const autonomousRaw =
          context.get<Record<string, unknown>>("executive-autonomous") ??
          context.get<Record<string, unknown>>("executiveAutonomous");
        const memoryRaw =
          context.get<Record<string, unknown>>("executive-memory") ??
          context.get<Record<string, unknown>>("executiveMemory");
        const copilotRaw =
          context.get<Record<string, unknown>>("executive-copilot") ??
          context.get<Record<string, unknown>>("executiveCopilot");
        const eccRaw =
          context.get<Record<string, unknown>>("executive-command-center") ??
          context.get<Record<string, unknown>>("executiveCommandCenter");

        const result = portfolio.service.build({
          requestId: context.runId,
          scope: {
            organizationId: context.scope.organizationId ?? null,
            schoolId: context.scope.schoolId ?? null,
          },
          periodLabel: input?.periodLabel,
          missionHint: input?.missionHint,
          visionHint: input?.visionHint,
          initiativeResult: initiativeRaw as unknown as InitiativeResultLight | undefined,
          briefingResult: briefingRaw as unknown as BriefingResultLight | undefined,
          decisionResult: decisionRaw as unknown as DecisionIntelligenceResultLight | undefined,
          predictiveResult: predictiveRaw as unknown as ExecutivePredictiveResultLight | undefined,
          autonomousResult: autonomousRaw as unknown as AutonomousResultLight | undefined,
        });

        context.set("portfolioIntelligence", result);
        context.set("portfolio-intelligence", result);

        // Enrich ECC with portfolio widgets (same pipeline pass).
        const role =
          input?.role ??
          ((eccRaw as CommandCenterResult | undefined)?.role as CommandCenterRole | undefined) ??
          "ceo";
        const initiativeLight = initiativeRaw as InitiativeResultLight | undefined;
        const eccStack = createExecutiveCommandCenter();
        const enrichedEcc = eccStack.service.build({
          requestId: `${context.runId}-ecc-portfolio`,
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
          initiativeResult: initiativeLight
            ? {
                initiatives: initiativeLight.initiatives,
                activeCount: initiativeLight.activeCount,
                atRiskCount: initiativeLight.atRiskCount,
                completedCount: initiativeLight.completedCount,
                portfolioHealth: initiativeLight.portfolioHealth,
                contributingDomains: initiativeLight.contributingDomains,
              }
            : undefined,
          portfolioResult: {
            health: result.health,
            prioritization: result.prioritization.slice(0, 8).map((p) => ({
              initiativeId: p.initiativeId,
              title: p.title,
              composite: p.composite,
              rank: p.rank,
              alignment: p.alignment,
              risk: p.risk,
            })),
            capacity: result.capacity,
            allocations: result.allocations.slice(0, 8).map((a) => ({
              initiativeId: a.initiativeId,
              title: a.title,
              budgetShare: a.budgetShare,
            })),
            dependencies: result.dependencies.slice(0, 8).map((d) => ({
              id: d.id,
              kind: d.kind,
              label: d.label,
              severity: d.severity,
              fromInitiativeId: d.fromInitiativeId,
              toInitiativeId: d.toInitiativeId,
            })),
            optimizations: result.optimizations.slice(0, 6).map((o) => ({
              id: o.id,
              kind: o.kind,
              title: o.title,
              summary: o.summary,
              expectedImpact: o.expectedImpact,
            })),
            analytics: result.analytics,
            contributingDomains: result.contributingDomains,
          },
        });
        context.set("executiveCommandCenter", enrichedEcc);
        context.set("executive-command-center", enrichedEcc);

        return createModuleResult({
          moduleId: "portfolio-intelligence",
          context,
          startedAt,
          ok: true,
          data: result,
        });
      } catch (error) {
        return createModuleResult({
          moduleId: "portfolio-intelligence",
          context,
          startedAt,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  };
}
