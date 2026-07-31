import type {
  AutomationTriggerKind,
  OperationalFacts,
} from "@/lib/platform/automation/operating/types";

export type TriggerSubject = {
  key: string;
  /** Bound under facts.subject for condition paths. */
  subject: Record<string, unknown>;
};

/**
 * Triggers detect facts only — they expand a fact bag into subject rows.
 * No actions are taken here.
 */
export function expandTriggerSubjects(
  trigger: AutomationTriggerKind,
  facts: OperationalFacts
): TriggerSubject[] {
  switch (trigger) {
    case "admissions.application_in_review":
      return (facts.admissions?.applications ?? []).map((app) => ({
        key: app.id,
        subject: { ...app, review_days: app.review_days, status: app.status },
      }));
    case "finance.tuition_payment_overdue":
      return (facts.finance?.overdue_payments ?? []).map((p) => ({
        key: p.id,
        subject: { ...p },
      }));
    case "hr.timesheet_missing":
      return (facts.hr?.missing_timesheets ?? []).map((t) => ({
        key: t.id,
        subject: { ...t },
      }));
    case "classes.enrollment_below_minimum":
      return (facts.classes?.enrollments ?? []).map((c) => ({
        key: c.id,
        subject: {
          ...c,
          below_minimum: c.enrolled < c.minimum,
        },
      }));
    case "staff.invitation_expires":
      return (facts.staff?.invitations ?? []).map((i) => ({
        key: i.id,
        subject: { ...i },
      }));
    case "platform.failed_scheduled_job":
      return (facts.platform?.failed_jobs ?? []).map((j) => ({
        key: j.id,
        subject: { ...j },
      }));
    case "manual":
      return [
        {
          key: "manual",
          subject: (facts.subject as Record<string, unknown> | undefined) ?? {
            id: "manual",
          },
        },
      ];
    default:
      return [];
  }
}

export function triggerLabel(trigger: AutomationTriggerKind): string {
  switch (trigger) {
    case "admissions.application_in_review":
      return "Admissions — application in review";
    case "finance.tuition_payment_overdue":
      return "Finance — tuition payment overdue";
    case "hr.timesheet_missing":
      return "HR — timesheet missing";
    case "classes.enrollment_below_minimum":
      return "Classes — enrollment below minimum";
    case "staff.invitation_expires":
      return "Staff — invitation expires";
    case "platform.failed_scheduled_job":
      return "Platform — failed scheduled job";
    case "manual":
      return "Manual";
  }
}
