/**
 * Executive relationship graph — contacts, companies, opportunities, activities.
 */

import type { CrmCanonicalEntity } from "@/lib/platform/integrations/connectors/crm/entities";
import { buildCrmKnowledgeGraph } from "@/lib/platform/integrations/connectors/crm/mapping";
import { crmStore } from "@/lib/platform/integrations/connectors/crm/services/store";

export type RelationshipGraphNode = {
  id: string;
  kind: string;
  label: string;
  provider?: string;
};

export type RelationshipGraphEdge = {
  id: string;
  type: string;
  from: string;
  to: string;
};

export type ExecutiveRelationshipGraph = {
  organizationId: string;
  builtAt: string;
  nodes: RelationshipGraphNode[];
  edges: RelationshipGraphEdge[];
  providersConnected: string[];
  density: number;
};

export function buildExecutiveRelationshipGraph(
  organizationId: string,
  records?: readonly CrmCanonicalEntity[]
): ExecutiveRelationshipGraph | null {
  const rows = records ?? crmStore.allRecords(organizationId);
  if (!rows.length) return null;

  const kg = buildCrmKnowledgeGraph(rows);
  const nodes: RelationshipGraphNode[] = kg.nodes.map((n) => ({
    id: n.nodeId,
    kind: n.entityType,
    label: n.label,
    provider: typeof n.properties.provider === "string" ? n.properties.provider : undefined,
  }));
  const edges: RelationshipGraphEdge[] = kg.relationships.map((r) => ({
    id: r.relationshipId,
    type: r.type,
    from: r.fromNodeId,
    to: r.toNodeId,
  }));

  const maxEdges = Math.max(nodes.length * (nodes.length - 1), 1);
  const density = Math.round((edges.length / maxEdges) * 1000) / 10;

  return {
    organizationId,
    builtAt: new Date().toISOString(),
    nodes,
    edges,
    providersConnected: [...new Set(rows.map((r) => r.sourceSystem))],
    density,
  };
}
