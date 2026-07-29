/** In-app executive notifications — no email. Application layer only. */

export const JAG_NOTIFICATION_KINDS = [
  "decision_assigned",
  "decision_overdue",
  "brief_ready",
  "outcome_overdue",
  "decision_approved",
  "follow_up_scheduled",
] as const;

export type JagNotificationKind = (typeof JAG_NOTIFICATION_KINDS)[number];

export type JagNotification = {
  readonly id: string;
  readonly kind: JagNotificationKind;
  readonly at: string;
  readonly title: string;
  readonly body: string;
  readonly href: string | null;
  readonly organizationId: string | null;
  readonly decisionId: string | null;
  readonly briefingId: string | null;
  readonly read: boolean;
};
