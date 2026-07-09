import { getPlatformRuleEvaluationRecordByEvaluationId } from "@/lib/platform/rules/persistence/records";
import { loadPersistedGraphEdges } from "@/lib/platform/intelligence-graph/persistence/records";
import type {
  EdgeResolveOptions,
  GraphEdge,
  GraphNode,
  GraphProvider,
  GraphProviderContext,
} from "@/lib/platform/intelligence-graph/types";
import { buildGraphNodeId } from "@/lib/platform/intelligence-graph/utils";

/** Graph provider backed by the Rules Engine — links rule evaluations to entities and decisions. */
export const rulesGraphProvider: GraphProvider = {
  providerKey: "rules",

  async resolveNode(
    ctx: GraphProviderContext,
    entityType: string,
    entityId: string
  ): Promise<GraphNode | null> {
    if (entityType !== "rule_evaluation" || !entityId) return null;

    const record = await getPlatformRuleEvaluationRecordByEvaluationId(ctx.supabase, entityId);

    return {
      nodeId: buildGraphNodeId("rule_evaluation", entityType, entityId),
      nodeType: "rule_evaluation",
      entityType,
      entityId,
      organizationId: record?.organization_id ?? ctx.organizationId ?? null,
      schoolId: record?.school_id ?? ctx.schoolId ?? null,
      metadata: {
        providerKey: "rules",
        ruleSetKey: record?.rule_set_key,
        primaryOutcomeKey: record?.primary_outcome_key,
      },
    };
  },

  async resolveEdges(
    ctx: GraphProviderContext,
    node: GraphNode,
    options?: EdgeResolveOptions
  ): Promise<GraphEdge[]> {
    return loadPersistedGraphEdges(ctx.supabase, {
      nodeId: node.nodeId,
      direction: options?.direction ?? "both",
      providerKey: "rules",
      limit: 200,
    });
  },
};
