import {
  createDecisionId,
  defaultOwnerForPriority,
  dueDateFrom,
  priorityRank,
} from "@/lib/platform/decisions/decision";
import {
  getStoredDecision,
  upsertStoredDecision,
} from "@/lib/platform/decisions/queue";
import { appendHistory } from "@/lib/platform/decisions/history";
import { buildOwner } from "@/lib/platform/decisions/ownership";
import {
  assertTransition,
  historyActionForTransition,
} from "@/lib/platform/decisions/workflow";
import type {
  AssignDecisionInput,
  CreateDecisionInput,
  EscalateDecisionPriorityInput,
  PlatformDecision,
  SetDecisionDueDateInput,
  TransitionDecisionInput,
} from "@/lib/platform/decisions/types";
import { defaultDueDateForPriority } from "@/lib/platform/notifications/due-dates";
import { notifyDecisionAssignment } from "@/lib/platform/notifications/assignment";
import { DecisionRepository } from "@/lib/platform/persistence";

/**
 * Create a decision by merge key. If an active decision already exists for the
 * key, returns it unchanged (no duplicates).
 */
export function createDecision(input: CreateDecisionInput): {
  decision: PlatformDecision;
  created: boolean;
} {
  const existing = DecisionRepository.findActiveByMergeKey(input.mergeKey);
  if (existing) {
    return { decision: existing, created: false };
  }

  const now = input.now ?? new Date().toISOString();
  const ownerRole = input.ownerRole ?? defaultOwnerForPriority(input.priority);
  const id = createDecisionId(input.mergeKey, now);
  const decision: PlatformDecision = {
    id,
    mergeKey: input.mergeKey,
    sourceInsightId: input.sourceInsightId ?? null,
    sourceRecommendationId: input.sourceRecommendationId ?? null,
    signalIds: input.signalIds ? [...input.signalIds] : [],
    title: input.title,
    description: input.description,
    organizationId: input.organizationId,
    applicationId: input.applicationId ?? null,
    priority: input.priority,
    owner: buildOwner({ role: ownerRole }),
    status: "open",
    createdAt: now,
    updatedAt: now,
    dueDate:
      input.dueDate !== undefined && input.dueDate !== null
        ? input.dueDate
        : input.dueInDays != null
          ? dueDateFrom(now, input.dueInDays)
          : defaultDueDateForPriority(input.priority, now),
    completedAt: null,
    outcome: null,
    history: appendHistory([], {
      action: input.historyAction ?? "created",
      actorUserId: input.actorUserId,
      timestamp: now,
      reason: input.reason ?? "Created by DecisionService",
      toStatus: "open",
      toOwnerRole: ownerRole,
    }),
  };
  upsertStoredDecision(decision);
  return { decision, created: true };
}

export function escalateDecisionPriority(
  input: EscalateDecisionPriorityInput
): PlatformDecision {
  const existing = getStoredDecision(input.decisionId);
  if (!existing) {
    throw new Error(`Decision not found: ${input.decisionId}`);
  }
  const now = input.now ?? new Date().toISOString();
  if (priorityRank(input.priority) <= priorityRank(existing.priority)) {
    return existing;
  }
  const updated: PlatformDecision = {
    ...existing,
    priority: input.priority,
    updatedAt: now,
    history: appendHistory(existing.history, {
      action: "priority_escalated",
      actorUserId: input.actorUserId,
      actorRole: input.actorRole,
      timestamp: now,
      reason:
        input.reason ??
        `Priority escalated from ${existing.priority} to ${input.priority}`,
      toStatus: existing.status,
      toOwnerRole: existing.owner?.role ?? null,
      toOwnerUserId: existing.owner?.userId ?? null,
    }),
  };
  upsertStoredDecision(updated);
  return updated;
}

export function assignDecision(input: AssignDecisionInput): PlatformDecision {
  const existing = getStoredDecision(input.decisionId);
  if (!existing) {
    throw new Error(`Decision not found: ${input.decisionId}`);
  }

  const now = input.now ?? new Date().toISOString();
  // Role-only defaults from sync are not a prior assignment; userId or status is.
  const wasAssigned =
    existing.status === "assigned" ||
    existing.status === "in_progress" ||
    existing.status === "waiting" ||
    Boolean(existing.owner?.userId);
  const owner = buildOwner({
    role: input.ownerRole,
    userId: input.ownerUserId,
    displayName: input.ownerDisplayName,
  });

  const nextStatus =
    existing.status === "open" ? ("assigned" as const) : existing.status;

  const updated: PlatformDecision = {
    ...existing,
    owner,
    status: nextStatus,
    dueDate: input.dueDate !== undefined ? input.dueDate : existing.dueDate,
    updatedAt: now,
    history: appendHistory(existing.history, {
      action: wasAssigned ? "reassigned" : "assigned",
      actorUserId: input.actorUserId,
      actorRole: input.actorRole,
      timestamp: now,
      reason: input.reason,
      toStatus: nextStatus,
      toOwnerRole: owner.role,
      toOwnerUserId: owner.userId,
    }),
  };

  upsertStoredDecision(updated);

  if (input.notify !== false) {
    notifyDecisionAssignment({
      decision: updated,
      reassigned: wasAssigned,
      actorUserId: input.actorUserId,
      now,
    });
  }

  return updated;
}

export function setDecisionDueDate(
  input: SetDecisionDueDateInput
): PlatformDecision {
  const existing = getStoredDecision(input.decisionId);
  if (!existing) {
    throw new Error(`Decision not found: ${input.decisionId}`);
  }
  const now = input.now ?? new Date().toISOString();
  const updated: PlatformDecision = {
    ...existing,
    dueDate: input.dueDate,
    updatedAt: now,
    history: appendHistory(existing.history, {
      action: "due_date_changed",
      actorUserId: input.actorUserId,
      actorRole: input.actorRole,
      timestamp: now,
      reason: input.reason ?? `Due date set to ${input.dueDate}`,
      toStatus: existing.status,
    }),
  };
  upsertStoredDecision(updated);
  return updated;
}

export function transitionDecision(
  input: TransitionDecisionInput
): PlatformDecision {
  const existing = getStoredDecision(input.decisionId);
  if (!existing) {
    throw new Error(`Decision not found: ${input.decisionId}`);
  }

  assertTransition(existing.status, input.toStatus);
  const now = input.now ?? new Date().toISOString();
  const action = historyActionForTransition(input.toStatus);

  const updated: PlatformDecision = {
    ...existing,
    status: input.toStatus,
    updatedAt: now,
    completedAt:
      input.toStatus === "completed" || input.toStatus === "dismissed"
        ? now
        : existing.completedAt,
    outcome:
      input.outcome ??
      (input.toStatus === "dismissed" ? input.reason ?? existing.outcome : existing.outcome),
    history: appendHistory(existing.history, {
      action,
      actorUserId: input.actorUserId,
      actorRole: input.actorRole,
      timestamp: now,
      reason: input.reason,
      toStatus: input.toStatus,
      toOwnerRole: existing.owner?.role ?? null,
      toOwnerUserId: existing.owner?.userId ?? null,
    }),
  };

  upsertStoredDecision(updated);
  return updated;
}
