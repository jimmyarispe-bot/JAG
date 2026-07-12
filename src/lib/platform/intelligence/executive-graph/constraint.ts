/**
 * Executive Graph Analyzer — ConstraintEngine (Sprint 025).
 */

import type { ConstraintEngine as ConstraintEngineContract } from "@/lib/platform/intelligence/executive-graph/contracts";
import { isBlockingEdge } from "@/lib/platform/intelligence/executive-graph/edges";
import { outgoing } from "@/lib/platform/intelligence/executive-graph/model";
import { priorityBandFromScore, severityToScore } from "@/lib/platform/intelligence/executive-graph/scorer";
import type {
  Graph,
  GraphConstraint,
} from "@/lib/platform/intelligence/executive-graph/types";

export interface ConstraintEngineDependencies {
  createId?: (prefix: string) => string;
}

/**
 * ConstraintEngine — detects blocks / capacity / compliance constraints.
 */
export class ConstraintEngine implements ConstraintEngineContract {
  private readonly createId: (prefix: string) => string;

  constructor(dependencies: ConstraintEngineDependencies = {}) {
    this.createId =
      dependencies.createId ??
      ((prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  }

  detect(graph: Graph): GraphConstraint[] {
    const constraints: GraphConstraint[] = [];

    for (const node of graph.nodes) {
      const blocking = outgoing(graph, node.id).filter((e) => isBlockingEdge(e.kind));
      if (blocking.length > 0) {
        constraints.push({
          id: this.createId("constraint"),
          nodeId: node.id,
          kind: node.domain === "hr" ? "staffing" : "blocks",
          title: `${node.label} constraint`,
          description: `${node.label} blocks ${blocking.length} downstream capability(ies).`,
          severity: priorityBandFromScore(
            Math.max(severityToScore(node.severity), 0.55 + blocking.length * 0.1)
          ),
          blockedNodeIds: blocking.map((e) => e.targetId),
        });
      }

      if (node.key.includes("vacancies") && typeof node.value === "number" && node.value > 0) {
        constraints.push({
          id: this.createId("constraint"),
          nodeId: node.id,
          kind: "staffing",
          title: "Staffing vacancies",
          description: "Open vacancies constrain operational capacity.",
          severity: node.value >= 3 ? "high" : "medium",
          blockedNodeIds: outgoing(graph, node.id).map((e) => e.targetId),
        });
      }

      if (
        node.domain === "finance" &&
        node.key.includes("cash") &&
        typeof node.value === "number" &&
        node.value < 0
      ) {
        constraints.push({
          id: this.createId("constraint"),
          nodeId: node.id,
          kind: "funding",
          title: "Negative cash position",
          description: "Cash shortfall constrains discretionary initiatives.",
          severity: "critical",
          blockedNodeIds: [],
        });
      }

      if (node.domain === "executive" && node.key.includes("compliance") && node.status === "critical") {
        constraints.push({
          id: this.createId("constraint"),
          nodeId: node.id,
          kind: "compliance",
          title: "Compliance constraint",
          description: "Critical compliance posture constrains expansion decisions.",
          severity: "high",
          blockedNodeIds: [],
        });
      }
    }

    return constraints.slice(0, 15);
  }
}
