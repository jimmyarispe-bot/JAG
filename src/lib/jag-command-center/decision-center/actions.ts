"use server";

/**
 * Server actions for Decision Center status + execution workflow.
 * Application layer only — does not invent proposals or touch Core/Runtime.
 */

import { revalidatePath } from "next/cache";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";
import { recordJagAuditEvent } from "../audit";
import { pushJagNotification } from "../notifications";
import {
  addExecutionUpdate,
  assignDecision,
  recordDecisionFeedback,
  recordDecisionOutcome,
} from "./execution-store";
import { setDecisionStatus } from "./status-store";
import {
  JAG_DECISION_STATUSES,
  type JagDecisionAssignmentTarget,
  type JagDecisionExecutionEventKind,
  type JagDecisionFuturePriority,
  type JagDecisionOutcomeResult,
  type JagDecisionPriorityLabel,
  type JagDecisionStatus,
} from "./types";

type ActionResult<T = void> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

export type UpdateDecisionStatusResult = ActionResult<{
  status: JagDecisionStatus;
}>;

function revalidateDecision(decisionId: string): void {
  revalidatePath("/jag/decisions");
  revalidatePath(`/jag/decisions/${decisionId}`);
  revalidatePath("/jag");
}

async function requireActor(): Promise<
  | {
      ok: true;
      actor: string;
      userId: string;
    }
  | { ok: false; error: string }
> {
  const session = await getJagPlatformSession();
  if (!session) return { ok: false, error: "Not authenticated." };
  return {
    ok: true,
    actor: session.displayName || session.email,
    userId: session.userId,
  };
}

export async function updateDecisionCenterStatus(input: {
  decisionId: string;
  status: string;
  message?: string;
  organizationId?: string;
}): Promise<UpdateDecisionStatusResult> {
  const auth = await requireActor();
  if (!auth.ok) return auth;
  if (
    !JAG_DECISION_STATUSES.includes(input.status as JagDecisionStatus)
  ) {
    return { ok: false, error: "Invalid status." };
  }
  if (!input.decisionId.trim()) {
    return { ok: false, error: "Decision id is required." };
  }

  const status = setDecisionStatus({
    decisionId: input.decisionId,
    status: input.status as JagDecisionStatus,
    actor: auth.actor,
    message: input.message,
  });

  const action =
    status === "Approved"
      ? ("decision_approved" as const)
      : status === "Completed"
        ? ("decision_completed" as const)
        : ("decision_status_updated" as const);

  recordJagAuditEvent({
    action,
    actorUserId: auth.userId,
    actorLabel: auth.actor,
    organizationId: input.organizationId,
    decisionId: input.decisionId,
    detail: `Decision status → ${status}`,
    metadata: { status },
  });

  if (status === "Approved") {
    pushJagNotification({
      kind: "decision_approved",
      title: "Decision approved",
      body: `Decision ${input.decisionId.slice(0, 8)}… marked Approved.`,
      href: `/jag/decisions/${input.decisionId}`,
      organizationId: input.organizationId,
      decisionId: input.decisionId,
    });
  }

  revalidateDecision(input.decisionId);
  return { ok: true, status };
}

export async function assignDecisionCenterOwner(input: {
  decisionId: string;
  targetType: JagDecisionAssignmentTarget;
  organizationId?: string;
  organizationName?: string;
  role?: string;
  userId?: string;
  userLabel?: string;
  dueDate?: string;
  priority: JagDecisionPriorityLabel;
}): Promise<ActionResult<{ summary: string }>> {
  const auth = await requireActor();
  if (!auth.ok) return auth;
  if (!input.decisionId.trim()) {
    return { ok: false, error: "Decision id is required." };
  }

  if (input.targetType === "organization" && !input.organizationId?.trim()) {
    return { ok: false, error: "Organization is required." };
  }
  if (input.targetType === "role" && !input.role?.trim()) {
    return { ok: false, error: "Role is required." };
  }
  if (
    input.targetType === "user" &&
    !input.userId?.trim() &&
    !input.userLabel?.trim()
  ) {
    return { ok: false, error: "User is required." };
  }

  const assignment = assignDecision({
    decisionId: input.decisionId,
    actor: auth.actor,
    targetType: input.targetType,
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    role: input.role,
    userId: input.userId,
    userLabel: input.userLabel,
    dueDate: input.dueDate,
    priority: input.priority,
  });

  recordJagAuditEvent({
    action: "decision_assigned",
    actorUserId: auth.userId,
    actorLabel: auth.actor,
    organizationId: input.organizationId,
    decisionId: input.decisionId,
    detail: `Assigned to ${assignment.summary}`,
    metadata: {
      priority: input.priority,
      ...(input.dueDate ? { dueDate: input.dueDate } : {}),
    },
  });

  pushJagNotification({
    kind: "decision_assigned",
    title: "Decision assigned",
    body: `Assigned to ${assignment.summary}${
      assignment.dueDate ? ` · due ${assignment.dueDate.slice(0, 10)}` : ""
    }`,
    href: `/jag/decisions/${input.decisionId}`,
    organizationId: input.organizationId,
    decisionId: input.decisionId,
  });

  if (
    assignment.dueDate &&
    Date.parse(assignment.dueDate) < Date.now()
  ) {
    pushJagNotification({
      kind: "decision_overdue",
      title: "Decision overdue",
      body: `Assignment due date ${assignment.dueDate.slice(0, 10)} is already past.`,
      href: `/jag/decisions/${input.decisionId}`,
      organizationId: input.organizationId,
      decisionId: input.decisionId,
    });
  }

  revalidateDecision(input.decisionId);
  return { ok: true, summary: assignment.summary };
}

export async function addDecisionCenterExecutionUpdate(input: {
  decisionId: string;
  kind: Extract<
    JagDecisionExecutionEventKind,
    "started" | "progress" | "completed" | "outcome_note" | "evidence_added"
  >;
  message: string;
  progressPct?: number;
  evidenceRef?: string;
  organizationId?: string;
}): Promise<ActionResult> {
  const auth = await requireActor();
  if (!auth.ok) return auth;
  if (!input.decisionId.trim()) {
    return { ok: false, error: "Decision id is required." };
  }
  if (!input.message.trim()) {
    return { ok: false, error: "Update message is required." };
  }

  addExecutionUpdate({
    decisionId: input.decisionId,
    actor: auth.actor,
    kind: input.kind,
    message: input.message.trim(),
    progressPct: input.progressPct,
    evidenceRef: input.evidenceRef?.trim() || undefined,
  });

  recordJagAuditEvent({
    action:
      input.kind === "completed"
        ? "decision_completed"
        : "decision_execution_updated",
    actorUserId: auth.userId,
    actorLabel: auth.actor,
    organizationId: input.organizationId,
    decisionId: input.decisionId,
    detail: `${input.kind}: ${input.message.trim()}`,
    metadata: { kind: input.kind },
  });

  revalidateDecision(input.decisionId);
  return { ok: true };
}

export async function recordDecisionCenterOutcome(input: {
  decisionId: string;
  expectedOutcome: string;
  actualOutcome: string;
  confidence: number;
  result: JagDecisionOutcomeResult;
  lessonsLearned: string;
  achievedIntendedResult: boolean;
  futurePriority: JagDecisionFuturePriority;
  feedbackNotes?: string;
  organizationId?: string;
}): Promise<ActionResult> {
  const auth = await requireActor();
  if (!auth.ok) return auth;
  if (!input.decisionId.trim()) {
    return { ok: false, error: "Decision id is required." };
  }
  if (!input.expectedOutcome.trim() || !input.actualOutcome.trim()) {
    return { ok: false, error: "Expected and actual outcomes are required." };
  }
  if (input.result !== "success" && input.result !== "failure") {
    return { ok: false, error: "Outcome result must be success or failure." };
  }

  recordDecisionOutcome({
    decisionId: input.decisionId,
    actor: auth.actor,
    expectedOutcome: input.expectedOutcome,
    actualOutcome: input.actualOutcome,
    confidence: input.confidence,
    result: input.result,
    lessonsLearned: input.lessonsLearned,
  });

  recordDecisionFeedback({
    decisionId: input.decisionId,
    actor: auth.actor,
    achievedIntendedResult: input.achievedIntendedResult,
    futurePriority: input.futurePriority,
    notes: input.feedbackNotes,
  });

  recordJagAuditEvent({
    action: "decision_outcome_reviewed",
    actorUserId: auth.userId,
    actorLabel: auth.actor,
    organizationId: input.organizationId,
    decisionId: input.decisionId,
    detail: `Outcome ${input.result}`,
    metadata: { result: input.result },
  });

  revalidateDecision(input.decisionId);
  return { ok: true };
}
