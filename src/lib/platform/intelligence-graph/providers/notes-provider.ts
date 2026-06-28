import { getEntityNotes } from "@/lib/platform/notes/query";
import type {
  EdgeResolveOptions,
  GraphEdge,
  GraphNode,
  GraphProvider,
  GraphProviderContext,
  GraphSearchQuery,
} from "@/lib/platform/intelligence-graph/types";
import { buildGraphNodeId } from "@/lib/platform/intelligence-graph/utils";

/** Graph provider backed by the Notes Engine — links notes to their subject entities. */
export const notesGraphProvider: GraphProvider = {
  providerKey: "notes",

  async resolveNode(
    _ctx: GraphProviderContext,
    entityType: string,
    entityId: string
  ): Promise<GraphNode | null> {
    if (entityType !== "note" || !entityId) return null;

    return {
      nodeId: buildGraphNodeId("note", entityType, entityId),
      nodeType: "note",
      entityType,
      entityId,
      organizationId: null,
      schoolId: null,
      metadata: { providerKey: "notes" },
    };
  },

  async resolveEdges(
    ctx: GraphProviderContext,
    node: GraphNode,
    _options?: EdgeResolveOptions
  ): Promise<GraphEdge[]> {
    if (node.nodeType === "entity") {
      const notes = await getEntityNotes(ctx.supabase, node.entityType, node.entityId, {
        limit: 50,
      });

      return notes.map((note) => ({
        edgeType: "note.attached_to",
        sourceNode: buildGraphNodeId("note", "note", note.id),
        targetNode: node.nodeId,
        direction: "directed" as const,
        weight: note.is_pinned ? 0.5 : 0.25,
        effectiveDate: note.created_at,
        endDate: null,
        metadata: {
          providerKey: "notes",
          noteId: note.id,
          category: note.category,
          visibility: note.visibility,
        },
      }));
    }

    if (node.nodeType === "note") {
      const { data } = await ctx.supabase
        .from("platform_notes")
        .select("id, entity_type, entity_id, organization_id, school_id, created_at, category")
        .eq("id", node.entityId)
        .eq("is_deleted", false)
        .maybeSingle();

      if (!data) return [];

      return [
        {
          edgeType: "note.attached_to",
          sourceNode: node.nodeId,
          targetNode: buildGraphNodeId("entity", data.entity_type, data.entity_id),
          direction: "directed",
          weight: 0.25,
          effectiveDate: data.created_at,
          endDate: null,
          metadata: {
            providerKey: "notes",
            noteId: data.id,
            category: data.category,
            organizationId: data.organization_id,
            schoolId: data.school_id,
          },
        },
      ];
    }

    return [];
  },

  async searchNodes(ctx: GraphProviderContext, query: GraphSearchQuery): Promise<GraphNode[]> {
    const needle = query.query.toLowerCase();
    if (!needle) return [];

    let q = ctx.supabase
      .from("platform_notes")
      .select("id, entity_type, entity_id, organization_id, school_id, body, category")
      .eq("is_deleted", false)
      .ilike("body", `%${needle}%`)
      .limit(query.limit ?? 20);

    if (query.organizationId) q = q.eq("organization_id", query.organizationId);

    const { data } = await q;

    return (data ?? []).map((row) => ({
      nodeId: buildGraphNodeId("note", "note", row.id),
      nodeType: "note",
      entityType: "note",
      entityId: row.id,
      organizationId: row.organization_id,
      schoolId: row.school_id,
      metadata: {
        providerKey: "notes",
        category: row.category,
        subjectEntityType: row.entity_type,
        subjectEntityId: row.entity_id,
      },
    }));
  },
};
