"use server";

/**
 * Server actions for Decision Center status + execution workflow.
 * Application layer only — does not invent proposals or touch Core/Runtime.
 */

import { revalidatePath } from "next/cache";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";
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
  | { ok: true; actor: string }
  | { ok: false; error: string }
> {
  const session = await getJagPlatformSession();
  if (!session) return { ok: false, error: "Not authenticated." };
  return { ok: true, actor: session.displayName || session.email };
}

export async function updateDecisionCenterStatus(input: {
  decisionId: string;
  status: string;
  message?: string;
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

  revalidateDecision(input.decisionId);
  return { ok: true };
}
