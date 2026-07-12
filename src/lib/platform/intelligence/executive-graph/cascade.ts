/**
 * Executive Graph Analyzer — CascadeAnalyzer (Sprint 025).
 */

import type { CascadeAnalyzer as CascadeAnalyzerContract } from "@/lib/platform/intelligence/executive-graph/contracts";
import { outgoing } from "@/lib/platform/intelligence/executive-graph/model";
import type {
  CascadePath,
  Graph,
  GraphEdge,
} from "@/lib/platform/intelligence/executive-graph/types";

export interface CascadeAnalyzerDependencies {
  createId?: (prefix: string) => string;
  defaultMaxDepth?: number;
}

/**
 * CascadeAnalyzer — multi-hop impact path discovery.
 */
export class CascadeAnalyzer implements CascadeAnalyzerContract {
  private readonly createId: (prefix: string) => string;
  private readonly defaultMaxDepth: number;

  constructor(dependencies: CascadeAnalyzerDependencies = {}) {
    this.createId =
      dependencies.createId ??
      ((prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
    this.defaultMaxDepth = dependencies.defaultMaxDepth ?? 4;
  }

  analyze(graph: Graph, originNodeId?: string, maxDepth = this.defaultMaxDepth): CascadePath[] {
    const origins = originNodeId
      ? graph.nodes.filter((n) => n.id === originNodeId)
      : graph.nodes.filter((n) => n.kind !== "domain_root");

    const paths: CascadePath[] = [];

    for (const origin of origins) {
      this.walk(graph, origin.id, [origin.id], [], maxDepth, paths);
    }

    return paths
      .filter((p) => p.depth >= 1)
      .sort((a, b) => b.impactScore - a.impactScore)
      .slice(0, 40);
  }

  private walk(
    graph: Graph,
    currentId: string,
    nodeIds: string[],
    edgeIds: string[],
    maxDepth: number,
    paths: CascadePath[]
  ): void {
    if (nodeIds.length - 1 >= maxDepth) return;

    const edges = outgoing(graph, currentId);
    for (const edge of edges) {
      if (nodeIds.includes(edge.targetId)) continue;
      const nextNodes = [...nodeIds, edge.targetId];
      const nextEdges = [...edgeIds, edge.id];
      const depth = nextNodes.length - 1;
      const direction = this.aggregateDirection(graph, nextEdges);
      const impactScore = this.scorePath(graph, nextNodes, nextEdges);

      paths.push({
        id: this.createId("cascade"),
        originNodeId: nodeIds[0],
        terminalNodeId: edge.targetId,
        nodeIds: nextNodes,
        edgeIds: nextEdges,
        depth,
        impactScore,
        direction,
        summary: `Cascade depth ${depth} from ${nodeIds[0]} → ${edge.targetId}`,
      });

      this.walk(graph, edge.targetId, nextNodes, nextEdges, maxDepth, paths);
    }
  }

  private aggregateDirection(
    graph: Graph,
    edgeIds: string[]
  ): "positive" | "negative" | "neutral" {
    const edges = edgeIds
      .map((id) => graph.edges.find((e) => e.id === id))
      .filter((e): e is GraphEdge => Boolean(e));
    const negatives = edges.filter((e) => e.direction === "negative").length;
    const positives = edges.filter((e) => e.direction === "positive").length;
    if (negatives > positives) return "negative";
    if (positives > negatives) return "positive";
    return "neutral";
  }

  private scorePath(graph: Graph, nodeIds: string[], edgeIds: string[]): number {
    const edgeWeight =
      edgeIds.reduce((sum, id) => {
        const edge = graph.edges.find((e) => e.id === id);
        return sum + (edge?.weight ?? 0) * (edge?.direction === "negative" ? 1.2 : 1);
      }, 0) / Math.max(1, edgeIds.length);

    const nodePressure =
      nodeIds.reduce((sum, id) => {
        const node = graph.nodes.find((n) => n.id === id);
        return sum + (node?.criticality ?? 0);
      }, 0) / Math.max(1, nodeIds.length);

    return Math.min(1, edgeWeight * 0.55 + nodePressure * 0.45);
  }
}
