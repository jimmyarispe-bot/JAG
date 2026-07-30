/**
 * GraphBuilder — application-layer reasoning graph — Sprint 208.
 * Lazy relationships, depth-limited, cycle-safe. Not a graph DB.
 */

import type {
  ExplainEdge,
  ExplainGraph,
  ExplainNode,
  ExplainNodeKind,
  GraphQuery,
} from "./types";
import { recordExplainObservation } from "./ExplainabilityObservability";

export type GraphSeed = {
  readonly nodes: readonly ExplainNode[];
  readonly edges: readonly ExplainEdge[];
};

const ADVISORY =
  "Intelligence Graph Explorer — executive reasoning map. Advisory relationships from bound services, not a graph database.";

function matchesQuery(node: ExplainNode, query: GraphQuery): boolean {
  if (query.organizationId && node.organizationId && node.organizationId !== query.organizationId) {
    return false;
  }
  if (query.kinds?.length && !query.kinds.includes(node.kind)) {
    return false;
  }
  if (query.capabilityId) {
    const cap = node.metadata?.capabilityId ?? node.tags?.join(" ") ?? "";
    if (!cap.includes(query.capabilityId) && node.kind !== "capability") {
      // allow non-capability nodes unless filtering capabilities only
      if (query.kinds?.length === 1 && query.kinds[0] === "capability") return false;
    }
  }
  if (query.fromDate && node.createdAt && node.createdAt.slice(0, 10) < query.fromDate) {
    return false;
  }
  if (query.toDate && node.createdAt && node.createdAt.slice(0, 10) > query.toDate) {
    return false;
  }
  if (query.q) {
    const q = query.q.trim().toLowerCase();
    const hay = `${node.label} ${node.summary} ${node.kind} ${(node.tags ?? []).join(" ")}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

export function buildExplainGraph(
  seed: GraphSeed,
  query: GraphQuery = {}
): ExplainGraph {
  const started = Date.now();
  const depth = Math.max(1, Math.min(4, query.depth ?? 2));
  const limit = Math.max(10, Math.min(120, query.limit ?? 60));

  const byId = new Map(seed.nodes.map((n) => [n.id, n]));
  const adj = new Map<string, string[]>();
  for (const e of seed.edges) {
    const a = adj.get(e.fromId) ?? [];
    a.push(e.toId);
    adj.set(e.fromId, a);
    const b = adj.get(e.toId) ?? [];
    b.push(e.fromId);
    adj.set(e.toId, b);
  }

  let focusId = query.focusNodeId ?? null;
  if (focusId && !byId.has(focusId)) focusId = null;

  const filtered = seed.nodes.filter((n) => matchesQuery(n, query));
  const include = new Set<string>();
  const queue: { id: string; d: number }[] = [];

  if (focusId) {
    queue.push({ id: focusId, d: 0 });
    include.add(focusId);
  } else {
    for (const n of filtered.slice(0, limit)) {
      queue.push({ id: n.id, d: 0 });
      include.add(n.id);
    }
  }

  const visited = new Set<string>();
  while (queue.length > 0 && include.size < limit) {
    const cur = queue.shift()!;
    if (visited.has(cur.id) || cur.d >= depth) continue;
    visited.add(cur.id);
    for (const next of adj.get(cur.id) ?? []) {
      if (include.has(next) || !byId.has(next)) continue;
      const node = byId.get(next)!;
      if (query.organizationId && node.organizationId && node.organizationId !== query.organizationId) {
        continue;
      }
      include.add(next);
      queue.push({ id: next, d: cur.d + 1 });
      if (include.size >= limit) break;
    }
  }

  const nodes = [...include]
    .map((id) => byId.get(id)!)
    .filter(Boolean)
    .sort((a, b) => a.label.localeCompare(b.label));

  const edges = seed.edges.filter(
    (e) => include.has(e.fromId) && include.has(e.toId)
  );

  const breadcrumb: { id: string; label: string }[] = [];
  if (focusId) {
    const focus = byId.get(focusId);
    if (focus) breadcrumb.push({ id: focus.id, label: focus.label });
  }

  const truncated = seed.nodes.length > nodes.length || edges.length < seed.edges.length;

  recordExplainObservation({
    kind: "graph_query",
    organizationId: query.organizationId ?? null,
    durationMs: Date.now() - started,
    detail: `Graph query returned ${nodes.length} node(s), ${edges.length} edge(s)${truncated ? " (truncated)" : ""}.`,
    subjectId: focusId ?? undefined,
    metadata: {
      depth: String(depth),
      q: query.q ?? "",
    },
  });

  recordExplainObservation({
    kind: "reasoning_traversal",
    organizationId: query.organizationId ?? null,
    durationMs: Date.now() - started,
    detail: `Traversal depth ${depth}, visited ${visited.size}.`,
    subjectId: focusId ?? undefined,
  });

  return {
    nodes,
    edges,
    focusNodeId: focusId,
    breadcrumb,
    truncated,
    advisoryNotice: ADVISORY,
  };
}

export function nodeKindLabel(kind: ExplainNodeKind): string {
  return kind.replace(/_/g, " ");
}
