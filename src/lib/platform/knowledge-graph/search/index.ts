/**
 * Label / property search over the unified graph.
 */

import type { UnifiedGraphSnapshot } from "@/lib/platform/knowledge-graph/graph-store/store";
import type { UnifiedGraphNode } from "@/lib/platform/knowledge-graph/entities/types";
import type { UnifiedEntityType } from "@/lib/platform/knowledge-graph/ontology/kinds";

export type GraphSearchQuery = {
  q?: string;
  kinds?: UnifiedEntityType[];
  domain?: string;
  limit?: number;
};

export function searchUnifiedGraph(
  graph: UnifiedGraphSnapshot,
  query: GraphSearchQuery
): UnifiedGraphNode[] {
  const q = (query.q ?? "").trim().toLowerCase();
  const kinds = query.kinds ? new Set(query.kinds) : null;
  const limit = query.limit ?? 50;

  return graph.nodes
    .filter((n) => {
      if (kinds && !kinds.has(n.kind)) return false;
      if (query.domain && n.domain !== query.domain) return false;
      if (!q) return true;
      const hay = `${n.label} ${n.kind} ${n.externalId ?? ""} ${n.canonicalType ?? ""}`.toLowerCase();
      return hay.includes(q);
    })
    .slice(0, limit);
}
