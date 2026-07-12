/**
 * Executive Graph Analyzer — CriticalityScore (Sprint 025).
 */

import type { CriticalityScorer } from "@/lib/platform/intelligence/executive-graph/contracts";
import { incoming, outgoing } from "@/lib/platform/intelligence/executive-graph/model";
import {
  clamp01,
  severityToScore,
  statusToPressure,
} from "@/lib/platform/intelligence/executive-graph/scorer";
import type {
  CriticalityScore,
  Graph,
} from "@/lib/platform/intelligence/executive-graph/types";
import { isBlockingEdge, isCausalEdge } from "@/lib/platform/intelligence/executive-graph/edges";

/**
 * CriticalityScore — fan-in/out + risk-weighted node criticality.
 */
export class CriticalityScoreEngine implements CriticalityScorer {
  score(graph: Graph): CriticalityScore[] {
    return graph.nodes
      .map((node) => this.scoreNode(graph, node.id))
      .filter((item): item is CriticalityScore => item !== null)
      .sort((a, b) => b.score - a.score);
  }

  scoreNode(graph: Graph, nodeId: string): CriticalityScore | null {
    const node = graph.nodes.find((n) => n.id === nodeId);
    if (!node) return null;

    const inEdges = incoming(graph, nodeId);
    const outEdges = outgoing(graph, nodeId);
    const fanIn = inEdges.length;
    const fanOut = outEdges.length;

    const causalWeight =
      inEdges.filter((e) => isCausalEdge(e.kind)).reduce((s, e) => s + e.weight, 0) +
      outEdges.filter((e) => isCausalEdge(e.kind)).reduce((s, e) => s + e.weight, 0);

    const blockWeight = [...inEdges, ...outEdges]
      .filter((e) => isBlockingEdge(e.kind))
      .reduce((s, e) => s + e.weight, 0);

    const riskWeight = clamp01(
      statusToPressure(node.status) * 0.45 +
        severityToScore(node.severity) * 0.35 +
        blockWeight * 0.15 +
        (typeof node.value === "number" && node.value < 0 ? 0.2 : 0)
    );

    const structural = clamp01((fanIn * 0.12 + fanOut * 0.1 + causalWeight * 0.08) / 2);
    const score = clamp01(structural * 0.45 + riskWeight * 0.55 + node.criticality * 0.15);

    const reasons: string[] = [];
    if (fanIn > 2) reasons.push(`High fan-in (${fanIn})`);
    if (fanOut > 2) reasons.push(`High fan-out (${fanOut})`);
    if (blockWeight > 0) reasons.push("Participates in blocking relations");
    if (riskWeight >= 0.7) reasons.push("Elevated status/severity pressure");
    if (reasons.length === 0) reasons.push("Baseline structural criticality");

    return {
      nodeId,
      score,
      fanIn,
      fanOut,
      riskWeight,
      reasons,
    };
  }
}

/** Alias export matching Sprint 025 naming. */
export { CriticalityScoreEngine as CriticalityScore };
