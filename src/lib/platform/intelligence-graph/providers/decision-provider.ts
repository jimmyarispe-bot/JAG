import { getAllDecisionDefinitions } from "@/lib/platform/decision/registry/registry";
import type {
  EdgeResolveOptions,
  GraphEdge,
  GraphNode,
  GraphProvider,
  GraphProviderContext,
  GraphSearchQuery,
} from "@/lib/platform/intelligence-graph/types";
import { buildGraphNodeId } from "@/lib/platform/intelligence-graph/utils";

/** Graph provider backed by the Decision Engine — links decision definitions to entity types. */
export const decisionGraphProvider: GraphProvider = {
  providerKey: "decision",

  async resolveNode(
    _ctx: GraphProviderContext,
    entityType: string,
    entityId: string
  ): Promise<GraphNode | null> {
    if (entityType !== "decision_execution" || !entityId) return null;

    const definition = getAllDecisionDefinitions().find((d) => d.decisionType === entityId);
    if (!definition) return null;

    return {
      nodeId: buildGraphNodeId("decision_execution", entityType, entityId),
      nodeType: "decision_execution",
      entityType,
      entityId,
      organizationId: null,
      schoolId: null,
      metadata: {
        providerKey: "decision",
        decisionType: definition.decisionType,
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
      const definitions = getAllDecisionDefinitions().filter((def) => {
        const targetEntityType = def.metadata?.entityType as string | undefined;
        return !targetEntityType || targetEntityType === node.entityType;
      });

      return definitions.map((def) => ({
        edgeType: "decision.targets",
        sourceNode: buildGraphNodeId(
          "decision_execution",
          "decision_execution",
          def.decisionType
        ),
        targetNode: node.nodeId,
        direction: "directed" as const,
        weight: 1,
        effectiveDate: null,
        endDate: null,
        metadata: {
          providerKey: "decision",
          decisionType: def.decisionType,
          engineMode: def.engineMode,
        },
      }));
    }

    if (node.nodeType === "decision_execution") {
      const definition = getAllDecisionDefinitions().find(
        (d) => d.decisionType === node.entityId
      );
      const entityType = definition?.metadata?.entityType as string | undefined;
      if (!definition || !entityType) return [];

      return [
        {
          edgeType: "decision.targets",
          sourceNode: node.nodeId,
          targetNode: buildGraphNodeId("entity", entityType, "*"),
          direction: "directed" as const,
          weight: 1,
          effectiveDate: null,
          endDate: null,
          metadata: {
            providerKey: "decision",
            decisionType: definition.decisionType,
            templateEdge: true,
            entityType,
          },
        },
      ];
    }

    return [];
  },

  async searchNodes(_ctx: GraphProviderContext, query: GraphSearchQuery): Promise<GraphNode[]> {
    const needle = query.query.toLowerCase();
    if (!needle) return [];

    return getAllDecisionDefinitions()
      .filter(
        (def) =>
          def.decisionType.toLowerCase().includes(needle) ||
          def.name.toLowerCase().includes(needle)
      )
      .slice(0, query.limit ?? 20)
      .map((def) => ({
        nodeId: buildGraphNodeId("decision_execution", "decision_execution", def.decisionType),
        nodeType: "decision_execution",
        entityType: "decision_execution",
        entityId: def.decisionType,
        organizationId: null,
        schoolId: null,
        metadata: {
          providerKey: "decision",
          decisionType: def.decisionType,
          name: def.name,
          domain: def.domain,
        },
      }));
  },
};
