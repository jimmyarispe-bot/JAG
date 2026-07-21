/** Ecosystem Intelligence unit tests (Sprint 072 / 0.1.0). */
import { beforeEach, describe, expect, it } from "vitest";
import {
  createEcosystemFederation,
  ECOSYSTEM_FEDERATION_VERSION,
  ECOSYSTEM_INTELLIGENCE_MODULE_ID,
  resolveVisibleOrganizations,
  buildEcosystemFederationModel,
  type EcosystemMemberInput,
  type SharingAgreement,
  type PortfolioResultLight,
} from "@/lib/platform/intelligence/ecosystem-intelligence";
import { createExecutiveCommandCenter } from "@/lib/platform/intelligence/executive-command-center";
import { createIntelligenceService } from "@/lib/platform/intelligence";
import {
  createIntelligencePlatform,
  resetPlatformIdSeqForTests,
} from "@/lib/platform/intelligence/infrastructure";

const PIPELINE_ORDER = [
  "organization-dna", "oios-core", "organization-health", "financial", "founder",
  "executive", "executive-graph", "executive-decision", "predictive", "board-governance",
  "human-capital", "revenue", "funding", "opportunity", "organizational-improvement",
  "business-model", "operations", "customer", "knowledge", "document",
  "legal-compliance-risk", "market", "innovation", "impact", "economic", "competitive",
  "political", "environmental", "stakeholder", "reputation", "behavioral", "cultural",
  "ethical", "systems", "resilience", "ecosystem", "institutional-memory", "collective",
  "wisdom", "synthesis", "briefing", "executive-memory", "decision-intelligence",
  "executive-predictive", "executive-autonomous", "executive-copilot",
  "executive-command-center", "initiative-intelligence", "portfolio-intelligence",
  "digital-twin", "ecosystem-intelligence",
];

const ALL_SUMMARIES = [
  "health",
  "portfolio",
  "initiative",
  "financial",
  "risk",
  "kpi",
] as const;

function sampleMembers(): EcosystemMemberInput[] {
  return [
    {
      organizationId: "org-1",
      displayName: "Primary Academy",
      kind: "organization",
      region: "northeast",
      authorized: true,
      healthValue: 68,
      enrollmentIndex: 120,
      relationships: [
        {
          toOrganizationId: "org-2",
          kind: "strategic_partnership",
          label: "Network partner",
          strength: 0.8,
        },
        { toOrganizationId: "vendor-1", kind: "vendor", strength: 0.7 },
      ],
    },
    {
      organizationId: "org-2",
      displayName: "Partner Foundation",
      kind: "foundation",
      region: "northeast",
      authorized: true,
      sharingAgreementId: "agree-2",
      healthValue: 72,
      enrollmentIndex: 40,
      riskIndex: 75,
      relationships: [
        { toOrganizationId: "vendor-1", kind: "vendor", strength: 0.6 },
      ],
    },
    {
      organizationId: "vendor-1",
      displayName: "Shared SIS Vendor",
      kind: "vendor",
      region: "northeast",
      authorized: true,
      sharingAgreementId: "agree-v",
      healthValue: 60,
      enrollmentIndex: 0,
    },
    {
      organizationId: "org-secret",
      displayName: "Unauthorized Peer",
      kind: "organization",
      region: "west",
      authorized: true,
      healthValue: 90,
      enrollmentIndex: 999,
    },
  ];
}

function sampleAgreements(): SharingAgreement[] {
  return [
    {
      id: "agree-2",
      fromOrganizationId: "org-1",
      toOrganizationId: "org-2",
      allowedSummaries: [...ALL_SUMMARIES],
      active: true,
      audited: true,
    },
    {
      id: "agree-v",
      fromOrganizationId: "org-1",
      toOrganizationId: "vendor-1",
      allowedSummaries: [...ALL_SUMMARIES],
      active: true,
      audited: true,
    },
  ];
}

function samplePortfolio(): PortfolioResultLight {
  return {
    contributingDomains: ["portfolio-intelligence"],
    health: { value: 62, state: "watch", riskIndex: 45 },
    analytics: { portfolioValue: 250_000 },
  };
}

describe("Ecosystem Intelligence (Sprint 072)", () => {
  beforeEach(() => {
    resetPlatformIdSeqForTests();
  });

  it("exports Sprint 072 version and module id", () => {
    expect(ECOSYSTEM_FEDERATION_VERSION).toBe("0.1.0");
    expect(ECOSYSTEM_INTELLIGENCE_MODULE_ID).toBe("ecosystem-intelligence");
  });

  it("builds an ecosystem graph from authorized members only", () => {
    const permissions = resolveVisibleOrganizations({
      scope: {
        organizationId: "org-1",
        schoolId: null,
        actorOrganizationId: "org-1",
        actorRoles: ["ceo"],
      },
      members: sampleMembers(),
      agreements: sampleAgreements(),
    });
    expect(permissions.visibleOrganizationIds).toContain("org-1");
    expect(permissions.visibleOrganizationIds).toContain("org-2");
    expect(permissions.visibleOrganizationIds).not.toContain("org-secret");

    const model = buildEcosystemFederationModel({
      rootOrganizationId: "org-1",
      members: sampleMembers().filter((m) =>
        permissions.visibleOrganizationIds.includes(m.organizationId)
      ),
      permissions,
      portfolio: samplePortfolio(),
      createId: (p) => `${p}-x`,
    });
    expect(model.graph.nodes.length).toBe(3);
    expect(model.graph.relationships.length).toBeGreaterThan(0);
    expect(model.summaries.every((s) => s.organizationId !== "org-secret")).toBe(true);
  });

  it("enforces tenant isolation for unauthorized organizations", () => {
    const { service } = createEcosystemFederation({
      createId: (p) => `${p}-x`,
      now: () => new Date("2026-07-19T12:00:00.000Z"),
    });
    const result = service.build({
      requestId: "eco-1",
      scope: {
        organizationId: "org-1",
        schoolId: null,
        actorOrganizationId: "org-1",
        actorRoles: ["ceo"],
      },
      members: sampleMembers(),
      agreements: sampleAgreements(),
      portfolioResult: samplePortfolio(),
    });
    expect(result.federation.authorizedCount).toBe(3);
    expect(result.federation.excludedCount).toBe(1);
    expect(result.explainability.unauthorizedOrganizationsExcluded).toContain("org-secret");
    expect(result.model.summaries.map((s) => s.organizationId)).not.toContain("org-secret");
    const enrollment = result.model.metrics.find((m) => m.key === "total_enrollment_index");
    expect(enrollment?.value).toBe(160);
    expect(enrollment?.contributingOrganizationIds).not.toContain("org-secret");
  });

  it("blocks federation without ecosystem-capable roles", () => {
    const permissions = resolveVisibleOrganizations({
      scope: {
        organizationId: "org-1",
        schoolId: null,
        actorOrganizationId: "org-1",
        actorRoles: ["teacher"],
      },
      members: sampleMembers(),
      agreements: sampleAgreements(),
    });
    expect(permissions.visibleOrganizationIds).toEqual(["org-1"]);
  });

  it("aggregates cross-org metrics with contributor lists", () => {
    const { service } = createEcosystemFederation({
      createId: (p) => `${p}-x`,
      now: () => new Date("2026-07-19T12:00:00.000Z"),
    });
    const result = service.build({
      requestId: "eco-2",
      scope: {
        organizationId: "org-1",
        schoolId: null,
        actorRoles: ["ceo"],
      },
      members: sampleMembers(),
      agreements: sampleAgreements(),
      portfolioResult: samplePortfolio(),
    });
    for (const metric of result.model.metrics) {
      expect(Array.isArray(metric.contributingOrganizationIds)).toBe(true);
    }
    expect(result.model.risks.some((r) => r.kind === "shared_vendor")).toBe(true);
    expect(result.model.opportunities.length).toBeGreaterThan(0);
    expect(result.model.geographicCoverage.some((g) => g.region === "northeast")).toBe(true);
  });

  it("keeps recommendations advisory under Sprint 066 governance", () => {
    const { service } = createEcosystemFederation({
      createId: (p) => `${p}-x`,
      now: () => new Date("2026-07-19T12:00:00.000Z"),
    });
    const result = service.build({
      requestId: "eco-3",
      scope: { organizationId: "org-1", schoolId: null, actorRoles: ["ceo"] },
      members: sampleMembers(),
      agreements: sampleAgreements(),
    });
    expect(result.recommendation.advisoryOnly).toBe(true);
    expect(result.recommendation.mayAutoExecute).toBe(false);
    expect(result.recommendation.humanAuthorizationRequired).toBe(true);
    expect(result.explainability.confidence).toBeGreaterThan(0);
    expect(result.auditLog.some((e) => e.action === "federation.begin")).toBe(true);
  });

  it("wires through createIntelligenceService DI", () => {
    const stacks = createIntelligenceService({ eagerStacks: true });
    const result = stacks.ecosystemIntelligence.service.build({
      requestId: "eco-di",
      scope: { organizationId: "org-1", schoolId: null, actorRoles: ["ceo"] },
      members: sampleMembers(),
      agreements: sampleAgreements(),
    });
    expect(result.version).toBe(ECOSYSTEM_FEDERATION_VERSION);
  });

  it("runs as terminal pipeline module after digital-twin", async () => {
    const platform = createIntelligencePlatform({
      clock: {
        now: () => new Date("2026-07-19T12:00:00.000Z"),
        createId: (prefix) => `${prefix}-test`,
      },
    });
    const health = await platform.checkHealth();
    expect(health.modules.length).toBe(51);
    expect(platform.registry.get("ecosystem-intelligence")?.id).toBe(
      "ecosystem-intelligence"
    );

    const result = await platform.run({
      scope: { organizationId: "org-1", schoolId: "school-1" },
      bypassCache: true,
      input: { periodLabel: "Sprint 072 validation", role: "ceo" },
    });
    expect(result.status).toBe("completed");
    expect(result.moduleOrder).toEqual(PIPELINE_ORDER);
    expect(result.moduleOrder.at(-2)).toBe("digital-twin");
    expect(result.moduleOrder.at(-1)).toBe("ecosystem-intelligence");
    expect(result.results.every((item) => item.ok)).toBe(true);
  });

  it("enriches Executive Command Center with ecosystem widgets", () => {
    const { service } = createEcosystemFederation({
      createId: (p) => `${p}-x`,
      now: () => new Date("2026-07-19T12:00:00.000Z"),
    });
    const twinLike = service.build({
      requestId: "eco-ecc",
      scope: { organizationId: "org-1", schoolId: null, actorRoles: ["ceo"] },
      members: sampleMembers(),
      agreements: sampleAgreements(),
      portfolioResult: samplePortfolio(),
    });
    const ecc = createExecutiveCommandCenter().service.build({
      requestId: "ecc-eco",
      scope: { organizationId: "org-1", schoolId: null },
      role: "ceo",
      ecosystemIntelligenceResult: {
        federation: twinLike.federation,
        metrics: twinLike.model.metrics,
        risks: twinLike.model.risks,
        opportunities: twinLike.model.opportunities,
        geographicCoverage: twinLike.model.geographicCoverage,
        graph: {
          nodeCount: twinLike.model.graph.nodes.length,
          relationshipCount: twinLike.model.graph.relationships.length,
          nodes: twinLike.model.graph.nodes,
        },
        recommendation: {
          preferredOpportunityIds: twinLike.recommendation.preferredOpportunityIds,
          majorRisks: twinLike.recommendation.majorRisks,
          mayAutoExecute: false,
        },
        explainability: twinLike.explainability,
        contributingDomains: twinLike.contributingDomains,
      },
    });
    const kinds = ecc.widgets.map((w) => w.kind);
    expect(kinds).toContain("ecosystem_health");
    expect(kinds).toContain("cross_organization_risks");
    expect(kinds).toContain("shared_opportunities");
    expect(kinds).toContain("organization_network");
  });
});
