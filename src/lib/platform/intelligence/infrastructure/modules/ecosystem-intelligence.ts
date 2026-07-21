/**
 * Intelligence Platform Infrastructure — Ecosystem Intelligence (Sprint 072).
 *
 * Federated org network after digital-twin. Soft-reads twin + portfolio + initiative.
 * Distinct from Sprint 057 mid-pipeline `ecosystem` module.
 */

import {
  createEcosystemFederation,
  ECOSYSTEM_FEDERATION_VERSION,
  type BriefingResultLight,
  type CreateEcosystemFederationOptions,
  type DigitalTwinResultLight,
  type EcosystemFederationStack,
  type InitiativeResultLight,
  type PortfolioResultLight,
} from "@/lib/platform/intelligence/ecosystem-intelligence";
import {
  createExecutiveCommandCenter,
  type CommandCenterResult,
  type CommandCenterRole,
  type DigitalTwinResultLight as EccTwinLight,
  type InitiativeResultLight as EccInitiativeLight,
  type PortfolioResultLight as EccPortfolioLight,
} from "@/lib/platform/intelligence/executive-command-center";
import type {
  IntelligenceExecutionContext,
  IntelligenceModule,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import { createModuleResult } from "@/lib/platform/intelligence/infrastructure/module-result";

export function createEcosystemIntelligenceModule(
  options: CreateEcosystemFederationOptions = {},
  stack?: EcosystemFederationStack
): IntelligenceModule {
  const federation =
    stack ??
    createEcosystemFederation({
      ...options,
    });

  return {
    id: "ecosystem-intelligence",
    name: "Ecosystem Intelligence",
    version: ECOSYSTEM_FEDERATION_VERSION,
    dependencies: ["digital-twin"],
    capabilities: [
      { key: "ei.graph", description: "Ecosystem relationship graph" },
      { key: "ei.federation", description: "Permission-aware federated summaries" },
      { key: "ei.aggregation", description: "Cross-org analytics with contributors" },
      { key: "ei.risks", description: "Cross-organization risk detection" },
      { key: "ei.opportunities", description: "Shared opportunity recommendations" },
      { key: "ei.governance", description: "Tenant isolation + audit logging" },
    ],
    async execute(context: IntelligenceExecutionContext) {
      const startedAt = new Date().toISOString();
      try {
        const input = context.input as
          | {
              periodLabel?: string;
              role?: CommandCenterRole;
              ecosystemMembers?: unknown;
              ecosystemAgreements?: unknown;
              actorRoles?: string[];
            }
          | undefined;

        const twinRaw =
          context.get<Record<string, unknown>>("digital-twin") ??
          context.get<Record<string, unknown>>("digitalTwin");
        const portfolioRaw =
          context.get<Record<string, unknown>>("portfolio-intelligence") ??
          context.get<Record<string, unknown>>("portfolioIntelligence");
        const initiativeRaw =
          context.get<Record<string, unknown>>("initiative-intelligence") ??
          context.get<Record<string, unknown>>("initiativeIntelligence");
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

        const result = federation.service.build({
          requestId: context.runId,
          scope: {
            organizationId: context.scope.organizationId ?? null,
            schoolId: context.scope.schoolId ?? null,
            actorOrganizationId: context.scope.organizationId ?? null,
            actorRoles: input?.actorRoles ?? [input?.role ?? "ceo"],
          },
          periodLabel: input?.periodLabel,
          members: input?.ecosystemMembers as never,
          agreements: input?.ecosystemAgreements as never,
          digitalTwinResult: twinRaw as unknown as DigitalTwinResultLight | undefined,
          portfolioResult: portfolioRaw as unknown as PortfolioResultLight | undefined,
          initiativeResult: initiativeRaw as unknown as InitiativeResultLight | undefined,
          briefingResult: briefingRaw as unknown as BriefingResultLight | undefined,
        });

        context.set("ecosystemIntelligence", result);
        context.set("ecosystem-intelligence", result);

        const role =
          input?.role ??
          ((eccRaw as CommandCenterResult | undefined)?.role as CommandCenterRole | undefined) ??
          "ceo";
        const eccStack = createExecutiveCommandCenter();
        const enrichedEcc = eccStack.service.build({
          requestId: `${context.runId}-ecc-ecosystem`,
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
          digitalTwinResult: twinRaw as unknown as EccTwinLight | undefined,
          ecosystemIntelligenceResult: {
            federation: {
              authorizedCount: result.federation.authorizedCount,
              excludedCount: result.federation.excludedCount,
            },
            metrics: result.model.metrics.map((m) => ({
              key: m.key,
              label: m.label,
              value: m.value,
              contributingOrganizationIds: m.contributingOrganizationIds,
            })),
            risks: result.model.risks.map((r) => ({
              id: r.id,
              kind: r.kind,
              severity: r.severity,
              title: r.title,
              organizationIds: r.organizationIds,
            })),
            opportunities: result.model.opportunities.map((o) => ({
              id: o.id,
              kind: o.kind,
              title: o.title,
              estimatedImpact: o.estimatedImpact,
              organizationIds: o.organizationIds,
            })),
            geographicCoverage: result.model.geographicCoverage,
            graph: {
              nodeCount: result.model.graph.nodes.length,
              relationshipCount: result.model.graph.relationships.length,
              nodes: result.model.graph.nodes.map((n) => ({
                organizationId: n.organizationId,
                displayName: n.displayName,
                kind: n.kind,
              })),
            },
            recommendation: {
              preferredOpportunityIds: result.recommendation.preferredOpportunityIds,
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
          moduleId: "ecosystem-intelligence",
          context,
          startedAt,
          ok: true,
          data: result,
        });
      } catch (error) {
        return createModuleResult({
          moduleId: "ecosystem-intelligence",
          context,
          startedAt,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  };
}
