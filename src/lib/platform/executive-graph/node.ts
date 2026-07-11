/** Executive Intelligence Graph — node constructors */

import type {
  ExecutiveGraphNode,
  ExecutiveGraphNodeType,
} from "@/lib/platform/executive-graph/types";

export function nodeId(type: ExecutiveGraphNodeType, key: string): string {
  return `${type}:${key}`;
}

export function createNode(input: {
  type: ExecutiveGraphNodeType;
  key: string;
  label: string;
  value?: number | string | null;
  status?: string | null;
  metadata?: Record<string, unknown>;
  createdAt?: string | null;
}): ExecutiveGraphNode {
  return {
    id: nodeId(input.type, input.key),
    type: input.type,
    key: input.key,
    label: input.label,
    value: input.value ?? null,
    status: input.status ?? null,
    metadata: input.metadata ?? {},
    createdAt: input.createdAt ?? null,
  };
}

export function upsertNode(
  map: Map<string, ExecutiveGraphNode>,
  node: ExecutiveGraphNode
): ExecutiveGraphNode {
  const existing = map.get(node.id);
  if (!existing) {
    map.set(node.id, node);
    return node;
  }
  const merged: ExecutiveGraphNode = {
    ...existing,
    ...node,
    metadata: { ...existing.metadata, ...node.metadata },
    value: node.value ?? existing.value,
    status: node.status ?? existing.status,
  };
  map.set(merged.id, merged);
  return merged;
}

export function getNodeByKey(
  nodes: Iterable<ExecutiveGraphNode>,
  type: ExecutiveGraphNodeType,
  key: string
): ExecutiveGraphNode | undefined {
  const id = nodeId(type, key);
  for (const node of nodes) {
    if (node.id === id) return node;
  }
  return undefined;
}
