/**
 * Executive Graph Analyzer — DependencyAnalyzer (Sprint 025).
 */

import type { DependencyAnalyzer as DependencyAnalyzerContract } from "@/lib/platform/intelligence/executive-graph/contracts";
import { incoming, outgoing } from "@/lib/platform/intelligence/executive-graph/model";
import type {
  DependencyFinding,
  Graph,
} from "@/lib/platform/intelligence/executive-graph/types";

/**
 * DependencyAnalyzer — DEPENDS_ON / fan-in / fan-out criticality.
 */
export class DependencyAnalyzer implements DependencyAnalyzerContract {
  analyze(graph: Graph): DependencyFinding[] {
    return graph.nodes.map((node) => {
      const dependsOn = [
        ...incoming(graph, node.id)
          .filter((e) => e.kind === "DEPENDS_ON")
          .map((e) => e.sourceId),
        ...outgoing(graph, node.id)
          .filter((e) => e.kind === "DEPENDS_ON")
          .map((e) => e.targetId),
      ];
      const dependedBy = incoming(graph, node.id)
        .filter((e) => e.kind === "DEPENDS_ON")
        .map((e) => e.sourceId);

      const fanIn = incoming(graph, node.id).length;
      const fanOut = outgoing(graph, node.id).length;
      const criticality = Math.min(
        1,
        node.criticality * 0.4 + fanIn * 0.08 + fanOut * 0.08 + dependsOn.length * 0.1
      );

      return {
        nodeId: node.id,
        dependsOn: Array.from(new Set(dependsOn)),
        dependedBy: Array.from(new Set(dependedBy)),
        fanIn,
        fanOut,
        criticality,
      };
    });
  }
}
