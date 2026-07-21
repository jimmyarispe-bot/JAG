/**
 * Intelligence Platform Infrastructure - Organizational Digital Twin (Sprint 071).
 *
 * Strategic sandbox after portfolio-intelligence. Soft-reads portfolio + initiative lights.
 * Distinct from frozen OIOS foundation OrganizationalDigitalTwin.
 */

import {
  createDigitalTwin,
  DIGITAL_TWIN_VERSION,
  type BriefingResultLight,
  type CreateDigitalTwinOptions,
  type DigitalTwinStack,
  type ExecutivePredictiveResultLight,
  type InitiativeResultLight,
  type PortfolioResultLight,
} from "@/lib/platform/intelligence/digital-twin";
import {
  createExecutiveCommandCenter,
  type CommandCenterResult,
  type CommandCenterRole,
  type InitiativeResultLight as EccInitiativeLight,
  type PortfolioResultLight as EccPortfolioLight,
} from "@/lib/platform/intelligence/executive-command-center";
import type {
  IntelligenceExecutionContext,
  IntelligenceModule,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import { createModuleResult } from "@/lib/platform/intelligence/infrastructure/module-result";

export function createDigitalTwinModule(
  options: CreateDigitalTwinOptions = {},
  stack?: DigitalTwinStack
): IntelligenceModule {
  const twin =
    stack ??
    createDigitalTwin({
      ...options,
    });

  return {
    id: "digital-twin",
    name: "Organizational Digital Twin",
    version: DIGITAL_TWIN_VERSION,
    dependencies: ["portfolio-intelligence"],
    capabilities: [
      { key: "dt.live_model", description: "Live organizational model from soft-reads" },
      { key: "dt.simulation", description: "Isolated scenario simulation sandbox" },
      { key: "dt.impact", description: "Cross-domain impact analysis" },
      { key: "dt.constraints", description: "Constraint modeling with explainability" },
      { key: "dt.compare", description: "Multi-scenario comparative analysis" },
      { key: "dt.advisory", description: "Advisory recommendations (no auto-execute)" },
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

        const portfolioRaw =
          context.get<Record<string, unknown>>("portfolio-intelligence") ??
          context.get<Record<string, unknown>>("portfolioIntelligence");
        const initiativeRaw =
          context.get<Record<string, unknown>>("initiative-intelligence") ??
          context.get<Record<string, unknown>>("initiativeIntelligence");
        const predictiveRaw =
          context.get<Record<string, unknown>>("executive-predictive") ??
          context.get<Record<string, unknown>>("executivePredictive");
        const briefingRaw = context.get<Record<string, unknown>>("briefing");
        const memoryRaw =
          context.get<Record<string, unknown>>("executive-memory") ??
          context.get<Record<string, unknown>>("executiveMemory");
        const decisionRaw =
          context.get<Record<string, unknown>>("decision-intelligence") ??
          context.get<Record<string, unknown>>("decisionIntelligence");
        const autonomousRaw =
          context.get<Record<string, unknown>>("executive-autonomous") ??
          context.get<Record<string, unknown>>("executiveAutonomous");
        const copilotRaw =
          context.get<Record<string, unknown>>("executive-copilot") ??
          context.get<Record<string, unknown>>("executiveCopilot");
        const eccRaw =
          context.get<Record<string, unknown>>("executive-command-center") ??
          context.get<Record<string, unknown>>("executiveCommandCenter");

        const result = twin.service.build({
          requestId: context.runId,
          scope: {
            organizationId: context.scope.organizationId ?? null,
            schoolId: context.scope.schoolId ?? null,
          },
          periodLabel: input?.periodLabel,
          portfolioResult: portfolioRaw as unknown as PortfolioResultLight | undefined,
          initiativeResult: initiativeRaw as unknown as InitiativeResultLight | undefined,
          predictiveResult: predictiveRaw as unknown as ExecutivePredictiveResultLight | undefined,
          briefingResult: briefingRaw as unknown as BriefingResultLight | undefined,
        });

        context.set("digitalTwin", result);
        context.set("digital-twin", result);

        const role =
          input?.role ??
          ((eccRaw as CommandCenterResult | undefined)?.role as CommandCenterRole | undefined) ??
          "ceo";
        const eccStack = createExecutiveCommandCenter();
        const enrichedEcc = eccStack.service.build({
          requestId: `${context.runId}-ecc-twin`,
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
          initiativeResult: initiativeRaw as unknown as EccInitiativeLight | undefined,
          portfolioResult: portfolioRaw as unknown as EccPortfolioLight | undefined,
          digitalTwinResult: {
            simulations: result.simulations.map((s) => ({
              id: s.id,
              scenarioId: s.scenarioId,
              valid: s.valid,
              confidence: s.confidence,
              invalidReasons: s.invalidReasons,
            })),
            scenarios: result.scenarios.map((s) => ({
              id: s.id,
              kind: s.kind,
              label: s.label,
            })),
            comparisons: result.comparisons.map((c) => ({
              highlight: c.highlight,
              scenarioIds: c.scenarioIds,
            })),
            recommendation: {
              preferredScenarioId: result.recommendation.preferredScenarioId,
              tradeOffs: result.recommendation.tradeOffs,
              majorRisks: result.recommendation.majorRisks,
              mayAutoExecute: false,
            },
            explainability: {
              executiveSummary: result.explainability.executiveSummary,
              confidence: result.explainability.confidence,
            },
            contributingDomains: result.contributingDomains,
          },
        });
        context.set("executiveCommandCenter", enrichedEcc);
        context.set("executive-command-center", enrichedEcc);

        return createModuleResult({
          moduleId: "digital-twin",
          context,
          startedAt,
          ok: true,
          data: result,
        });
      } catch (error) {
        return createModuleResult({
          moduleId: "digital-twin",
          context,
          startedAt,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  };
}
