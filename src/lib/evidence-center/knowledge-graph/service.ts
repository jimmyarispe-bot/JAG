import { randomUUID } from "node:crypto";
import { knowledgeGraphNodeId } from "@/lib/evidence-center/knowledge-graph/ids";
import {
  deleteGraphEdge,
  findEdgeBetween,
  getGraphEdge,
  getGraphNode,
  listGraphEdges,
  listGraphNodes,
  upsertGraphEdge,
  upsertGraphNode,
} from "@/lib/evidence-center/knowledge-graph/store";
import type {
  ConnectedEvidenceResult,
  KnowledgeGraphEdge,
  KnowledgeGraphNode,
  KnowledgeGraphNodeType,
  KnowledgeGraphQuery,
  KnowledgeGraphRelationshipType,
  KnowledgeGraphSummary,
} from "@/lib/evidence-center/knowledge-graph/types";
import {
  KNOWLEDGE_GRAPH_NODE_TYPES,
  KNOWLEDGE_GRAPH_RELATIONSHIP_TYPES,
} from "@/lib/evidence-center/knowledge-graph/types";

export function isKnowledgeGraphNodeType(
  value: string
): value is KnowledgeGraphNodeType {
  return (KNOWLEDGE_GRAPH_NODE_TYPES as readonly string[]).includes(value);
}

export function isKnowledgeGraphRelationshipType(
  value: string
): value is KnowledgeGraphRelationshipType {
  return (KNOWLEDGE_GRAPH_RELATIONSHIP_TYPES as readonly string[]).includes(
    value
  );
}

export function upsertKnowledgeGraphNode(input: {
  organizationId: string;
  nodeType: KnowledgeGraphNodeType;
  label: string;
  externalKey: string;
  externalId?: string | null;
  metadata?: Record<string, string>;
  existingId?: string;
}): KnowledgeGraphNode {
  const id =
    input.existingId ??
    knowledgeGraphNodeId(input.organizationId, input.nodeType, input.externalKey);
  const existing = getGraphNode(input.organizationId, id);
  const now = new Date().toISOString();
  return upsertGraphNode({
    id,
    organizationId: input.organizationId,
    nodeType: input.nodeType,
    label: input.label,
    externalId: input.externalId ?? input.externalKey,
    metadata: Object.freeze({ ...(input.metadata ?? {}) }),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  });
}

export function createKnowledgeGraphEdge(input: {
  organizationId: string;
  fromNodeId: string;
  toNodeId: string;
  relationshipType: KnowledgeGraphRelationshipType;
  metadata?: Record<string, string>;
}):
  | { ok: true; edge: KnowledgeGraphEdge }
  | { ok: false; error: string } {
  if (
    !isKnowledgeGraphRelationshipType(input.relationshipType)
  ) {
    return { ok: false, error: "Invalid relationship type." };
  }
  if (input.fromNodeId === input.toNodeId) {
    return { ok: false, error: "A node cannot relate to itself." };
  }
  const from = getGraphNode(input.organizationId, input.fromNodeId);
  const to = getGraphNode(input.organizationId, input.toNodeId);
  if (!from || !to) {
    return {
      ok: false,
      error: "Both nodes must exist in the same organization.",
    };
  }

  const existing = findEdgeBetween(
    input.organizationId,
    input.fromNodeId,
    input.toNodeId,
    input.relationshipType
  );
  const now = new Date().toISOString();
  if (existing) {
    const edge = upsertGraphEdge({
      ...existing,
      metadata: Object.freeze({
        ...existing.metadata,
        ...(input.metadata ?? {}),
      }),
      updatedAt: now,
    });
    return { ok: true, edge };
  }

  const edge = upsertGraphEdge({
    id: randomUUID(),
    organizationId: input.organizationId,
    fromNodeId: input.fromNodeId,
    toNodeId: input.toNodeId,
    relationshipType: input.relationshipType,
    metadata: Object.freeze({ ...(input.metadata ?? {}) }),
    createdAt: now,
    updatedAt: now,
  });
  return { ok: true, edge };
}

export function updateKnowledgeGraphEdge(input: {
  organizationId: string;
  edgeId: string;
  relationshipType?: KnowledgeGraphRelationshipType;
  metadata?: Record<string, string>;
}):
  | { ok: true; edge: KnowledgeGraphEdge }
  | { ok: false; error: string } {
  const existing = getGraphEdge(input.organizationId, input.edgeId);
  if (!existing) return { ok: false, error: "Edge not found." };
  if (
    input.relationshipType &&
    !isKnowledgeGraphRelationshipType(input.relationshipType)
  ) {
    return { ok: false, error: "Invalid relationship type." };
  }
  const edge = upsertGraphEdge({
    ...existing,
    relationshipType: input.relationshipType ?? existing.relationshipType,
    metadata: Object.freeze({
      ...existing.metadata,
      ...(input.metadata ?? {}),
    }),
    updatedAt: new Date().toISOString(),
  });
  return { ok: true, edge };
}

export function removeKnowledgeGraphEdge(
  organizationId: string,
  edgeId: string
): boolean {
  return deleteGraphEdge(organizationId, edgeId);
}

export function queryKnowledgeGraph(query: KnowledgeGraphQuery): {
  readonly nodes: readonly KnowledgeGraphNode[];
  readonly edges: readonly KnowledgeGraphEdge[];
} {
  let nodes = listGraphNodes(query.organizationId);
  let edges = listGraphEdges(query.organizationId);

  if (query.nodeType) {
    nodes = nodes.filter((n) => n.nodeType === query.nodeType);
    const ids = new Set(nodes.map((n) => n.id));
    edges = edges.filter(
      (e) => ids.has(e.fromNodeId) || ids.has(e.toNodeId)
    );
  }
  if (query.relationshipType) {
    edges = edges.filter((e) => e.relationshipType === query.relationshipType);
    const ids = new Set<string>();
    for (const e of edges) {
      ids.add(e.fromNodeId);
      ids.add(e.toNodeId);
    }
    if (!query.nodeType) {
      nodes = listGraphNodes(query.organizationId).filter((n) => ids.has(n.id));
    } else {
      nodes = nodes.filter((n) => ids.has(n.id));
    }
  }

  return { nodes: Object.freeze(nodes), edges: Object.freeze(edges) };
}

export function knowledgeGraphSummary(
  organizationId: string
): KnowledgeGraphSummary {
  const nodes = listGraphNodes(organizationId);
  const edges = listGraphEdges(organizationId);
  const nodesByType: Record<string, number> = {};
  const edgesByType: Record<string, number> = {};
  for (const t of KNOWLEDGE_GRAPH_NODE_TYPES) nodesByType[t] = 0;
  for (const t of KNOWLEDGE_GRAPH_RELATIONSHIP_TYPES) edgesByType[t] = 0;
  for (const n of nodes) {
    nodesByType[n.nodeType] = (nodesByType[n.nodeType] ?? 0) + 1;
  }
  for (const e of edges) {
    edgesByType[e.relationshipType] =
      (edgesByType[e.relationshipType] ?? 0) + 1;
  }
  return {
    nodeCount: nodes.length,
    edgeCount: edges.length,
    nodesByType,
    edgesByType,
    recentNodes: Object.freeze(nodes.slice(0, 8)),
    recentEdges: Object.freeze(edges.slice(0, 8)),
  };
}

/**
 * Evidence nodes connected (1-hop) to the given node.
 */
export function queryConnectedEvidence(
  organizationId: string,
  nodeId: string
): ConnectedEvidenceResult | null {
  const node = getGraphNode(organizationId, nodeId);
  if (!node) return null;

  const edges = listGraphEdges(organizationId).filter(
    (e) => e.fromNodeId === nodeId || e.toNodeId === nodeId
  );
  const neighborIds = new Set<string>();
  for (const e of edges) {
    neighborIds.add(e.fromNodeId === nodeId ? e.toNodeId : e.fromNodeId);
  }

  const evidenceNodes = listGraphNodes(organizationId).filter(
    (n) => n.nodeType === "Evidence" && (n.id === nodeId || neighborIds.has(n.id))
  );

  return {
    node,
    evidenceNodes: Object.freeze(evidenceNodes),
    edges: Object.freeze(edges),
  };
}

export function ensureOrganizationScaffold(input: {
  organizationId: string;
  organizationName: string;
  productName?: string;
}): {
  organization: KnowledgeGraphNode;
  product: KnowledgeGraphNode | null;
} {
  const organization = upsertKnowledgeGraphNode({
    organizationId: input.organizationId,
    nodeType: "Organization",
    label: input.organizationName,
    externalKey: input.organizationId,
    externalId: input.organizationId,
    metadata: { kind: "organization" },
  });

  let product: KnowledgeGraphNode | null = null;
  if (input.productName?.trim()) {
    product = upsertKnowledgeGraphNode({
      organizationId: input.organizationId,
      nodeType: "Product",
      label: input.productName.trim(),
      externalKey: input.productName.trim(),
      metadata: { kind: "product" },
    });
    createKnowledgeGraphEdge({
      organizationId: input.organizationId,
      fromNodeId: product.id,
      toNodeId: organization.id,
      relationshipType: "BELONGS_TO",
    });
    createKnowledgeGraphEdge({
      organizationId: input.organizationId,
      fromNodeId: organization.id,
      toNodeId: product.id,
      relationshipType: "OWNS",
    });
  }

  return { organization, product };
}
