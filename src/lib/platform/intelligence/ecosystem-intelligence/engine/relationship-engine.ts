import type {
  EcosystemGraph,
  FederationOpportunity,
  FederationRisk,
  FederatedOrgSummary,
} from "@/lib/platform/intelligence/ecosystem-intelligence/types";

export class RelationshipEngine {
  constructor(private readonly createId: (prefix: string) => string) {}

  deriveRisks(graph: EcosystemGraph, summaries: FederatedOrgSummary[]): FederationRisk[] {
    const risks: FederationRisk[] = [];
    const vendorEdges = graph.relationships.filter((r) => r.kind === "vendor");
    const vendorTargets = new Map<string, string[]>();
    for (const edge of vendorEdges) {
      const list = vendorTargets.get(edge.toId) ?? [];
      list.push(edge.fromId);
      vendorTargets.set(edge.toId, list);
    }
    for (const [vendorNodeId, fromNodes] of vendorTargets) {
      if (fromNodes.length < 2) continue;
      const orgIds = fromNodes
        .map((nid) => graph.nodes.find((n) => n.id === nid)?.organizationId)
        .filter((id): id is string => Boolean(id));
      const vendorOrg = graph.nodes.find((n) => n.id === vendorNodeId)?.organizationId;
      if (vendorOrg) orgIds.push(vendorOrg);
      risks.push({
        id: this.createId("risk"),
        kind: "shared_vendor",
        severity: fromNodes.length >= 3 ? "high" : "medium",
        title: "Shared vendor concentration",
        description: `${fromNodes.length} organizations depend on the same vendor node.`,
        organizationIds: [...new Set(orgIds)],
      });
    }

    const elevated = summaries.filter((s) => (s.risk?.index ?? 0) >= 70);
    if (elevated.length >= 2) {
      risks.push({
        id: this.createId("risk"),
        kind: "shared_compliance",
        severity: "medium",
        title: "Elevated risk cluster",
        description: "Multiple federated organizations report elevated risk indexes.",
        organizationIds: elevated.map((s) => s.organizationId),
      });
    }

    const regions = new Map<string, string[]>();
    for (const node of graph.nodes) {
      if (!node.region) continue;
      const list = regions.get(node.region) ?? [];
      list.push(node.organizationId);
      regions.set(node.region, list);
    }
    for (const [region, orgIds] of regions) {
      if (orgIds.length < 2) continue;
      const share = orgIds.length / Math.max(graph.nodes.length, 1);
      if (share >= 0.6) {
        risks.push({
          id: this.createId("risk"),
          kind: "geographic_dependency",
          severity: share >= 0.8 ? "high" : "medium",
          title: `Geographic concentration in ${region}`,
          description: "Ecosystem coverage is concentrated in a single region.",
          organizationIds: orgIds,
        });
      }
    }

    return risks;
  }

  deriveOpportunities(
    graph: EcosystemGraph,
    summaries: FederatedOrgSummary[]
  ): FederationOpportunity[] {
    const opportunities: FederationOpportunity[] = [];
    const orgIds = summaries.map((s) => s.organizationId);
    if (orgIds.length >= 2) {
      opportunities.push({
        id: this.createId("opp"),
        kind: "shared_purchasing",
        title: "Shared purchasing consortium",
        description: "Coordinate procurement across federated organizations.",
        organizationIds: orgIds,
        estimatedImpact: 0.12 * orgIds.length,
      });
      opportunities.push({
        id: this.createId("opp"),
        kind: "shared_staffing",
        title: "Shared staffing pool",
        description: "Cross-org staffing capacity for peak enrollment periods.",
        organizationIds: orgIds,
        estimatedImpact: 0.1 * orgIds.length,
      });
    }

    const grantEdges = graph.relationships.filter(
      (r) => r.kind === "grant_collaboration" || r.kind === "strategic_partnership"
    );
    if (grantEdges.length > 0) {
      const involved = new Set<string>();
      for (const edge of grantEdges) {
        const from = graph.nodes.find((n) => n.id === edge.fromId)?.organizationId;
        const to = graph.nodes.find((n) => n.id === edge.toId)?.organizationId;
        if (from) involved.add(from);
        if (to) involved.add(to);
      }
      opportunities.push({
        id: this.createId("opp"),
        kind: "joint_grant",
        title: "Joint grant opportunities",
        description: "Existing partnership edges support joint funding applications.",
        organizationIds: [...involved],
        estimatedImpact: 0.2 * involved.size,
      });
    }

    if (graph.relationships.some((r) => r.kind === "shared_service")) {
      opportunities.push({
        id: this.createId("opp"),
        kind: "technology_consolidation",
        title: "Technology consolidation",
        description: "Shared services suggest consolidation of overlapping platforms.",
        organizationIds: orgIds,
        estimatedImpact: 0.15,
      });
    }

    return opportunities;
  }
}
