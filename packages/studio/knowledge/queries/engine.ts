/**
 * Deterministic Knowledge Graph query engine.
 */

import { buildKnowledgeGraph } from "../graph/builder";
import type { KnowledgeGraph } from "../graph/types";
import type { KnowledgeEdge } from "../edges/types";
import type { KnowledgeNode, KnowledgeNodeKind } from "../nodes/types";

function graphOf(root?: string, force?: boolean): KnowledgeGraph {
  return buildKnowledgeGraph({ root, force });
}

export function findNode(
  id: string,
  root?: string
): KnowledgeNode | null {
  return graphOf(root).nodes.find((n) => n.id === id) ?? null;
}

export function findNeighbors(
  id: string,
  root?: string,
  direction: "in" | "out" | "both" = "both"
): readonly {
  readonly edge: KnowledgeEdge;
  readonly node: KnowledgeNode;
}[] {
  const g = graphOf(root);
  const out: { edge: KnowledgeEdge; node: KnowledgeNode }[] = [];
  for (const e of g.edges) {
    if (direction !== "in" && e.from === id) {
      const node = g.nodes.find((n) => n.id === e.to);
      if (node) out.push({ edge: e, node });
    }
    if (direction !== "out" && e.to === id) {
      const node = g.nodes.find((n) => n.id === e.from);
      if (node) out.push({ edge: e, node });
    }
  }
  return Object.freeze(
    out.sort((a, b) => a.node.id.localeCompare(b.node.id))
  );
}

/** BFS shortest path — deterministic (lexicographic neighbor order). */
export function findPath(
  fromId: string,
  toId: string,
  root?: string,
  maxDepth = 8
): readonly string[] | null {
  const g = graphOf(root);
  if (!g.nodes.some((n) => n.id === fromId) || !g.nodes.some((n) => n.id === toId)) {
    return null;
  }
  if (fromId === toId) return Object.freeze([fromId]);

  const adj = new Map<string, string[]>();
  for (const e of g.edges) {
    const list = adj.get(e.from) ?? [];
    list.push(e.to);
    adj.set(e.from, list);
    const back = adj.get(e.to) ?? [];
    back.push(e.from);
    adj.set(e.to, back);
  }
  for (const [k, v] of adj) adj.set(k, [...new Set(v)].sort());

  const queue: string[][] = [[fromId]];
  const visited = new Set<string>([fromId]);
  while (queue.length) {
    const path = queue.shift()!;
    if (path.length > maxDepth + 1) continue;
    const last = path[path.length - 1]!;
    for (const next of adj.get(last) ?? []) {
      if (visited.has(next)) continue;
      const nextPath = [...path, next];
      if (next === toId) return Object.freeze(nextPath);
      visited.add(next);
      queue.push(nextPath);
    }
  }
  return null;
}

export function findDependents(
  id: string,
  root?: string
): readonly KnowledgeNode[] {
  const g = graphOf(root);
  const ids = new Set(
    g.edges
      .filter(
        (e) =>
          e.to === id &&
          (e.kind === "DEPENDS_ON" ||
            e.kind === "CONSUMES" ||
            e.kind === "USES" ||
            e.kind === "REFERENCES" ||
            e.kind === "VALIDATES")
      )
      .map((e) => e.from)
  );
  return Object.freeze(
    g.nodes.filter((n) => ids.has(n.id)).sort((a, b) => a.id.localeCompare(b.id))
  );
}

export function findDependencies(
  id: string,
  root?: string
): readonly KnowledgeNode[] {
  const g = graphOf(root);
  const ids = new Set(
    g.edges
      .filter(
        (e) =>
          e.from === id &&
          (e.kind === "DEPENDS_ON" ||
            e.kind === "CONSUMES" ||
            e.kind === "USES" ||
            e.kind === "OWNED_BY")
      )
      .map((e) => e.to)
  );
  return Object.freeze(
    g.nodes.filter((n) => ids.has(n.id)).sort((a, b) => a.id.localeCompare(b.id))
  );
}

export function findDocumentation(
  targetId: string,
  root?: string
): readonly KnowledgeNode[] {
  const g = graphOf(root);
  const docs = g.edges
    .filter(
      (e) =>
        (e.to === targetId || e.from === targetId) &&
        (e.kind === "DESCRIBES" || e.kind === "DOCUMENTS")
    )
    .flatMap((e) => [e.from, e.to]);
  const ids = new Set(docs);
  return Object.freeze(
    g.nodes
      .filter((n) => n.kind === "document" && (ids.has(n.id) || n.id === targetId))
      .sort((a, b) => a.id.localeCompare(b.id))
  );
}

export function findTests(
  targetId: string,
  root?: string
): readonly KnowledgeNode[] {
  const g = graphOf(root);
  const ids = new Set(
    g.edges
      .filter(
        (e) =>
          (e.to === targetId && e.kind === "VALIDATES") ||
          (e.from === targetId && e.kind === "VALIDATED_BY")
      )
      .map((e) => (e.to === targetId ? e.from : e.to))
  );
  return Object.freeze(
    g.nodes
      .filter(
        (n) =>
          (n.kind === "test" || n.kind === "test_suite") && ids.has(n.id)
      )
      .sort((a, b) => a.id.localeCompare(b.id))
  );
}

export function findPERs(
  targetId?: string,
  root?: string
): readonly KnowledgeNode[] {
  const g = graphOf(root);
  if (!targetId) {
    return Object.freeze(
      g.nodes
        .filter((n) => n.kind === "per")
        .sort((a, b) => a.id.localeCompare(b.id))
    );
  }
  const ids = new Set(
    g.edges
      .filter(
        (e) =>
          e.kind === "REFERENCES" &&
          (e.from === targetId || e.to === targetId)
      )
      .flatMap((e) => [e.from, e.to])
  );
  return Object.freeze(
    g.nodes
      .filter((n) => n.kind === "per" && ids.has(n.id))
      .sort((a, b) => a.id.localeCompare(b.id))
  );
}

export function findProducts(root?: string): readonly KnowledgeNode[] {
  return Object.freeze(
    graphOf(root)
      .nodes.filter((n) => n.kind === "product")
      .sort((a, b) => a.id.localeCompare(b.id))
  );
}

export function searchGraph(input: {
  q: string;
  kinds?: readonly KnowledgeNodeKind[];
  root?: string;
  limit?: number;
}): readonly {
  readonly node: KnowledgeNode;
  readonly score: number;
}[] {
  const g = graphOf(input.root);
  const tokens = input.q
    .toLowerCase()
    .split(/[^a-z0-9.-]+/)
    .filter((t) => t.length > 1)
    .sort(); // deterministic
  const hits: { node: KnowledgeNode; score: number }[] = [];
  for (const node of g.nodes) {
    if (input.kinds && !input.kinds.includes(node.kind)) continue;
    let score = 0;
    const hay = [
      node.id,
      node.label,
      node.path ?? "",
      node.ownerPackage ?? "",
      ...node.keywords,
      ...Object.values(node.metadata),
    ]
      .join(" ")
      .toLowerCase();
    for (const t of tokens) {
      if (node.id.toLowerCase() === t || node.label.toLowerCase() === t) score += 20;
      else if (node.id.toLowerCase().includes(t)) score += 12;
      else if (node.label.toLowerCase().includes(t)) score += 10;
      else if (hay.includes(t)) score += 6;
    }
    if (score > 0) hits.push({ node, score });
  }
  hits.sort(
    (a, b) => b.score - a.score || a.node.id.localeCompare(b.node.id)
  );
  return Object.freeze(hits.slice(0, input.limit ?? 40));
}

export function createKnowledgeQueryEngine() {
  return {
    findNode,
    findNeighbors,
    findPath,
    findDependents,
    findDependencies,
    findDocumentation,
    findTests,
    findPERs,
    findProducts,
    searchGraph,
  };
}
