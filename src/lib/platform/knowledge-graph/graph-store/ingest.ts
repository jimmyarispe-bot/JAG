import type { ConnectorGraphNodeInput } from "@/lib/platform/knowledge-graph/entities/types";
import type { ConnectorGraphEdgeInput } from "@/lib/platform/knowledge-graph/relationships/types";
import { resolveUnifiedEntityType } from "@/lib/platform/knowledge-graph/ontology/aliases";
import { normalizeRelationshipType } from "@/lib/platform/knowledge-graph/relationships/normalize";
import type { UnifiedGraphNode } from "@/lib/platform/knowledge-graph/entities/types";
import type { UnifiedGraphEdge } from "@/lib/platform/knowledge-graph/relationships/types";

export type DomainGraphBundle = {
  domain: string;
  nodes: ConnectorGraphNodeInput[];
  edges: ConnectorGraphEdgeInput[];
};

export function normalizeDomainBundle(
  organizationId: string,
  bundle: DomainGraphBundle
): { nodes: UnifiedGraphNode[]; edges: UnifiedGraphEdge[] } {
  const nodes: UnifiedGraphNode[] = bundle.nodes.map((n) => {
    const props = n.properties ?? {};
    return {
      id: n.nodeId,
      kind: resolveUnifiedEntityType(n.entityType, props),
      label: n.label,
      organizationId,
      sourceSystem:
        typeof props.provider === "string"
          ? props.provider
          : typeof props.sourceSystem === "string"
            ? props.sourceSystem
            : undefined,
      connectorId:
        typeof props.provider === "string" ? props.provider : bundle.domain,
      externalId:
        typeof props.externalId === "string"
          ? props.externalId
          : n.sourceEntityId,
      canonicalType:
        typeof props.canonicalType === "string" ? props.canonicalType : undefined,
      properties: props,
      syncedAt: typeof props.syncedAt === "string" ? props.syncedAt : undefined,
      domain: bundle.domain,
    };
  });

  const edges: UnifiedGraphEdge[] = bundle.edges.map((e) => ({
    id: e.relationshipId,
    type: normalizeRelationshipType(e.type),
    from: e.fromNodeId,
    to: e.toNodeId,
    organizationId,
    originalType: e.type,
    properties: e.properties,
    domain: bundle.domain,
  }));

  return { nodes, edges };
}

export function mergeBundles(
  organizationId: string,
  bundles: DomainGraphBundle[]
): { nodes: UnifiedGraphNode[]; edges: UnifiedGraphEdge[]; domains: string[] } {
  const nodeMap = new Map<string, UnifiedGraphNode>();
  const edgeMap = new Map<string, UnifiedGraphEdge>();
  const domains: string[] = [];

  for (const bundle of bundles) {
    if (!bundle.nodes.length && !bundle.edges.length) continue;
    domains.push(bundle.domain);
    const normalized = normalizeDomainBundle(organizationId, bundle);
    for (const node of normalized.nodes) {
      const existing = nodeMap.get(node.id);
      if (!existing) {
        nodeMap.set(node.id, node);
        continue;
      }
      // Prefer more specific kinds over Document/Organization catch-alls.
      const specificity = (k: string) =>
        ["Teacher", "Student", "Employee", "Parent", "Department", "Class", "Course"].includes(
          k
        )
          ? 2
          : k === "Organization" || k === "Person" || k === "Document"
            ? 0
            : 1;
      if (specificity(node.kind) >= specificity(existing.kind)) {
        nodeMap.set(node.id, {
          ...existing,
          ...node,
          properties: { ...existing.properties, ...node.properties },
        });
      }
    }
    for (const edge of normalized.edges) {
      edgeMap.set(edge.id, edge);
    }
  }

  return {
    nodes: [...nodeMap.values()],
    edges: [...edgeMap.values()],
    domains: [...new Set(domains)],
  };
}
