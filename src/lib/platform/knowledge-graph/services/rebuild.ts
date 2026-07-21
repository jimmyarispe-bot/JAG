/**
 * Rebuild the unified organizational graph from connector canonical stores.
 */

import { collectDomainBundles } from "@/lib/platform/knowledge-graph/services/adapters";
import { mergeBundles } from "@/lib/platform/knowledge-graph/graph-store/ingest";
import {
  unifiedGraphStore,
  type UnifiedGraphSnapshot,
} from "@/lib/platform/knowledge-graph/graph-store/store";

export function rebuildUnifiedKnowledgeGraph(
  organizationId: string
): UnifiedGraphSnapshot | null {
  const bundles = collectDomainBundles(organizationId);
  if (!bundles.length) {
    unifiedGraphStore.clear(organizationId);
    return null;
  }

  const merged = mergeBundles(organizationId, bundles);
  const snapshot: UnifiedGraphSnapshot = {
    organizationId,
    builtAt: new Date().toISOString(),
    nodes: merged.nodes,
    edges: merged.edges,
    domainsConnected: merged.domains,
    kindsPresent: [...new Set(merged.nodes.map((n) => n.kind))],
    relationshipTypesPresent: [...new Set(merged.edges.map((e) => e.type))],
  };

  return unifiedGraphStore.replace(snapshot);
}

/** Soft-read: return cached graph or rebuild from canonical stores. */
export function getOrBuildUnifiedKnowledgeGraph(
  organizationId: string
): UnifiedGraphSnapshot | null {
  const cached = unifiedGraphStore.get(organizationId);
  if (cached?.nodes.length) return cached;
  return rebuildUnifiedKnowledgeGraph(organizationId);
}
