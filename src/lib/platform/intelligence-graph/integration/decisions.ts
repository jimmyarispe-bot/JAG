import type { DecisionAuditEntry } from "@/lib/platform/decision/types";
import { recordGraphEdges } from "@/lib/platform/intelligence-graph/persistence/records";
import type { RecordGraphEdgeInput } from "@/lib/platform/intelligence-graph/persistence/types";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { buildGraphNodeId } from "@/lib/platform/intelligence-graph/utils";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/** Persist graph edges when a decision is executed — Decision Engine integration. */
export async function syncDecisionGraphEdges(
  supabase: AuthClient,
  entry: DecisionAuditEntry
): Promise<void> {
  const edges: RecordGraphEdgeInput[] = [];
  const decisionNodeId = buildGraphNodeId(
    "decision_record",
    "decision_record",
    entry.executionId
  );

  if (entry.entityType && entry.entityId) {
    edges.push({
      edgeType: "decision.targets",
      sourceNodeId: decisionNodeId,
      targetNodeId: buildGraphNodeId("entity", entry.entityType, entry.entityId),
      providerKey: "persisted",
      organizationId: entry.organizationId,
      schoolId: entry.schoolId,
      effectiveDate: entry.recordedAt,
      metadata: {
        decisionType: entry.decisionType,
        executionId: entry.executionId,
        outcomeKey: entry.result.recommendation.outcomeKey,
      },
    });
  }

  for (const item of entry.result.collectedEvidence.items) {
    if (typeof item.value !== "string") continue;
    edges.push({
      edgeType: "decision.references.evidence",
      sourceNodeId: decisionNodeId,
      targetNodeId: buildGraphNodeId("evidence", "evidence_record", item.value),
      providerKey: "persisted",
      organizationId: entry.organizationId,
      schoolId: entry.schoolId,
      effectiveDate: entry.recordedAt,
      metadata: {
        evidenceKey: item.key,
        decisionType: entry.decisionType,
      },
    });
  }

  if (edges.length > 0) {
    await recordGraphEdges(supabase, edges);
  }
}
