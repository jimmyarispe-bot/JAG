import {
  listAutomationRules,
  registerAutomationRules,
} from "@/lib/platform/automation/operating/registry";
import type { AutomationRule } from "@/lib/platform/automation/operating/types";

/** Built-in deterministic rules for RC1 operational domains. */
export const DEFAULT_AUTOMATION_RULES: AutomationRule[] = [
  {
    id: "admissions.review-stale-7d",
    name: "Admissions — application in review > 7 days",
    enabled: true,
    priority: 100,
    trigger: "admissions.application_in_review",
    organizationScope: null,
    applicationScope: "academyos",
    schedule: "daily",
    conditions: {
      all: [
        { path: "application.review_days", op: "gt", value: 7 },
        { path: "application.status", op: "eq", value: "review" },
      ],
    },
    actions: [
      {
        type: "create_decision",
        params: {
          title: "Review stalled admission application",
          description:
            "Application has remained in review for more than 7 days.",
          priority: "high",
          ownerRole: "executive_director",
          dueInDays: 3,
          subjectKeyPath: "application.id",
        },
      },
      {
        type: "assign_decision",
        params: {
          ownerRole: "executive_director",
          notify: true,
        },
      },
    ],
  },
  {
    id: "finance.tuition-overdue",
    name: "Finance — tuition payment overdue",
    enabled: true,
    priority: 90,
    trigger: "finance.tuition_payment_overdue",
    organizationScope: null,
    applicationScope: "academyos",
    schedule: "daily",
    conditions: {
      all: [{ path: "subject.days_overdue", op: "gte", value: 1 }],
    },
    actions: [
      {
        type: "create_decision",
        params: {
          title: "Resolve overdue tuition payment",
          description: "A tuition payment is overdue and needs follow-up.",
          priority: "high",
          ownerRole: "executive_director",
          dueInDays: 2,
        },
      },
    ],
  },
  {
    id: "hr.timesheet-missing",
    name: "HR — timesheet missing",
    enabled: true,
    priority: 70,
    trigger: "hr.timesheet_missing",
    organizationScope: null,
    applicationScope: null,
    schedule: "weekly",
    conditions: {
      all: [{ path: "subject.id", op: "exists" }],
    },
    actions: [
      {
        type: "create_decision",
        params: {
          title: "Missing timesheet requires attention",
          priority: "medium",
          ownerRole: "executive_director",
          dueInDays: 5,
        },
      },
    ],
  },
  {
    id: "classes.enrollment-below-minimum",
    name: "Classes — enrollment below minimum",
    enabled: true,
    priority: 80,
    trigger: "classes.enrollment_below_minimum",
    organizationScope: null,
    applicationScope: "academyos",
    schedule: "daily",
    conditions: {
      all: [{ path: "subject.below_minimum", op: "eq", value: true }],
    },
    actions: [
      {
        type: "create_decision",
        params: {
          title: "Class enrollment below minimum",
          priority: "medium",
          ownerRole: "school_leader",
          dueInDays: 7,
        },
      },
    ],
  },
  {
    id: "staff.invitation-expires",
    name: "Staff — invitation expires soon",
    enabled: true,
    priority: 60,
    trigger: "staff.invitation_expires",
    organizationScope: null,
    applicationScope: null,
    schedule: "daily",
    conditions: {
      all: [{ path: "subject.expires_in_days", op: "lte", value: 3 }],
    },
    actions: [
      {
        type: "create_decision",
        params: {
          title: "Staff invitation expiring soon",
          priority: "medium",
          ownerRole: "executive_director",
          dueInDays: 2,
        },
      },
    ],
  },
  {
    id: "platform.failed-scheduled-job",
    name: "Platform — failed scheduled job",
    enabled: true,
    priority: 110,
    trigger: "platform.failed_scheduled_job",
    organizationScope: null,
    applicationScope: null,
    schedule: "hourly",
    conditions: {
      all: [{ path: "subject.id", op: "exists" }],
    },
    actions: [
      {
        type: "create_decision",
        params: {
          title: "Investigate failed scheduled job",
          priority: "critical",
          ownerRole: "founder",
          dueInDays: 1,
        },
      },
      {
        type: "escalate_priority",
        params: { priority: "critical" },
      },
    ],
  },
];

let defaultsSeeded = false;

/** Idempotent seed of built-in rules into the central registry. */
export function ensureDefaultAutomationRules(): void {
  if (defaultsSeeded && listAutomationRules().length > 0) return;
  registerAutomationRules(DEFAULT_AUTOMATION_RULES);
  defaultsSeeded = true;
}

export function resetDefaultAutomationRulesFlagForTests(): void {
  defaultsSeeded = false;
}
