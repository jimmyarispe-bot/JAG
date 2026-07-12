/**
 * Executive Graph Analyzer — node / edge model helpers (Sprint 025).
 */

import type { GraphModelHelpers } from "@/lib/platform/intelligence/executive-graph/contracts";
import type {
  ExecutiveGraphDomain,
  Graph,
  GraphEdge,
  GraphNode,
} from "@/lib/platform/intelligence/executive-graph/types";

export function nodeId(domain: string, key: string): string {
  return `${domain}:${key}`;
}

export function createNode(
  partial: Omit<GraphNode, "criticality" | "confidence" | "evidence" | "metadata"> &
    Partial<GraphNode>
): GraphNode {
  return {
    id: partial.id ?? nodeId(partial.domain, partial.key),
    key: partial.key,
    label: partial.label,
    domain: partial.domain,
    kind: partial.kind,
    value: partial.value ?? null,
    status: partial.status ?? null,
    severity: partial.severity ?? null,
    criticality: partial.criticality ?? 0,
    confidence: partial.confidence ?? 0.5,
    evidence: partial.evidence ?? [],
    metadata: partial.metadata ?? {},
  };
}

export function createEdge(
  partial: Omit<GraphEdge, "weight" | "confidence" | "direction" | "evidence" | "metadata"> &
    Partial<GraphEdge>
): GraphEdge {
  return {
    id: partial.id,
    kind: partial.kind,
    sourceId: partial.sourceId,
    targetId: partial.targetId,
    weight: partial.weight ?? 1,
    confidence: partial.confidence ?? 0.5,
    direction: partial.direction ?? "neutral",
    ruleId: partial.ruleId,
    reason: partial.reason,
    evidence: partial.evidence ?? [],
    metadata: partial.metadata ?? {},
  };
}

export function getNodeByKey(graph: Graph, key: string): GraphNode | null {
  return graph.nodes.find((n) => n.key === key) ?? null;
}

export function getNodeById(graph: Graph, id: string): GraphNode | null {
  return graph.nodes.find((n) => n.id === id) ?? null;
}

export function outgoing(graph: Graph, nodeIdValue: string): GraphEdge[] {
  return graph.edges.filter((e) => e.sourceId === nodeIdValue);
}

export function incoming(graph: Graph, nodeIdValue: string): GraphEdge[] {
  return graph.edges.filter((e) => e.targetId === nodeIdValue);
}

export function upsertNode(nodes: Map<string, GraphNode>, node: GraphNode): void {
  nodes.set(node.id, node);
}

export function domainRootId(domain: ExecutiveGraphDomain): string {
  return nodeId(domain, "root");
}

export const graphModel: GraphModelHelpers = {
  createNode,
  createEdge,
  nodeId,
  getNodeByKey,
  getNodeById,
  outgoing,
  incoming,
};
