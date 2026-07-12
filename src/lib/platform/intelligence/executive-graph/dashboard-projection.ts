/**
 * Executive Graph Analyzer — DashboardProjection (Sprint 025).
 */

import type { DashboardProjector } from "@/lib/platform/intelligence/executive-graph/contracts";
import type {
  DashboardProjection,
  ExecutiveGraphDomain,
  Graph,
  GraphAnalysisResult,
} from "@/lib/platform/intelligence/executive-graph/types";
import { EXECUTIVE_GRAPH_DOMAINS } from "@/lib/platform/intelligence/executive-graph/types";

export interface DashboardProjectionDependencies {
  now?: () => Date;
}

/**
 * DashboardProjection — flattens analysis for executive dashboard consumption.
 */
export class DashboardProjectionEngine implements DashboardProjector {
  private readonly now: () => Date;

  constructor(dependencies: DashboardProjectionDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date());
  }

  project(
    graph: Graph,
    analysis: Omit<GraphAnalysisResult, "dashboard">
  ): DashboardProjection {
    const overallRisk =
      analysis.risks.reduce((s, r) => s + r.totalRisk, 0) /
      Math.max(1, analysis.risks.length);
    const overallOpportunity =
      analysis.opportunities.reduce((s, o) => s + o.estimatedLift, 0) /
      Math.max(1, analysis.opportunities.length);

    const topPriorities = analysis.priorities.slice(0, 5);
    const topRootCauses = analysis.rootCauses.slice(0, 5);
    const topOpportunities = analysis.opportunities.slice(0, 5);

    const headline =
      topPriorities[0] != null
        ? `Focus: ${topPriorities[0].title} (${topPriorities[0].band})`
        : topRootCauses[0] != null
          ? `Watch: ${topRootCauses[0].label}`
          : "Organizational graph is stable";

    const domainSummaries = EXECUTIVE_GRAPH_DOMAINS.map((domain: ExecutiveGraphDomain) => {
      const nodes = graph.nodes.filter((n) => n.domain === domain && n.kind !== "domain_root");
      const avgCriticality =
        nodes.reduce((s, n) => s + n.criticality, 0) / Math.max(1, nodes.length);
      const worst = nodes.reduce((acc, n) => {
        if (n.status === "critical") return "critical";
        if (n.status === "warning" && acc !== "critical") return "warning";
        return acc;
      }, "healthy");
      return {
        domain,
        nodeCount: nodes.length,
        avgCriticality,
        status: worst,
      };
    });

    return {
      generatedAt: this.now().toISOString(),
      headline,
      overallRisk: Number.isFinite(overallRisk) ? overallRisk : 0,
      overallOpportunity: Number.isFinite(overallOpportunity) ? overallOpportunity : 0,
      topPriorities,
      topRootCauses,
      topOpportunities,
      activeConstraints: analysis.constraints.slice(0, 5),
      domainSummaries,
      metrics: {
        nodeCount: graph.nodes.length,
        edgeCount: graph.edges.length,
        findingCount: analysis.findings.length,
        cascadeCount: analysis.cascades.length,
      },
    };
  }
}

/** Alias export matching Sprint 025 naming. */
export { DashboardProjectionEngine as DashboardProjection };
