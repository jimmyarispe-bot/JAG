import type { WorkflowHistoryEntry } from "@/lib/platform/workflows/framework/types";

let historySeq = 0;

export function resetWorkflowHistorySequenceForTests(): void {
  historySeq = 0;
}

/** Immutable append — always returns a new array. */
export function appendWorkflowHistory(
  history: readonly WorkflowHistoryEntry[],
  input: Omit<WorkflowHistoryEntry, "id"> & { id?: string }
): WorkflowHistoryEntry[] {
  historySeq += 1;
  const entry: WorkflowHistoryEntry = {
    id: input.id ?? `wf-hist:${historySeq}:${input.timestamp}`,
    action: input.action,
    fromState: input.fromState,
    toState: input.toState,
    transitionKey: input.transitionKey,
    actorUserId: input.actorUserId,
    reason: input.reason,
    timestamp: input.timestamp,
    generatedActions: [...input.generatedActions],
  };
  return [...history, entry];
}
