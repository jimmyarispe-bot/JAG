/**
 * Application-level status + timeline for Decision Center cards.
 * Does not invent proposals — only tracks executive workflow state.
 */

import type { JagDecisionStatus, JagDecisionTimelineEntry } from "./types";

type StatusRecord = {
  status: JagDecisionStatus;
  timeline: JagDecisionTimelineEntry[];
};

const byDecisionId = new Map<string, StatusRecord>();

export function resetDecisionStatusStoreForTests(): void {
  byDecisionId.clear();
}

export function getDecisionStatus(
  decisionId: string
): JagDecisionStatus {
  return byDecisionId.get(decisionId)?.status ?? "New";
}

export function getDecisionTimeline(
  decisionId: string
): readonly JagDecisionTimelineEntry[] {
  return byDecisionId.get(decisionId)?.timeline ?? [];
}

export function setDecisionStatus(input: {
  decisionId: string;
  status: JagDecisionStatus;
  actor: string;
  message?: string;
  at?: string;
}): JagDecisionStatus {
  const at = input.at ?? new Date().toISOString();
  const prev = byDecisionId.get(input.decisionId);
  const fromStatus = prev?.status ?? "New";
  const timeline = [...(prev?.timeline ?? [])];

  if (!prev) {
    timeline.push({
      id: `${input.decisionId}:created`,
      at,
      actor: "system",
      message: "Decision projected from contributor action proposal",
      fromStatus: null,
      toStatus: "New",
    });
  }

  if (fromStatus !== input.status || !prev) {
    timeline.push({
      id: `${input.decisionId}:${at}:${input.status}`,
      at,
      actor: input.actor,
      message:
        input.message ??
        `Status changed from ${fromStatus} to ${input.status}`,
      fromStatus,
      toStatus: input.status,
    });
  }

  byDecisionId.set(input.decisionId, {
    status: input.status,
    timeline,
  });
  return input.status;
}

/** Ensure a created timeline entry exists when first listed. */
export function ensureDecisionTracked(decisionId: string, analyzedAt: string): void {
  if (byDecisionId.has(decisionId)) return;
  byDecisionId.set(decisionId, {
    status: "New",
    timeline: [
      {
        id: `${decisionId}:created`,
        at: analyzedAt,
        actor: "system",
        message: "Decision projected from contributor action proposal",
        fromStatus: null,
        toStatus: "New",
      },
    ],
  });
}
