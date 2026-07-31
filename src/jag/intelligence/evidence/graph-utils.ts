/**
 * Deterministic graph helpers — ordering and cycle detection.
 */

import {
  compareEvidencePriority,
} from "@/jag/intelligence/evidence/priority";
import type {
  EvidenceEdge,
  EvidenceGraph,
  EvidenceNode,
  EvidenceNodeId,
} from "@/jag/intelligence/evidence/types";
import { ORGANIZATIONAL_EVIDENCE_KINDS } from "@/jag/intelligence/evidence/reference-kinds";

const KIND_ORDER = new Map(
  ORGANIZATIONAL_EVIDENCE_KINDS.map((k, i) => [k, i])
);

export function nodeIdFor(
  kind: EvidenceNode["kind"],
  refId: string
): EvidenceNodeId {
  return `${kind}:${refId}`;
}

export function compareEvidenceNodes(a: EvidenceNode, b: EvidenceNode): number {
  const byPriority = compareEvidencePriority(a.priority, b.priority);
  if (byPriority !== 0) return byPriority;
  const kindA = KIND_ORDER.get(a.kind) ?? 999;
  const kindB = KIND_ORDER.get(b.kind) ?? 999;
  if (kindA !== kindB) return kindA - kindB;
  return a.id.localeCompare(b.id);
}

export function compareEvidenceEdges(a: EvidenceEdge, b: EvidenceEdge): number {
  const byId = a.ruleId.localeCompare(b.ruleId);
  if (byId !== 0) return byId;
  return a.id.localeCompare(b.id);
}

export function sortGraphMembers(graph: {
  nodes: readonly EvidenceNode[];
  edges: readonly EvidenceEdge[];
}): {
  nodes: EvidenceNode[];
  edges: EvidenceEdge[];
  orderedNodeIds: EvidenceNodeId[];
} {
  const nodes = [...graph.nodes].sort(compareEvidenceNodes);
  const edges = [...graph.edges].sort(compareEvidenceEdges);
  return {
    nodes,
    edges,
    orderedNodeIds: nodes.map((n) => n.id),
  };
}

/**
 * Would adding from → to create a directed cycle among node edges?
 * Sink edges (no toNodeId) never create cycles.
 */
export function wouldCreateCycle(
  existing: readonly EvidenceEdge[],
  fromNodeId: EvidenceNodeId,
  toNodeId: EvidenceNodeId
): boolean {
  if (fromNodeId === toNodeId) return true;
  const adj = new Map<string, string[]>();
  for (const edge of existing) {
    if (!edge.toNodeId) continue;
    const list = adj.get(edge.fromNodeId) ?? [];
    list.push(edge.toNodeId);
    adj.set(edge.fromNodeId, list);
  }
  // DFS from toNodeId — if we can reach fromNodeId, adding edge closes a cycle
  const stack = [toNodeId];
  const seen = new Set<string>();
  while (stack.length > 0) {
    const cur = stack.pop()!;
    if (cur === fromNodeId) return true;
    if (seen.has(cur)) continue;
    seen.add(cur);
    for (const next of adj.get(cur) ?? []) stack.push(next);
  }
  return false;
}

export function freezeGraph(graph: EvidenceGraph): EvidenceGraph {
  return Object.freeze({
    id: graph.id,
    organizationId: graph.organizationId,
    nodes: Object.freeze([...graph.nodes]),
    edges: Object.freeze([...graph.edges]),
    correlations: Object.freeze([...graph.correlations]),
    skippedCycleEdges: Object.freeze([...graph.skippedCycleEdges]),
  });
}
