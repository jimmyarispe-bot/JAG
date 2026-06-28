import { getAllWorkflowDefinitions } from "@/lib/platform/workflow/registry/registry";
import type {
  EdgeResolveOptions,
  GraphEdge,
  GraphNode,
  GraphProvider,
  GraphProviderContext,
  GraphSearchQuery,
} from "@/lib/platform/intelligence-graph/types";
import { buildGraphNodeId } from "@/lib/platform/intelligence-graph/utils";

/** Graph provider backed by the Workflow Engine — links workflow definitions to entity types. */
export const workflowGraphProvider: GraphProvider = {
  providerKey: "workflow",

  async resolveNode(
    _ctx: GraphProviderContext,
    entityType: string,
    entityId: string
  ): Promise<GraphNode | null> {
    if (entityType !== "workflow_instance" || !entityId) return null;

    const definition = getAllWorkflowDefinitions().find((d) => d.workflowKey === entityId);
    if (!definition) return null;

    return {
      nodeId: buildGraphNodeId("workflow_instance", entityType, entityId),
      nodeType: "workflow_instance",
      entityType,
      entityId,
      organizationId: null,
      schoolId: null,
      metadata: {
        providerKey: "workflow",
        workflowKey: definition.workflowKey,
        domain: definition.domain,
      },
    };
  },

  async resolveEdges(
    ctx: GraphProviderContext,
    node: GraphNode,
    _options?: EdgeResolveOptions
  ): Promise<GraphEdge[]> {
    if (node.nodeType === "entity") {
      const { data } = await ctx.supabase
        .from("platform_workflow_instances")
        .select("id, workflow_key, entity_type, entity_id, created_at, organization_id, school_id")
        .eq("entity_type", node.entityType)
        .eq("entity_id", node.entityId)
        .limit(50);

      return (data ?? []).map((instance) => ({
        edgeType: "workflow.assigned_to",
        sourceNode: buildGraphNodeId(
          "workflow_instance",
          "workflow_instance",
          instance.workflow_key
        ),
        targetNode: node.nodeId,
        direction: "directed" as const,
        weight: 1,
        effectiveDate: instance.created_at,
        endDate: null,
        metadata: {
          providerKey: "workflow",
          workflowKey: instance.workflow_key,
          instanceId: instance.id,
          organizationId: instance.organization_id,
          schoolId: instance.school_id,
        },
      }));
    }

    if (node.nodeType === "workflow_instance") {
      const definition = getAllWorkflowDefinitions().find(
        (d) => d.workflowKey === node.entityId
      );
      if (!definition?.entityType) return [];

      return [
        {
          edgeType: "workflow.assigned_to",
          sourceNode: node.nodeId,
          targetNode: buildGraphNodeId("entity", definition.entityType, "*"),
          direction: "directed" as const,
          weight: 1,
          effectiveDate: null,
          endDate: null,
          metadata: {
            providerKey: "workflow",
            workflowKey: definition.workflowKey,
            templateEdge: true,
            entityType: definition.entityType,
          },
        },
      ];
    }

    return [];
  },

  async searchNodes(_ctx: GraphProviderContext, query: GraphSearchQuery): Promise<GraphNode[]> {
    const needle = query.query.toLowerCase();
    if (!needle) return [];

    return getAllWorkflowDefinitions()
      .filter(
        (def) =>
          def.workflowKey.toLowerCase().includes(needle) ||
          def.name.toLowerCase().includes(needle)
      )
      .slice(0, query.limit ?? 20)
      .map((def) => ({
        nodeId: buildGraphNodeId("workflow_instance", "workflow_instance", def.workflowKey),
        nodeType: "workflow_instance",
        entityType: "workflow_instance",
        entityId: def.workflowKey,
        organizationId: null,
        schoolId: null,
        metadata: {
          providerKey: "workflow",
          workflowKey: def.workflowKey,
          name: def.name,
          domain: def.domain,
        },
      }));
  },
};
