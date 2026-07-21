/**
 * ECC widget data from the unified knowledge graph (soft-read only).
 */

import { softReadOrganizationalGraph } from "@/lib/platform/knowledge-graph/api/soft-read";
import { ENTITY_DISPLAY_LABEL } from "@/lib/platform/knowledge-graph/ontology/kinds";

export type OrganizationalGraphWidget = {
  kind: "organizational_graph";
  title: string;
  nodeCount: number;
  edgeCount: number;
  domainsConnected: string[];
  kindsPresent: string[];
  relationshipTypesPresent: string[];
  topKinds: Array<{ kind: string; label: string; count: number }>;
};

export type KnowledgeGraphEccWidgets = {
  organizationalGraph: OrganizationalGraphWidget;
};

export function buildKnowledgeGraphEccWidgets(
  organizationId: string
): KnowledgeGraphEccWidgets | null {
  const soft = softReadOrganizationalGraph(organizationId);
  if (!soft) return null;

  const byKind = new Map<string, number>();
  for (const n of soft.graph.nodes) {
    byKind.set(n.kind, (byKind.get(n.kind) ?? 0) + 1);
  }
  const topKinds = [...byKind.entries()]
    .map(([kind, count]) => ({
      kind,
      label:
        ENTITY_DISPLAY_LABEL[kind as keyof typeof ENTITY_DISPLAY_LABEL] ?? kind,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    organizationalGraph: {
      kind: "organizational_graph",
      title: "Organizational Graph",
      nodeCount: soft.counts.nodes,
      edgeCount: soft.counts.edges,
      domainsConnected: soft.graph.domainsConnected,
      kindsPresent: soft.graph.kindsPresent,
      relationshipTypesPresent: soft.graph.relationshipTypesPresent,
      topKinds,
    },
  };
}
