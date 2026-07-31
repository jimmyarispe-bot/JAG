/**
 * EvidenceResolver — look up nodes and paths without owning source data.
 */

import type {
  EvidenceEdge,
  EvidenceGraph,
  EvidenceNode,
  EvidenceNodeId,
} from "@/jag/intelligence/evidence/types";

export type EvidenceResolver = {
  getNode(graph: EvidenceGraph, nodeId: EvidenceNodeId): EvidenceNode | undefined;
  getNodeByRef(
    graph: EvidenceGraph,
    kind: EvidenceNode["kind"],
    refId: string
  ): EvidenceNode | undefined;
  neighbors(
    graph: EvidenceGraph,
    nodeId: EvidenceNodeId
  ): readonly EvidenceNode[];
  edgesFrom(graph: EvidenceGraph, nodeId: EvidenceNodeId): readonly EvidenceEdge[];
  edgesTo(graph: EvidenceGraph, nodeId: EvidenceNodeId): readonly EvidenceEdge[];
  nodesForEvidenceId(
    graph: EvidenceGraph,
    evidenceId: string
  ): readonly EvidenceNode[];
};

export function createEvidenceResolver(): EvidenceResolver {
  return {
    getNode(graph, nodeId) {
      return graph.nodes.find((n) => n.id === nodeId);
    },
    getNodeByRef(graph, kind, refId) {
      return graph.nodes.find((n) => n.kind === kind && n.refId === refId);
    },
    neighbors(graph, nodeId) {
      const ids = new Set<string>();
      for (const edge of graph.edges) {
        if (edge.fromNodeId === nodeId && edge.toNodeId) ids.add(edge.toNodeId);
        if (edge.toNodeId === nodeId) ids.add(edge.fromNodeId);
      }
      return Object.freeze(
        graph.nodes.filter((n) => ids.has(n.id))
      );
    },
    edgesFrom(graph, nodeId) {
      return Object.freeze(graph.edges.filter((e) => e.fromNodeId === nodeId));
    },
    edgesTo(graph, nodeId) {
      return Object.freeze(
        graph.edges.filter((e) => e.toNodeId === nodeId)
      );
    },
    nodesForEvidenceId(graph, evidenceId) {
      return Object.freeze(
        graph.nodes.filter((n) => n.evidenceIds.includes(evidenceId))
      );
    },
  };
}
