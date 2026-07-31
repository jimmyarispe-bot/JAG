import type { PlatformDecision } from "@/lib/platform/decisions/types";
import { dispatchAssignmentNotification } from "@/lib/platform/notifications/dispatcher";
import { listNotificationsForDecision } from "@/lib/platform/notifications/dispatcher";
import type {
  AssigneeDecisionBuckets,
  DecisionAccountabilityBuckets,
  PlatformNotification,
} from "@/lib/platform/notifications/types";

/** Resolve notification recipient id from decision owner. */
export function resolveAssignmentRecipientId(decision: PlatformDecision): string | null {
  if (decision.owner?.userId) return decision.owner.userId;
  if (decision.owner?.role) return `role:${decision.owner.role}`;
  return null;
}

export function isDecisionUnassigned(decision: PlatformDecision): boolean {
  return !decision.owner?.userId && decision.status === "open";
}

export function isDecisionOverdue(
  decision: PlatformDecision,
  nowIso: string = new Date().toISOString()
): boolean {
  if (!decision.dueDate) return false;
  if (decision.status === "completed" || decision.status === "dismissed") {
    return false;
  }
  return new Date(decision.dueDate).getTime() < new Date(nowIso).getTime();
}

export function isDueToday(
  decision: PlatformDecision,
  nowIso: string = new Date().toISOString()
): boolean {
  if (!decision.dueDate) return false;
  if (decision.status === "completed" || decision.status === "dismissed") {
    return false;
  }
  const due = new Date(decision.dueDate);
  const now = new Date(nowIso);
  return (
    due.getUTCFullYear() === now.getUTCFullYear() &&
    due.getUTCMonth() === now.getUTCMonth() &&
    due.getUTCDate() === now.getUTCDate()
  );
}

export function hasUnacknowledgedNotification(
  decisionId: string
): boolean {
  const notes = listNotificationsForDecision(decisionId);
  return notes.some(
    (n) =>
      n.status === "pending" ||
      n.status === "delivered" ||
      n.status === "read"
  );
}

/**
 * Create an in-app notification for a decision assignment.
 */
export function notifyDecisionAssignment(input: {
  decision: PlatformDecision;
  reassigned?: boolean;
  actorUserId?: string | null;
  now?: string;
}): PlatformNotification | null {
  const recipientId = resolveAssignmentRecipientId(input.decision);
  if (!recipientId) return null;

  return dispatchAssignmentNotification({
    decisionId: input.decision.id,
    recipientId,
    organizationId: input.decision.organizationId,
    applicationId: input.decision.applicationId,
    priority: input.decision.priority,
    title: input.reassigned ? "Decision reassigned to you" : "Decision assigned to you",
    body: input.decision.title,
    type: input.reassigned ? "decision_reassigned" : "decision_assigned",
    actorUserId: input.actorUserId,
    now: input.now ?? input.decision.updatedAt,
  });
}

/** Founder accountability buckets (decision ids). */
export function buildFounderAccountabilityBuckets(
  decisions: PlatformDecision[],
  nowIso: string = new Date().toISOString()
): DecisionAccountabilityBuckets {
  const buckets: DecisionAccountabilityBuckets = {
    unassigned: [],
    overdue: [],
    unacknowledged: [],
    assigned: [],
    waitingAcknowledgement: [],
    inProgress: [],
    completed: [],
  };

  for (const d of decisions) {
    if (d.status === "completed") {
      buckets.completed.push(d.id);
      continue;
    }
    if (d.status === "dismissed") continue;

    if (isDecisionUnassigned(d)) buckets.unassigned.push(d.id);
    if (isDecisionOverdue(d, nowIso)) buckets.overdue.push(d.id);

    if (d.status === "assigned") buckets.assigned.push(d.id);
    if (d.status === "in_progress" || d.status === "waiting") {
      buckets.inProgress.push(d.id);
    }

    if (hasUnacknowledgedNotification(d.id)) {
      buckets.unacknowledged.push(d.id);
      buckets.waitingAcknowledgement.push(d.id);
    }
  }

  return buckets;
}

/** Executive Director / assignee view buckets. */
export function buildAssigneeDecisionBuckets(
  decisions: PlatformDecision[],
  assignee: { userId?: string | null; role?: string | null },
  nowIso: string = new Date().toISOString()
): AssigneeDecisionBuckets {
  const mine = decisions.filter((d) => {
    if (assignee.userId && d.owner?.userId === assignee.userId) return true;
    if (
      !assignee.userId &&
      assignee.role &&
      d.owner?.role === assignee.role &&
      !d.owner.userId
    ) {
      return true;
    }
    if (assignee.userId && d.owner?.role && !d.owner.userId) {
      // Role-targeted assignments visible when recipient is role:xxx for that user role
      return false;
    }
    return false;
  });

  const recentlyCutoff = new Date(nowIso).getTime() - 7 * 24 * 60 * 60 * 1000;

  return {
    myDecisions: mine
      .filter((d) => d.status !== "completed" && d.status !== "dismissed")
      .map((d) => d.id),
    dueToday: mine.filter((d) => isDueToday(d, nowIso)).map((d) => d.id),
    overdue: mine.filter((d) => isDecisionOverdue(d, nowIso)).map((d) => d.id),
    recentlyAssigned: mine
      .filter((d) => new Date(d.updatedAt).getTime() >= recentlyCutoff)
      .filter((d) => d.status === "assigned" || d.status === "open")
      .map((d) => d.id),
  };
}
