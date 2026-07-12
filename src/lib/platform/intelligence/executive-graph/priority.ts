/**
 * Executive Graph Analyzer — ExecutivePriority (Sprint 025).
 */

import type { ExecutivePriorityEngine } from "@/lib/platform/intelligence/executive-graph/contracts";
import { priorityBandFromScore } from "@/lib/platform/intelligence/executive-graph/scorer";
import type {
  CriticalityScore,
  ExecutivePriority,
  Graph,
  GraphConstraint,
  RiskPropagationResult,
  RootCauseFinding,
} from "@/lib/platform/intelligence/executive-graph/types";

export interface ExecutivePriorityDependencies {
  createId?: (prefix: string) => string;
}

/**
 * ExecutivePriority — ranks nodes for founder/executive attention.
 */
export class ExecutivePriorityRanker implements ExecutivePriorityEngine {
  private readonly createId: (prefix: string) => string;

  constructor(dependencies: ExecutivePriorityDependencies = {}) {
    this.createId =
      dependencies.createId ??
      ((prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  }

  rank(input: {
    graph: Graph;
    criticality: CriticalityScore[];
    rootCauses: RootCauseFinding[];
    risks: RiskPropagationResult[];
    constraints: GraphConstraint[];
  }): ExecutivePriority[] {
    const byNode = new Map(input.criticality.map((c) => [c.nodeId, c]));
    const rootBoost = new Map(input.rootCauses.map((r) => [r.nodeId, r.score]));
    const riskBoost = new Map<string, number>();
    for (const risk of input.risks) {
      riskBoost.set(
        risk.originNodeId,
        Math.max(riskBoost.get(risk.originNodeId) ?? 0, risk.totalRisk)
      );
      for (const affected of risk.affectedNodeIds) {
        riskBoost.set(affected, Math.max(riskBoost.get(affected) ?? 0, risk.totalRisk * 0.6));
      }
    }
    const constraintBoost = new Map<string, number>();
    for (const constraint of input.constraints) {
      constraintBoost.set(constraint.nodeId, 0.85);
      for (const blocked of constraint.blockedNodeIds) {
        constraintBoost.set(blocked, Math.max(constraintBoost.get(blocked) ?? 0, 0.7));
      }
    }

    const priorities: ExecutivePriority[] = [];

    for (const node of input.graph.nodes) {
      if (node.kind === "domain_root") continue;
      const criticality = byNode.get(node.id)?.score ?? node.criticality;
      const score = Math.min(
        1,
        criticality * 0.45 +
          (rootBoost.get(node.id) ?? 0) * 0.3 +
          (riskBoost.get(node.id) ?? 0) * 0.2 +
          (constraintBoost.get(node.id) ?? 0) * 0.25
      );
      if (score < 0.25) continue;

      const band = priorityBandFromScore(score);
      const rationaleParts: string[] = [];
      if (rootBoost.has(node.id)) rationaleParts.push("Identified as root cause");
      if ((riskBoost.get(node.id) ?? 0) >= 0.5) rationaleParts.push("On elevated risk path");
      if (constraintBoost.has(node.id)) rationaleParts.push("Tied to active constraint");
      if (rationaleParts.length === 0) {
        rationaleParts.push(byNode.get(node.id)?.reasons[0] ?? "Structural criticality");
      }

      priorities.push({
        id: this.createId("priority"),
        nodeId: node.id,
        title: node.label,
        band,
        score,
        domain: node.domain,
        rationale: rationaleParts.join("; "),
        confidence: node.confidence,
      });
    }

    return priorities.sort((a, b) => b.score - a.score).slice(0, 20);
  }
}

/** Alias export matching Sprint 025 naming. */
export { ExecutivePriorityRanker as ExecutivePriority };
