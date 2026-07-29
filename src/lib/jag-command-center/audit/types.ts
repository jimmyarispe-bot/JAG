/** Executive action audit — application layer only. */

export const JAG_AUDIT_ACTIONS = [
  "brief_generated",
  "brief_follow_up_created",
  "brief_share_created",
  "brief_note_added",
  "brief_review_scheduled",
  "decision_status_updated",
  "decision_approved",
  "decision_assigned",
  "decision_execution_updated",
  "decision_completed",
  "decision_outcome_reviewed",
  "executive_note_added",
  "follow_up_scheduled",
  "prediction_run",
] as const;

export type JagAuditAction = (typeof JAG_AUDIT_ACTIONS)[number];

export type JagAuditEvent = {
  readonly id: string;
  readonly at: string;
  readonly action: JagAuditAction;
  readonly actorUserId: string;
  readonly actorLabel: string;
  readonly organizationId: string | null;
  readonly decisionId: string | null;
  readonly briefingId: string | null;
  readonly detail: string;
  readonly metadata?: Readonly<Record<string, string>>;
};
