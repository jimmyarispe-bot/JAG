import { publishKnowledgeEvent } from "../events";
import { newId, nowIso } from "../ids";
import { kstore } from "../store";
import type { DocumentRecord, GraphEdge, GraphNode, GraphNodeKind } from "../types";

export function upsertNode(input: {
  organizationId: string;
  kind: GraphNodeKind;
  label: string;
  externalRef?: string | null;
  properties?: Readonly<Record<string, unknown>>;
}): GraphNode {
  const existing = kstore
    .listNodes(input.organizationId)
    .find(
      (n) =>
        n.kind === input.kind &&
        (input.externalRef
          ? n.externalRef === input.externalRef
          : n.label === input.label)
    );
  if (existing) return existing;
  const node = kstore.upsertNode({
    id: newId("knode"),
    organizationId: input.organizationId,
    kind: input.kind,
    label: input.label,
    externalRef: input.externalRef ?? null,
    properties: Object.freeze({ ...(input.properties ?? {}) }),
    createdAt: nowIso(),
  });
  publishKnowledgeEvent({
    type: "knowledge.graph_updated",
    organizationId: input.organizationId,
    recordType: "graph_node",
    recordId: node.id,
    payload: { kind: node.kind, label: node.label },
  });
  return node;
}

export function linkDocumentNode(input: {
  organizationId: string;
  document: DocumentRecord;
}): GraphNode {
  return upsertNode({
    organizationId: input.organizationId,
    kind: "document",
    label: input.document.title,
    externalRef: input.document.id,
    properties: {
      typeKey: input.document.typeKey,
      domain: input.document.domain,
    },
  });
}

export function relate(input: {
  organizationId: string;
  fromNodeId: string;
  toNodeId: string;
  relationship: string;
  evidenceFactIds?: readonly string[];
  actorUserId?: string | null;
}): GraphEdge {
  const edge = kstore.upsertEdge({
    id: newId("kedge"),
    organizationId: input.organizationId,
    fromNodeId: input.fromNodeId,
    toNodeId: input.toNodeId,
    relationship: input.relationship,
    evidenceFactIds: Object.freeze([...(input.evidenceFactIds ?? [])]),
    createdAt: nowIso(),
  });
  publishKnowledgeEvent({
    type: "knowledge.relationship_created",
    organizationId: input.organizationId,
    recordType: "graph_edge",
    recordId: edge.id,
    actorUserId: input.actorUserId,
    payload: {
      relationship: edge.relationship,
      fromNodeId: edge.fromNodeId,
      toNodeId: edge.toNodeId,
    },
  });
  publishKnowledgeEvent({
    type: "knowledge.graph_updated",
    organizationId: input.organizationId,
    recordType: "graph_edge",
    recordId: edge.id,
    payload: { relationship: edge.relationship },
  });
  return edge;
}

export function queryGraph(organizationId: string): {
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
} {
  return Object.freeze({
    nodes: kstore.listNodes(organizationId),
    edges: kstore.listEdges(organizationId),
  });
}
