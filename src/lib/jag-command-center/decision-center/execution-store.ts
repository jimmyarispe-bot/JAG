/**
 * Decision execution metadata — assignment, progress, outcomes, feedback.
 * Application layer only. Does not modify contributors or Core/Runtime.
 */

import { setDecisionStatus } from "./status-store";
import type {
  JagDecisionAssignment,
  JagDecisionAssignmentTarget,
  JagDecisionExecutionEvent,
  JagDecisionExecutionEventKind,
  JagDecisionFeedback,
  JagDecisionFuturePriority,
  JagDecisionOutcome,
  JagDecisionOutcomeResult,
  JagDecisionPriorityLabel,
  JagDecisionStatus,
} from "./types";

type ExecutionRecord = {
  assignment: JagDecisionAssignment | null;
  history: JagDecisionExecutionEvent[];
  outcome: JagDecisionOutcome | null;
  feedback: JagDecisionFeedback | null;
  completedAt: string | null;
};

const byDecisionId = new Map<string, ExecutionRecord>();

function emptyRecord(): ExecutionRecord {
  return {
    assignment: null,
    history: [],
    outcome: null,
    feedback: null,
    completedAt: null,
  };
}

function ensure(decisionId: string): ExecutionRecord {
  let record = byDecisionId.get(decisionId);
  if (!record) {
    record = emptyRecord();
    byDecisionId.set(decisionId, record);
  }
  return record;
}

function pushEvent(
  decisionId: string,
  input: {
    kind: JagDecisionExecutionEventKind;
    actor: string;
    message: string;
    at?: string;
    progressPct?: number;
    evidenceRef?: string;
  }
): JagDecisionExecutionEvent {
  const at = input.at ?? new Date().toISOString();
  const record = ensure(decisionId);
  const event: JagDecisionExecutionEvent = {
    id: `${decisionId}:${input.kind}:${at}:${record.history.length}`,
    kind: input.kind,
    at,
    actor: input.actor,
    message: input.message,
    progressPct: input.progressPct,
    evidenceRef: input.evidenceRef,
  };
  record.history = [...record.history, event];
  return event;
}

function assignmentSummary(a: Omit<JagDecisionAssignment, "summary">): string {
  if (a.targetType === "organization") {
    return a.organizationName || a.organizationId || "Organization";
  }
  if (a.targetType === "role") {
    return a.role ? `Role: ${a.role}` : "Role";
  }
  return a.userLabel || a.userId || "User";
}

export function resetDecisionExecutionStoreForTests(): void {
  byDecisionId.clear();
}

export function getDecisionAssignment(
  decisionId: string
): JagDecisionAssignment | null {
  return byDecisionId.get(decisionId)?.assignment ?? null;
}

export function getDecisionExecutionHistory(
  decisionId: string
): readonly JagDecisionExecutionEvent[] {
  return byDecisionId.get(decisionId)?.history ?? [];
}

export function getDecisionOutcome(
  decisionId: string
): JagDecisionOutcome | null {
  return byDecisionId.get(decisionId)?.outcome ?? null;
}

export function getDecisionFeedback(
  decisionId: string
): JagDecisionFeedback | null {
  return byDecisionId.get(decisionId)?.feedback ?? null;
}

export function getDecisionCompletedAt(decisionId: string): string | null {
  return byDecisionId.get(decisionId)?.completedAt ?? null;
}

export function isDecisionOverdue(
  decisionId: string,
  status: JagDecisionStatus,
  now = new Date()
): boolean {
  const assignment = getDecisionAssignment(decisionId);
  if (!assignment?.dueDate) return false;
  if (
    status === "Completed" ||
    status === "Outcome Reviewed" ||
    status === "Dismissed"
  ) {
    return false;
  }
  const due = Date.parse(assignment.dueDate);
  if (Number.isNaN(due)) return false;
  return due < now.getTime();
}

export function assignDecision(input: {
  decisionId: string;
  actor: string;
  targetType: JagDecisionAssignmentTarget;
  organizationId?: string;
  organizationName?: string;
  role?: string;
  userId?: string;
  userLabel?: string;
  dueDate?: string;
  priority: JagDecisionPriorityLabel;
  at?: string;
}): JagDecisionAssignment {
  const at = input.at ?? new Date().toISOString();
  const record = ensure(input.decisionId);
  const base = {
    targetType: input.targetType,
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    role: input.role,
    userId: input.userId,
    userLabel: input.userLabel,
    dueDate: input.dueDate || undefined,
    priority: input.priority,
    assignedAt: at,
    assignedBy: input.actor,
  };
  const assignment: JagDecisionAssignment = {
    ...base,
    summary: assignmentSummary(base),
  };
  record.assignment = assignment;

  pushEvent(input.decisionId, {
    kind: "assigned",
    actor: input.actor,
    message: `Assigned to ${assignment.summary}${
      assignment.dueDate ? ` · due ${assignment.dueDate.slice(0, 10)}` : ""
    }`,
    at,
  });

  setDecisionStatus({
    decisionId: input.decisionId,
    status: "Assigned",
    actor: input.actor,
    message: `Assigned to ${assignment.summary}`,
    at,
  });

  return assignment;
}

export function addExecutionUpdate(input: {
  decisionId: string;
  actor: string;
  kind: Exclude<
    JagDecisionExecutionEventKind,
    "assigned" | "status"
  >;
  message: string;
  progressPct?: number;
  evidenceRef?: string;
  at?: string;
}): JagDecisionExecutionEvent {
  const at = input.at ?? new Date().toISOString();
  const event = pushEvent(input.decisionId, {
    kind: input.kind,
    actor: input.actor,
    message: input.message,
    at,
    progressPct: input.progressPct,
    evidenceRef: input.evidenceRef,
  });

  if (input.kind === "started") {
    setDecisionStatus({
      decisionId: input.decisionId,
      status: "In Progress",
      actor: input.actor,
      message: input.message || "Execution started",
      at,
    });
  } else if (input.kind === "completed") {
    const record = ensure(input.decisionId);
    record.completedAt = at;
    setDecisionStatus({
      decisionId: input.decisionId,
      status: "Completed",
      actor: input.actor,
      message: input.message || "Execution completed",
      at,
    });
  } else if (input.kind === "progress") {
    setDecisionStatus({
      decisionId: input.decisionId,
      status: "In Progress",
      actor: input.actor,
      message: input.message,
      at,
    });
  }

  return event;
}

export function recordDecisionOutcome(input: {
  decisionId: string;
  actor: string;
  expectedOutcome: string;
  actualOutcome: string;
  confidence: number;
  result: JagDecisionOutcomeResult;
  lessonsLearned: string;
  at?: string;
}): JagDecisionOutcome {
  const at = input.at ?? new Date().toISOString();
  const record = ensure(input.decisionId);
  const outcome: JagDecisionOutcome = {
    expectedOutcome: input.expectedOutcome.trim(),
    actualOutcome: input.actualOutcome.trim(),
    confidence: clampConfidence(input.confidence),
    result: input.result,
    lessonsLearned: input.lessonsLearned.trim(),
    reviewedAt: at,
    reviewedBy: input.actor,
  };
  record.outcome = outcome;
  if (!record.completedAt) record.completedAt = at;

  pushEvent(input.decisionId, {
    kind: "outcome_note",
    actor: input.actor,
    message: `Outcome reviewed: ${outcome.result}`,
    at,
  });

  setDecisionStatus({
    decisionId: input.decisionId,
    status: "Outcome Reviewed",
    actor: input.actor,
    message: `Outcome ${outcome.result}`,
    at,
  });

  return outcome;
}

export function recordDecisionFeedback(input: {
  decisionId: string;
  actor: string;
  achievedIntendedResult: boolean;
  futurePriority: JagDecisionFuturePriority;
  notes?: string;
  at?: string;
}): JagDecisionFeedback {
  const at = input.at ?? new Date().toISOString();
  const record = ensure(input.decisionId);
  const feedback: JagDecisionFeedback = {
    achievedIntendedResult: input.achievedIntendedResult,
    futurePriority: input.futurePriority,
    notes: input.notes?.trim() || undefined,
    recordedAt: at,
    recordedBy: input.actor,
  };
  record.feedback = feedback;

  pushEvent(input.decisionId, {
    kind: "outcome_note",
    actor: input.actor,
    message: `Feedback: achieved=${feedback.achievedIntendedResult ? "yes" : "no"}; future priority ${feedback.futurePriority}`,
    at,
  });

  return feedback;
}

function clampConfidence(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
