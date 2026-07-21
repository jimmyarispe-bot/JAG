/**
 * Lineage — provenance by sourceSystem / domain / connector.
 */

import type { UnifiedGraphSnapshot } from "@/lib/platform/knowledge-graph/graph-store/store";

export type LineageSlice = {
  key: string;
  domain?: string;
  sourceSystem?: string;
  nodeCount: number;
  edgeCount: number;
};

export function buildGraphLineage(graph: UnifiedGraphSnapshot): LineageSlice[] {
  const byKey = new Map<string, LineageSlice>();

  for (const n of graph.nodes) {
    const key = `${n.domain ?? "unknown"}::${n.sourceSystem ?? "unknown"}`;
    const slice = byKey.get(key) ?? {
      key,
      domain: n.domain,
      sourceSystem: n.sourceSystem,
      nodeCount: 0,
      edgeCount: 0,
    };
    slice.nodeCount += 1;
    byKey.set(key, slice);
  }

  for (const e of graph.edges) {
    const key = `${e.domain ?? "unknown"}::unknown`;
    const slice = byKey.get(key) ?? {
      key,
      domain: e.domain,
      nodeCount: 0,
      edgeCount: 0,
    };
    slice.edgeCount += 1;
    byKey.set(key, slice);
  }

  return [...byKey.values()].sort((a, b) => b.nodeCount - a.nodeCount);
}
