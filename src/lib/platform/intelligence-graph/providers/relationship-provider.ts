import { getRelationshipsFrom, getRelationshipsTo } from "@/lib/platform/relationships/query";
import type {
  EdgeResolveOptions,
  GraphEdge,
  GraphNode,
  GraphProvider,
  GraphProviderContext,
} from "@/lib/platform/intelligence-graph/types";
import { buildGraphNodeId } from "@/lib/platform/intelligence-graph/utils";

function relationshipToEdge(
  rel: {
    relationship_type: string;
    from_entity_type: string;
    from_entity_id: string;
    to_entity_type: string;
    to_entity_id: string;
    effective_date: string | null;
    end_date: string | null;
    metadata: Record<string, unknown>;
    organization_id: string;
    school_id: string | null;
  },
  direction: "outgoing" | "incoming"
): GraphEdge {
  const sourceNode = buildGraphNodeId("entity", rel.from_entity_type, rel.from_entity_id);
  const targetNode = buildGraphNodeId("entity", rel.to_entity_type, rel.to_entity_id);

  return {
    edgeType: "relationship",
    sourceNode: direction === "incoming" ? targetNode : sourceNode,
    targetNode: direction === "incoming" ? sourceNode : targetNode,
    direction: "directed",
    weight: rel.metadata?.isPrimary === true ? 2 : 1,
    effectiveDate: rel.effective_date,
    endDate: rel.end_date,
    metadata: {
      providerKey: "relationship",
      relationshipType: rel.relationship_type,
      relationshipId: rel.metadata?.id,
      organizationId: rel.organization_id,
      schoolId: rel.school_id,
      ...rel.metadata,
    },
  };
}

/** Primary graph provider — sources entity nodes and relationship edges from the Relationship Engine. */
export const relationshipGraphProvider: GraphProvider = {
  providerKey: "relationship",

  async resolveNode(
    ctx: GraphProviderContext,
    entityType: string,
    entityId: string
  ): Promise<GraphNode | null> {
    if (!entityType || !entityId) return null;

    return {
      nodeId: buildGraphNodeId("entity", entityType, entityId),
      nodeType: "entity",
      entityType,
      entityId,
      organizationId: ctx.organizationId ?? null,
      schoolId: ctx.schoolId ?? null,
      metadata: { providerKey: "relationship" },
    };
  },

  async resolveEdges(
    ctx: GraphProviderContext,
    node: GraphNode,
    options?: EdgeResolveOptions
  ): Promise<GraphEdge[]> {
    if (node.nodeType !== "entity") return [];

    const direction = options?.direction ?? "both";
    const edges: GraphEdge[] = [];

    if (direction === "outgoing" || direction === "both") {
      const outgoing = await getRelationshipsFrom(
        ctx.supabase,
        node.entityType,
        node.entityId
      );
      for (const rel of outgoing) {
        edges.push(
          relationshipToEdge(
            {
              ...rel,
              metadata: { ...rel.metadata, id: rel.id },
            },
            "outgoing"
          )
        );
      }
    }

    if (direction === "incoming" || direction === "both") {
      const incoming = await getRelationshipsTo(
        ctx.supabase,
        node.entityType,
        node.entityId
      );
      for (const rel of incoming) {
        edges.push(
          relationshipToEdge(
            {
              ...rel,
              metadata: { ...rel.metadata, id: rel.id },
            },
            "incoming"
          )
        );
      }
    }

    return edges;
  },

  async searchNodes(ctx, query) {
    const needle = query.query.toLowerCase();
    if (!needle || needle.length < 2) return [];

    const entityTypes = query.entityTypes
      ? Array.isArray(query.entityTypes)
        ? query.entityTypes
        : [query.entityTypes]
      : ["student", "employee", "family"];

    const nodes: GraphNode[] = [];

    for (const entityType of entityTypes) {
      const table =
        entityType === "admissions_lead"
          ? "admissions_leads"
          : entityType === "employee"
            ? "employees"
            : `${entityType}s`;

      const { data } = await ctx.supabase
        .from(table)
        .select("id, organization_id, school_id, full_name, name, first_name, last_name")
        .limit(query.limit ?? 20);

      for (const row of data ?? []) {
        const label =
          (row as { full_name?: string }).full_name ??
          (row as { name?: string }).name ??
          [(row as { first_name?: string }).first_name, (row as { last_name?: string }).last_name]
            .filter(Boolean)
            .join(" ");

        if (!label.toLowerCase().includes(needle)) continue;

        nodes.push({
          nodeId: buildGraphNodeId("entity", entityType, row.id),
          nodeType: "entity",
          entityType,
          entityId: row.id,
          organizationId: row.organization_id ?? ctx.organizationId ?? null,
          schoolId: row.school_id ?? ctx.schoolId ?? null,
          metadata: { providerKey: "relationship", label },
        });
      }
    }

    return nodes;
  },
};
