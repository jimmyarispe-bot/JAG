import { getNode, putNode } from "@/lib/platform/graph/registry";
import type { GraphNode, GraphNodeKind, GraphSource } from "@/lib/platform/graph/types";

export function nodeId(kind: GraphNodeKind, key: string): string {
  return `${kind}:${key.trim()}`;
}

export function parseNodeId(id: string): { kind: string; key: string } | null {
  const idx = id.indexOf(":");
  if (idx <= 0) return null;
  return { kind: id.slice(0, idx), key: id.slice(idx + 1) };
}

export function createNode(input: {
  kind: GraphNodeKind;
  key: string;
  label?: string;
  applicationId?: string | null;
  organizationId?: string | null;
  source?: GraphSource;
  stub?: boolean;
  metadata?: Record<string, unknown>;
}): GraphNode {
  const key = input.key.trim();
  if (!key) throw new Error("Graph node key is required");
  const id = nodeId(input.kind, key);
  return {
    id,
    kind: input.kind,
    key,
    label: (input.label ?? key).trim(),
    applicationId: input.applicationId ?? null,
    organizationId: input.organizationId ?? null,
    source: input.source ?? "manual",
    stub: input.stub,
    metadata: { ...(input.metadata ?? {}) },
  };
}

export function upsertNode(
  input: Parameters<typeof createNode>[0]
): GraphNode {
  const next = createNode(input);
  const existing = getNode(next.id);
  if (!existing) return putNode(next);
  return putNode({
    ...existing,
    ...next,
    metadata: { ...existing.metadata, ...next.metadata },
    stub: next.stub ?? existing.stub,
  });
}

export function ensureNode(
  kind: GraphNodeKind,
  key: string,
  extras?: Partial<Omit<Parameters<typeof createNode>[0], "kind" | "key">>
): GraphNode {
  const id = nodeId(kind, key);
  const existing = getNode(id);
  if (existing) return existing;
  return upsertNode({
    kind,
    key,
    source: extras?.source ?? "reflection",
    stub: extras?.stub,
    label: extras?.label,
    applicationId: extras?.applicationId,
    organizationId: extras?.organizationId,
    metadata: extras?.metadata,
  });
}
