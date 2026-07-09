import type {
  BuildExecutiveDecisionQueueInput,
  ExecutiveDecisionQueue,
  ExecutiveDecisionStatus,
} from "@/lib/platform/executive-decisions/types";
import { EXECUTIVE_DECISION_STATUSES } from "@/lib/platform/executive-decisions/types";
import { mergeDecisionSources } from "@/lib/platform/executive-decisions/merge";

function emptyCounts(): Record<ExecutiveDecisionStatus, number> {
  return Object.fromEntries(
    EXECUTIVE_DECISION_STATUSES.map((s) => [s, 0])
  ) as Record<ExecutiveDecisionStatus, number>;
}

/**
 * Pure composer: drafts → merged, scored executive decision queue.
 */
export function buildExecutiveDecisionQueue(
  input: BuildExecutiveDecisionQueueInput
): ExecutiveDecisionQueue {
  const { decisions, rawDraftCount, mergedAway } = mergeDecisionSources(
    input.drafts
  );
  const includeClosed = input.includeClosed ?? false;
  const filtered = includeClosed
    ? decisions
    : decisions.filter(
        (d) => d.status !== "Completed" && d.status !== "Dismissed"
      );

  const counts = emptyCounts();
  for (const d of filtered) {
    counts[d.status] += 1;
  }

  return {
    scope: input.scope,
    builtAt: input.builtAt ?? new Date().toISOString(),
    decisions: filtered,
    rawDraftCount,
    mergedAway,
    counts,
  };
}
