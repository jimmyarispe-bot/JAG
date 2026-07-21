import type {
  EcosystemMetric,
  FederatedOrgSummary,
  OrganizationNode,
} from "@/lib/platform/intelligence/ecosystem-intelligence/types";

export class AggregationEngine {
  aggregate(
    summaries: FederatedOrgSummary[],
    nodes: OrganizationNode[],
    enrollmentByOrg: Map<string, number>
  ): {
    metrics: EcosystemMetric[];
    geographicCoverage: Array<{
      region: string;
      organizationIds: string[];
      enrollmentIndex: number;
    }>;
  } {
    const orgIds = summaries.map((s) => s.organizationId);
    const healthValues = summaries
      .map((s) => s.health?.value)
      .filter((v): v is number => typeof v === "number");
    const portfolioValues = summaries
      .map((s) => s.portfolio?.value)
      .filter((v): v is number => typeof v === "number");
    const activeInitiatives = summaries.reduce(
      (acc, s) => acc + (s.initiatives?.active ?? 0),
      0
    );
    const atRiskInitiatives = summaries.reduce(
      (acc, s) => acc + (s.initiatives?.atRisk ?? 0),
      0
    );
    const totalEnrollment = orgIds.reduce(
      (acc, id) => acc + (enrollmentByOrg.get(id) ?? 0),
      0
    );

    const metrics: EcosystemMetric[] = [
      {
        key: "ecosystem_health",
        label: "Ecosystem health (avg)",
        value:
          healthValues.length === 0
            ? 0
            : healthValues.reduce((a, b) => a + b, 0) / healthValues.length,
        contributingOrganizationIds: summaries
          .filter((s) => s.health)
          .map((s) => s.organizationId),
      },
      {
        key: "combined_portfolio_value",
        label: "Combined portfolio value",
        value: portfolioValues.reduce((a, b) => a + b, 0),
        unit: "usd_index",
        contributingOrganizationIds: summaries
          .filter((s) => s.portfolio)
          .map((s) => s.organizationId),
      },
      {
        key: "total_enrollment_index",
        label: "Total enrollment index",
        value: totalEnrollment,
        contributingOrganizationIds: orgIds.filter((id) => enrollmentByOrg.has(id)),
      },
      {
        key: "active_initiatives",
        label: "Active initiatives (federated)",
        value: activeInitiatives,
        contributingOrganizationIds: summaries
          .filter((s) => s.initiatives)
          .map((s) => s.organizationId),
      },
      {
        key: "at_risk_initiatives",
        label: "At-risk initiatives (federated)",
        value: atRiskInitiatives,
        contributingOrganizationIds: summaries
          .filter((s) => (s.initiatives?.atRisk ?? 0) > 0)
          .map((s) => s.organizationId),
      },
      {
        key: "organization_count",
        label: "Authorized organizations",
        value: summaries.length,
        contributingOrganizationIds: orgIds,
      },
    ];

    const byRegion = new Map<string, { organizationIds: string[]; enrollmentIndex: number }>();
    for (const node of nodes) {
      const region = node.region ?? "unspecified";
      const entry = byRegion.get(region) ?? { organizationIds: [], enrollmentIndex: 0 };
      entry.organizationIds.push(node.organizationId);
      entry.enrollmentIndex += enrollmentByOrg.get(node.organizationId) ?? 0;
      byRegion.set(region, entry);
    }

    return {
      metrics,
      geographicCoverage: [...byRegion.entries()].map(([region, data]) => ({
        region,
        organizationIds: data.organizationIds,
        enrollmentIndex: data.enrollmentIndex,
      })),
    };
  }
}
