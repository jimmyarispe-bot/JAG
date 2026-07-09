import type { RuleAuditEntry } from "@/lib/platform/rules/types";
import { recordGraphEdges } from "@/lib/platform/intelligence-graph/persistence/records";
import type { RecordGraphEdgeInput } from "@/lib/platform/intelligence-graph/persistence/types";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { buildGraphNodeId } from "@/lib/platform/intelligence-graph/utils";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/** Persist graph edges when a rule set is evaluated — Rules Engine integration. */
export async function syncRuleEvaluationGraphEdges(
  supabase: AuthClient,
  entry: RuleAuditEntry
): Promise<void> {
  const ruleNodeId = buildGraphNodeId("rule_evaluation", "rule_evaluation", entry.evaluationId);
  const edges: RecordGraphEdgeInput[] = [];

  if (entry.entityType && entry.entityId) {
    edges.push({
      edgeType: "rule.evaluated_for.entity",
      sourceNodeId: ruleNodeId,
      targetNodeId: buildGraphNodeId("entity", entry.entityType, entry.entityId),
      providerKey: "rules",
      organizationId: entry.organizationId,
      schoolId: entry.schoolId,
      effectiveDate: entry.recordedAt,
      metadata: {
        ruleSetKey: entry.ruleSetKey,
        primaryOutcomeKey: entry.result.primaryOutcome?.outcomeKey,
      },
    });
  }

  const linkedDecisionId = entry.metadata?.linkedDecisionExecutionId;
  if (typeof linkedDecisionId === "string") {
    edges.push({
      edgeType: "rule.evaluated_during.decision",
      sourceNodeId: ruleNodeId,
      targetNodeId: buildGraphNodeId("decision_record", "decision_record", linkedDecisionId),
      providerKey: "rules",
      organizationId: entry.organizationId,
      schoolId: entry.schoolId,
      effectiveDate: entry.recordedAt,
      metadata: { ruleSetKey: entry.ruleSetKey },
    });
  }

  if (edges.length > 0) {
    await recordGraphEdges(supabase, edges);
  }
}
