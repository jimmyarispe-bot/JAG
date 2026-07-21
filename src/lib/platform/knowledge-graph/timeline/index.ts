/**
 * Timeline — syncedAt-ordered view of graph nodes.
 */

import type { UnifiedGraphSnapshot } from "@/lib/platform/knowledge-graph/graph-store/store";
import type { UnifiedGraphNode } from "@/lib/platform/knowledge-graph/entities/types";

export type TimelineEntry = {
  at: string;
  nodeId: string;
  kind: string;
  label: string;
  domain?: string;
  sourceSystem?: string;
};

export function buildGraphTimeline(
  graph: UnifiedGraphSnapshot,
  limit = 100
): TimelineEntry[] {
  return graph.nodes
    .map((n: UnifiedGraphNode) => ({
      at: n.syncedAt ?? graph.builtAt,
      nodeId: n.id,
      kind: n.kind,
      label: n.label,
      domain: n.domain,
      sourceSystem: n.sourceSystem,
    }))
    .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
    .slice(0, limit);
}
