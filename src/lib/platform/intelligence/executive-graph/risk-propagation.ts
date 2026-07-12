/**
 * Executive Graph Analyzer — RiskPropagation (Sprint 025).
 */

import type { RiskPropagation as RiskPropagationContract } from "@/lib/platform/intelligence/executive-graph/contracts";
import { CascadeAnalyzer } from "@/lib/platform/intelligence/executive-graph/cascade";
import type {
  Graph,
  RiskPropagationResult,
} from "@/lib/platform/intelligence/executive-graph/types";

export interface RiskPropagationDependencies {
  cascade?: CascadeAnalyzer;
}

/**
 * RiskPropagation — weighted risk along negative / blocking cascades.
 */
export class RiskPropagation implements RiskPropagationContract {
  private readonly cascade: CascadeAnalyzer;

  constructor(dependencies: RiskPropagationDependencies = {}) {
    this.cascade = dependencies.cascade ?? new CascadeAnalyzer();
  }

  propagate(graph: Graph, originNodeId?: string): RiskPropagationResult[] {
    const candidates = originNodeId
      ? graph.nodes.filter((n) => n.id === originNodeId)
      : graph.nodes.filter(
          (n) =>
            n.kind === "risk" ||
            n.status === "critical" ||
            n.status === "warning" ||
            n.severity === "critical" ||
            n.severity === "high" ||
            n.kind === "constraint"
        );

    const results: RiskPropagationResult[] = [];

    for (const origin of candidates) {
      const paths = this.cascade
        .analyze(graph, origin.id, 4)
        .filter((p) => p.direction === "negative" || p.impactScore >= 0.45);

      if (paths.length === 0 && origin.kind !== "risk") continue;

      const affected = Array.from(
        new Set(paths.flatMap((p) => p.nodeIds.filter((id) => id !== origin.id)))
      );
      const totalRisk = Math.min(
        1,
        (origin.criticality || 0.4) * 0.5 +
          paths.reduce((s, p) => s + p.impactScore, 0) / Math.max(1, paths.length) * 0.5 +
          (origin.severity === "critical" ? 0.2 : 0)
      );

      results.push({
        originNodeId: origin.id,
        affectedNodeIds: affected,
        totalRisk,
        paths: paths.slice(0, 8),
        summary:
          affected.length > 0
            ? `Risk from ${origin.label} propagates to ${affected.length} node(s).`
            : `${origin.label} carries localized elevated risk.`,
      });
    }

    return results.sort((a, b) => b.totalRisk - a.totalRisk).slice(0, 15);
  }
}
