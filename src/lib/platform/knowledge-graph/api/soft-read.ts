/**
 * Soft-read API for intelligence / ECC — never exposes connector vendor APIs.
 * Consumers import only from `@/lib/platform/knowledge-graph`.
 */

import { getOrBuildUnifiedKnowledgeGraph } from "@/lib/platform/knowledge-graph/services/rebuild";
import type { UnifiedGraphSnapshot } from "@/lib/platform/knowledge-graph/graph-store/store";
import { getNeighborhood, findShortestPath } from "@/lib/platform/knowledge-graph/reasoning/paths";
import { searchUnifiedGraph, type GraphSearchQuery } from "@/lib/platform/knowledge-graph/search";
import { buildGraphTimeline } from "@/lib/platform/knowledge-graph/timeline";
import { buildGraphLineage } from "@/lib/platform/knowledge-graph/lineage";
import type { UnifiedEntityType } from "@/lib/platform/knowledge-graph/ontology/kinds";
import { UNIFIED_ENTITY_TYPES } from "@/lib/platform/knowledge-graph/ontology/kinds";
import { UNIFIED_RELATIONSHIPS } from "@/lib/platform/knowledge-graph/ontology/relationships";

export type OrganizationalGraphSoftRead = {
  sourceSystem: "knowledge-graph";
  live: true;
  organizationId: string;
  graph: UnifiedGraphSnapshot;
  ontology: {
    entityTypes: readonly string[];
    relationships: readonly string[];
  };
  counts: {
    nodes: number;
    edges: number;
    domains: number;
    kinds: number;
  };
};

export function softReadOrganizationalGraph(
  organizationId: string
): OrganizationalGraphSoftRead | null {
  const graph = getOrBuildUnifiedKnowledgeGraph(organizationId);
  if (!graph) return null;

  return {
    sourceSystem: "knowledge-graph",
    live: true,
    organizationId,
    graph,
    ontology: {
      entityTypes: UNIFIED_ENTITY_TYPES,
      relationships: UNIFIED_RELATIONSHIPS,
    },
    counts: {
      nodes: graph.nodes.length,
      edges: graph.edges.length,
      domains: graph.domainsConnected.length,
      kinds: graph.kindsPresent.length,
    },
  };
}

export function softReadNeighborhood(
  organizationId: string,
  nodeId: string,
  depth = 1
) {
  const graph = getOrBuildUnifiedKnowledgeGraph(organizationId);
  if (!graph) return null;
  return getNeighborhood(graph, nodeId, depth);
}

export function softReadPath(
  organizationId: string,
  fromId: string,
  toId: string
) {
  const graph = getOrBuildUnifiedKnowledgeGraph(organizationId);
  if (!graph) return null;
  return findShortestPath(graph, fromId, toId);
}

export function softReadSearch(organizationId: string, query: GraphSearchQuery) {
  const graph = getOrBuildUnifiedKnowledgeGraph(organizationId);
  if (!graph) return [];
  return searchUnifiedGraph(graph, query);
}

export function softReadTimeline(organizationId: string, limit?: number) {
  const graph = getOrBuildUnifiedKnowledgeGraph(organizationId);
  if (!graph) return [];
  return buildGraphTimeline(graph, limit);
}

export function softReadLineage(organizationId: string) {
  const graph = getOrBuildUnifiedKnowledgeGraph(organizationId);
  if (!graph) return [];
  return buildGraphLineage(graph);
}

export function softReadNodesByKind(
  organizationId: string,
  kind: UnifiedEntityType
) {
  return softReadSearch(organizationId, { kinds: [kind], limit: 200 });
}
