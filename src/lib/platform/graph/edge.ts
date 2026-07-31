import { getEdge, getNode, putEdge } from "@/lib/platform/graph/registry";
import type { GraphEdge, GraphEdgeType, GraphSource } from "@/lib/platform/graph/types";

export function edgeId(
  type: GraphEdgeType,
  from: string,
  to: string
): string {
  return `${type}:${from}->${to}`;
}

export function createEdge(input: {
  type: GraphEdgeType;
  from: string;
  to: string;
  source?: GraphSource;
  label?: string | null;
  metadata?: Record<string, unknown>;
}): GraphEdge {
  if (!input.from.trim() || !input.to.trim()) {
    throw new Error("Graph edge requires from and to node ids");
  }
  return {
    id: edgeId(input.type, input.from.trim(), input.to.trim()),
    type: input.type,
    from: input.from.trim(),
    to: input.to.trim(),
    source: input.source ?? "manual",
    label: input.label ?? null,
    metadata: { ...(input.metadata ?? {}) },
  };
}

export function upsertEdge(
  input: Parameters<typeof createEdge>[0]
): GraphEdge {
  const next = createEdge(input);
  const existing = getEdge(next.id);
  if (!existing) return putEdge(next);
  return putEdge({
    ...existing,
    ...next,
    metadata: { ...existing.metadata, ...next.metadata },
  });
}

/**
 * Create an edge only when both endpoints exist (or optionally ensure stubs).
 */
export function linkNodes(
  type: GraphEdgeType,
  from: string,
  to: string,
  options?: {
    source?: GraphSource;
    label?: string | null;
    metadata?: Record<string, unknown>;
    requireNodes?: boolean;
  }
): GraphEdge | null {
  if (options?.requireNodes !== false) {
    if (!getNode(from) || !getNode(to)) return null;
  }
  return upsertEdge({
    type,
    from,
    to,
    source: options?.source ?? "reflection",
    label: options?.label,
    metadata: options?.metadata,
  });
}
