/**
 * Ecosystem Federation orchestrator (Sprint 072).
 * Permission-aware federation — advisory only, no tenant leakage.
 *
 * Class name avoids Sprint 057 `EcosystemIntelligenceEngine` contract.
 */

import { AggregationEngine } from "@/lib/platform/intelligence/ecosystem-intelligence/engine/aggregation-engine";
import { FederationEngine } from "@/lib/platform/intelligence/ecosystem-intelligence/engine/federation-engine";
import { GovernanceEngine } from "@/lib/platform/intelligence/ecosystem-intelligence/engine/governance-engine";
import { RelationshipEngine } from "@/lib/platform/intelligence/ecosystem-intelligence/engine/relationship-engine";
import { createAdvisoryRecommendation } from "@/lib/platform/intelligence/ecosystem-intelligence/models/governance";
import { buildEcosystemFederationModel } from "@/lib/platform/intelligence/ecosystem-intelligence/models/ecosystem-model";
import type {
  EcosystemFederationRequest,
  EcosystemFederationResult,
} from "@/lib/platform/intelligence/ecosystem-intelligence/types";
import { ECOSYSTEM_FEDERATION_VERSION } from "@/lib/platform/intelligence/ecosystem-intelligence/types";

export interface EcosystemFederationEngineDeps {
  createId?: (prefix: string) => string;
  now?: () => Date;
}

export class EcosystemFederationEngine {
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;
  private readonly federation = new FederationEngine();
  private readonly governance = new GovernanceEngine();
  private readonly aggregation = new AggregationEngine();
  private readonly relationships: RelationshipEngine;

  constructor(deps: EcosystemFederationEngineDeps = {}) {
    let seq = 0;
    this.createId = deps.createId ?? ((p) => `${p}-${++seq}`);
    this.now = deps.now ?? (() => new Date());
    this.relationships = new RelationshipEngine(this.createId);
  }

  build(request: EcosystemFederationRequest): EcosystemFederationResult {
    const nowIso = this.now().toISOString();
    const prepared = this.federation.prepare(request);

    const model = buildEcosystemFederationModel({
      rootOrganizationId: request.scope.organizationId,
      members: prepared.members,
      permissions: prepared.permissions,
      portfolio: request.portfolioResult,
      initiatives: request.initiativeResult,
      briefing: request.briefingResult,
      createId: this.createId,
    });

    const projected = this.federation.project(
      model.summaries,
      prepared.permissions,
      nowIso
    );
    model.summaries = projected.summaries;

    const enrollmentByOrg = new Map<string, number>();
    for (const member of prepared.members) {
      enrollmentByOrg.set(member.organizationId, member.enrollmentIndex ?? 0);
    }
    const aggregated = this.aggregation.aggregate(
      model.summaries,
      model.graph.nodes,
      enrollmentByOrg
    );
    model.metrics = aggregated.metrics;
    model.geographicCoverage = aggregated.geographicCoverage;
    model.risks = this.relationships.deriveRisks(model.graph, model.summaries);
    model.opportunities = this.relationships.deriveOpportunities(
      model.graph,
      model.summaries
    );

    const auditLog = this.governance.evaluate({
      at: nowIso,
      members: [...prepared.members, ...prepared.excluded],
      permissions: prepared.permissions,
    });

    const topOpps = [...model.opportunities]
      .sort((a, b) => b.estimatedImpact - a.estimatedImpact)
      .slice(0, 3);
    const recommendation = createAdvisoryRecommendation(
      topOpps.map((o) => o.id),
      model.risks.slice(0, 3).map((r) => r.title),
      [
        "Federation visibility expands only with active sharing agreements.",
        "Aggregates hide raw tenant records by design.",
      ],
      [
        "Review highest-impact shared opportunities with partner executives.",
        "Confirm sharing agreements cover required summary kinds.",
        "Escalate critical cross-org risks to network governance.",
      ]
    );

    const contributing = new Set<string>([
      "ecosystem-intelligence",
      "digital-twin",
      "portfolio-intelligence",
    ]);
    for (const d of request.digitalTwinResult?.contributingDomains ?? [])
      contributing.add(d);
    for (const d of request.portfolioResult?.contributingDomains ?? [])
      contributing.add(d);
    for (const d of request.initiativeResult?.contributingDomains ?? [])
      contributing.add(d);
    for (const d of request.briefingResult?.contributingDomains ?? [])
      contributing.add(d);

    const confidence = this.confidence(model.summaries.length, prepared.excluded.length);

    return {
      requestId: request.requestId,
      version: ECOSYSTEM_FEDERATION_VERSION,
      scope: request.scope,
      generatedAt: nowIso,
      model,
      federation: {
        authorizedCount: model.summaries.length,
        excludedCount: prepared.excluded.length,
        agreementCount: prepared.agreements.filter((a) => a.active).length,
        summaries: model.summaries,
      },
      recommendation,
      explainability: {
        executiveSummary: this.summarize(model, prepared.excluded.length),
        assumptions: [
          "Only authorized federated summaries are included.",
          "Raw operational records remain inside owning tenants.",
          "Actor ecosystem role is required for cross-org visibility.",
        ],
        confidence,
        inputsUsed: [
          "federated_summaries",
          "sharing_agreements",
          "portfolio_light",
          "initiative_light",
          "digital_twin_light",
        ],
        domainsConsulted: [...contributing],
        constraintsEncountered: prepared.excluded.map(
          (m) => `Excluded organization ${m.organizationId} (tenant isolation)`
        ),
        uncertainties: [
          "Peer summaries may lag home-tenant intelligence freshness.",
          "Geographic coverage uses declared regions, not live GIS.",
        ],
        unauthorizedOrganizationsExcluded: prepared.excluded.map((m) => m.organizationId),
      },
      auditLog,
      contributingDomains: [...contributing],
    };
  }

  private confidence(authorized: number, excluded: number): number {
    if (authorized === 0) return 0.35;
    const ratio = authorized / (authorized + excluded || 1);
    return Math.min(0.92, 0.55 + ratio * 0.3 + Math.min(authorized, 5) * 0.02);
  }

  private summarize(
    model: EcosystemFederationResult["model"],
    excludedCount: number
  ): string {
    const orgs = model.summaries.length;
    const risks = model.risks.length;
    const opps = model.opportunities.length;
    const health =
      model.metrics.find((m) => m.key === "ecosystem_health")?.value ?? 0;
    return `Ecosystem view covers ${orgs} authorized organization(s) (avg health ${health.toFixed(0)}). ${risks} cross-org risk(s) and ${opps} shared opportunit${opps === 1 ? "y" : "ies"} identified. ${excludedCount} unauthorized peer(s) excluded.`;
  }
}
