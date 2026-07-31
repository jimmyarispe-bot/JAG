import type { GraphEdge, GraphNode } from "@/lib/platform/graph/types";

const nodes = new Map<string, GraphNode>();
const edges = new Map<string, GraphEdge>();

export function resetGraphRegistryForTests(): void {
  nodes.clear();
  edges.clear();
}

export function clearGraph(): void {
  nodes.clear();
  edges.clear();
}

export function putNode(node: GraphNode): GraphNode {
  const stored: GraphNode = {
    ...node,
    id: node.id.trim(),
    key: node.key.trim(),
    label: node.label.trim(),
    metadata: { ...node.metadata },
  };
  nodes.set(stored.id, stored);
  return stored;
}

export function removeNode(nodeId: string): boolean {
  const removed = nodes.delete(nodeId);
  if (removed) {
    for (const [edgeId, edge] of edges) {
      if (edge.from === nodeId || edge.to === nodeId) {
        edges.delete(edgeId);
      }
    }
  }
  return removed;
}

export function getNode(nodeId: string): GraphNode | null {
  return nodes.get(nodeId) ?? null;
}

export function listNodes(filter?: {
  kind?: GraphNode["kind"];
  applicationId?: string | null;
  organizationId?: string | null;
  source?: GraphNode["source"];
}): GraphNode[] {
  let rows = [...nodes.values()];
  if (filter?.kind) rows = rows.filter((n) => n.kind === filter.kind);
  if (filter?.applicationId !== undefined) {
    rows = rows.filter((n) => n.applicationId === filter.applicationId);
  }
  if (filter?.organizationId !== undefined) {
    rows = rows.filter((n) => n.organizationId === filter.organizationId);
  }
  if (filter?.source) rows = rows.filter((n) => n.source === filter.source);
  return rows.sort((a, b) => a.id.localeCompare(b.id));
}

export function putEdge(edge: GraphEdge): GraphEdge {
  const stored: GraphEdge = {
    ...edge,
    id: edge.id.trim(),
    from: edge.from.trim(),
    to: edge.to.trim(),
    metadata: { ...edge.metadata },
  };
  edges.set(stored.id, stored);
  return stored;
}

export function removeEdge(edgeId: string): boolean {
  return edges.delete(edgeId);
}

export function getEdge(edgeId: string): GraphEdge | null {
  return edges.get(edgeId) ?? null;
}

export function listEdges(filter?: {
  type?: GraphEdge["type"];
  from?: string;
  to?: string;
  source?: GraphEdge["source"];
}): GraphEdge[] {
  let rows = [...edges.values()];
  if (filter?.type) rows = rows.filter((e) => e.type === filter.type);
  if (filter?.from) rows = rows.filter((e) => e.from === filter.from);
  if (filter?.to) rows = rows.filter((e) => e.to === filter.to);
  if (filter?.source) rows = rows.filter((e) => e.source === filter.source);
  return rows.sort((a, b) => a.id.localeCompare(b.id));
}

export function clearReflectionLayer(): void {
  for (const [id, node] of nodes) {
    if (node.source === "reflection") nodes.delete(id);
  }
  for (const [id, edge] of edges) {
    if (edge.source === "reflection") edges.delete(id);
  }
}

export const GraphRegistry = {
  putNode,
  removeNode,
  getNode,
  listNodes,
  putEdge,
  removeEdge,
  getEdge,
  listEdges,
  clear: clearGraph,
  clearReflection: clearReflectionLayer,
  resetForTests: resetGraphRegistryForTests,
} as const;
