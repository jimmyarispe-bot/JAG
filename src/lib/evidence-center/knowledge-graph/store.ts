import type {
  KnowledgeGraphEdge,
  KnowledgeGraphNode,
} from "@/lib/evidence-center/knowledge-graph/types";

type KgStore = {
  nodes: Map<string, KnowledgeGraphNode>;
  edges: Map<string, KnowledgeGraphEdge>;
};

const g = globalThis as typeof globalThis & {
  __jagEvidenceKnowledgeGraph?: KgStore;
};

function store(): KgStore {
  if (!g.__jagEvidenceKnowledgeGraph) {
    g.__jagEvidenceKnowledgeGraph = {
      nodes: new Map(),
      edges: new Map(),
    };
  }
  return g.__jagEvidenceKnowledgeGraph;
}

export function resetKnowledgeGraphStoreForTests(): void {
  g.__jagEvidenceKnowledgeGraph = {
    nodes: new Map(),
    edges: new Map(),
  };
}

export function upsertGraphNode(node: KnowledgeGraphNode): KnowledgeGraphNode {
  store().nodes.set(node.id, node);
  return node;
}

export function getGraphNode(
  organizationId: string,
  nodeId: string
): KnowledgeGraphNode | null {
  const node = store().nodes.get(nodeId) ?? null;
  if (!node || node.organizationId !== organizationId) return null;
  return node;
}

export function listGraphNodes(
  organizationId: string
): readonly KnowledgeGraphNode[] {
  return [...store().nodes.values()]
    .filter((n) => n.organizationId === organizationId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function deleteGraphNode(
  organizationId: string,
  nodeId: string
): boolean {
  const node = getGraphNode(organizationId, nodeId);
  if (!node) return false;
  const s = store();
  s.nodes.delete(nodeId);
  for (const [id, edge] of s.edges) {
    if (
      edge.organizationId === organizationId &&
      (edge.fromNodeId === nodeId || edge.toNodeId === nodeId)
    ) {
      s.edges.delete(id);
    }
  }
  return true;
}

export function upsertGraphEdge(edge: KnowledgeGraphEdge): KnowledgeGraphEdge {
  store().edges.set(edge.id, edge);
  return edge;
}

export function getGraphEdge(
  organizationId: string,
  edgeId: string
): KnowledgeGraphEdge | null {
  const edge = store().edges.get(edgeId) ?? null;
  if (!edge || edge.organizationId !== organizationId) return null;
  return edge;
}

export function listGraphEdges(
  organizationId: string
): readonly KnowledgeGraphEdge[] {
  return [...store().edges.values()]
    .filter((e) => e.organizationId === organizationId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function deleteGraphEdge(
  organizationId: string,
  edgeId: string
): boolean {
  const edge = getGraphEdge(organizationId, edgeId);
  if (!edge) return false;
  store().edges.delete(edgeId);
  return true;
}

export function findEdgeBetween(
  organizationId: string,
  fromNodeId: string,
  toNodeId: string,
  relationshipType: string
): KnowledgeGraphEdge | null {
  return (
    listGraphEdges(organizationId).find(
      (e) =>
        e.fromNodeId === fromNodeId &&
        e.toNodeId === toNodeId &&
        e.relationshipType === relationshipType
    ) ?? null
  );
}
