/**
 * Executive Graph Analyzer — OpportunityEngine (Sprint 025).
 */

import type { OpportunityEngine as OpportunityEngineContract } from "@/lib/platform/intelligence/executive-graph/contracts";
import { isSupportiveEdge } from "@/lib/platform/intelligence/executive-graph/edges";
import { outgoing } from "@/lib/platform/intelligence/executive-graph/model";
import type {
  Graph,
  GraphOpportunity,
} from "@/lib/platform/intelligence/executive-graph/types";

export interface OpportunityEngineDependencies {
  createId?: (prefix: string) => string;
}

/**
 * OpportunityEngine — discovers positive SUPPORTS / IMPROVES paths.
 */
export class OpportunityEngine implements OpportunityEngineContract {
  private readonly createId: (prefix: string) => string;

  constructor(dependencies: OpportunityEngineDependencies = {}) {
    this.createId =
      dependencies.createId ??
      ((prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  }

  discover(graph: Graph): GraphOpportunity[] {
    const opportunities: GraphOpportunity[] = [];

    for (const node of graph.nodes) {
      if (node.kind === "opportunity") {
        opportunities.push({
          id: this.createId("opp"),
          nodeId: node.id,
          title: node.label,
          description: `Founder/domain opportunity signal: ${node.label}`,
          estimatedLift: typeof node.value === "number" ? node.value : node.confidence,
          confidence: node.confidence,
          supportingNodeIds: [],
          domain: node.domain,
        });
        continue;
      }

      const supportEdges = outgoing(graph, node.id).filter(
        (e) => isSupportiveEdge(e.kind) || e.direction === "positive"
      );
      if (supportEdges.length === 0) continue;
      if (node.status === "critical") continue;

      const lift = Math.min(
        1,
        supportEdges.reduce((s, e) => s + e.weight * e.confidence, 0) /
          Math.max(1, supportEdges.length)
      );

      if (lift < 0.4) continue;

      opportunities.push({
        id: this.createId("opp"),
        nodeId: node.id,
        title: `Strengthen ${node.label}`,
        description: `${node.label} supports ${supportEdges.length} downstream outcome(s).`,
        estimatedLift: lift,
        confidence: node.confidence,
        supportingNodeIds: supportEdges.map((e) => e.targetId),
        domain: node.domain,
      });
    }

    return opportunities.sort((a, b) => b.estimatedLift - a.estimatedLift).slice(0, 15);
  }
}
