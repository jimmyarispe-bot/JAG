import type {
  DecisionHistoryAction,
  DecisionHistoryEntry,
  DecisionOwnerRole,
  DecisionStatus,
} from "@/lib/platform/decisions/types";

let historySeq = 0;

export function resetHistorySequenceForTests(): void {
  historySeq = 0;
}

export function appendHistory(
  history: DecisionHistoryEntry[],
  input: {
    action: DecisionHistoryAction;
    actorUserId?: string | null;
    actorRole?: DecisionOwnerRole | null;
    timestamp: string;
    reason?: string | null;
    toStatus?: DecisionStatus | null;
    toOwnerRole?: DecisionOwnerRole | null;
    toOwnerUserId?: string | null;
  }
): DecisionHistoryEntry[] {
  historySeq += 1;
  const entry: DecisionHistoryEntry = {
    id: `hist:${historySeq}:${input.timestamp}`,
    action: input.action,
    actorUserId: input.actorUserId ?? null,
    actorRole: input.actorRole ?? null,
    timestamp: input.timestamp,
    reason: input.reason ?? null,
    toStatus: input.toStatus ?? null,
    toOwnerRole: input.toOwnerRole ?? null,
    toOwnerUserId: input.toOwnerUserId ?? null,
  };
  return [...history, entry];
}
