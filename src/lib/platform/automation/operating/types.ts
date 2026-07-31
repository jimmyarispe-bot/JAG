/**
 * Workflow Automation Engine (Sprint 068).
 * Deterministic rules that create / assign decisions and in-app notifications.
 * Nested under automation/operating to avoid colliding with Mission Control automation.
 */

import type {
  DecisionOwnerRole,
  DecisionPriority,
} from "@/lib/platform/decisions/types";

export type AutomationScheduleCadence = "hourly" | "daily" | "weekly" | "manual";

export type AutomationTriggerKind =
  | "admissions.application_in_review"
  | "finance.tuition_payment_overdue"
  | "hr.timesheet_missing"
  | "classes.enrollment_below_minimum"
  | "staff.invitation_expires"
  | "platform.failed_scheduled_job"
  | "manual";

export type ConditionOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in"
  | "exists";

export type AutomationCondition = {
  path: string;
  op: ConditionOperator;
  value?: unknown;
};

/** Composable AND / OR groups (nested groups allowed). */
export type AutomationConditionGroup = {
  all?: Array<AutomationCondition | AutomationConditionGroup>;
  any?: Array<AutomationCondition | AutomationConditionGroup>;
};

export type AutomationActionType =
  | "create_decision"
  | "assign_decision"
  | "create_notification"
  | "escalate_priority"
  | "mark_resolved"
  | "close_decision";

export type CreateDecisionActionParams = {
  title: string;
  description?: string;
  priority?: DecisionPriority;
  ownerRole?: DecisionOwnerRole;
  dueInDays?: number;
  /** Path into subject facts for stable subject key (default: subject.id). */
  subjectKeyPath?: string;
};

export type AssignDecisionActionParams = {
  ownerRole: DecisionOwnerRole;
  ownerUserId?: string | null;
  ownerDisplayName?: string | null;
  /** When omitted, uses the decision created/resolved in this run. */
  decisionId?: string;
  notify?: boolean;
};

export type CreateNotificationActionParams = {
  recipientId: string;
  title: string;
  body?: string;
  priority?: DecisionPriority;
  decisionId?: string;
};

export type EscalatePriorityActionParams = {
  priority: DecisionPriority;
  decisionId?: string;
};

export type DecisionTargetActionParams = {
  decisionId?: string;
  reason?: string | null;
};

export type AutomationAction =
  | { type: "create_decision"; params: CreateDecisionActionParams }
  | { type: "assign_decision"; params: AssignDecisionActionParams }
  | { type: "create_notification"; params: CreateNotificationActionParams }
  | { type: "escalate_priority"; params: EscalatePriorityActionParams }
  | { type: "mark_resolved"; params: DecisionTargetActionParams }
  | { type: "close_decision"; params: DecisionTargetActionParams };

export type AutomationRule = {
  id: string;
  name: string;
  enabled: boolean;
  /** Higher runs first. */
  priority: number;
  trigger: AutomationTriggerKind;
  conditions: AutomationConditionGroup;
  actions: AutomationAction[];
  organizationScope: string | null;
  applicationScope: string | null;
  schedule: AutomationScheduleCadence;
};

/** Flat / nested fact bag supplied by callers (manual or derived). */
export type OperationalFacts = {
  organizationId: string | null;
  applicationId?: string | null;
  observedAt: string;
  /** Per-subject evaluation context (set by engine while iterating). */
  subject?: Record<string, unknown>;
  admissions?: {
    applications?: Array<{
      id: string;
      status: string;
      review_days: number;
      [key: string]: unknown;
    }>;
  };
  finance?: {
    overdue_payments?: Array<{
      id: string;
      days_overdue: number;
      amount?: number;
      [key: string]: unknown;
    }>;
  };
  hr?: {
    missing_timesheets?: Array<{
      id: string;
      employee_id: string;
      period?: string;
      [key: string]: unknown;
    }>;
  };
  classes?: {
    enrollments?: Array<{
      id: string;
      enrolled: number;
      minimum: number;
      [key: string]: unknown;
    }>;
  };
  staff?: {
    invitations?: Array<{
      id: string;
      expires_in_days: number;
      [key: string]: unknown;
    }>;
  };
  platform?: {
    failed_jobs?: Array<{
      id: string;
      name?: string;
      [key: string]: unknown;
    }>;
  };
  /** Arbitrary extras for custom conditions. */
  [key: string]: unknown;
};

export type AutomationRunStatus =
  | "success"
  | "skipped"
  | "failed"
  | "partial";

export type AutomationRun = {
  id: string;
  ruleId: string;
  ruleName: string;
  trigger: AutomationTriggerKind;
  status: AutomationRunStatus;
  startedAt: string;
  finishedAt: string;
  subjectKey: string | null;
  decisionsCreated: string[];
  notificationsCreated: string[];
  actionsExecuted: string[];
  error: string | null;
  skippedReason: string | null;
};

export type AutomationBatchResult = {
  trigger: AutomationTriggerKind | "schedule" | "all";
  cadence: AutomationScheduleCadence | null;
  ranAt: string;
  runs: AutomationRun[];
  decisionsCreated: string[];
  notificationsCreated: string[];
  failures: number;
};

export type AutomationStatusSnapshot = {
  totalRules: number;
  activeRules: number;
  disabledRules: number;
  recentRuns: AutomationRun[];
  decisionsCreated: number;
  failures: number;
  lastRunAt: string | null;
};

export type RunAutomationInput = {
  facts: OperationalFacts;
  /** When set, only rules with this trigger run. */
  trigger?: AutomationTriggerKind;
  /** When set, only rules whose schedule matches. */
  cadence?: AutomationScheduleCadence;
  actorUserId?: string | null;
  now?: string;
  /** Max recent runs retained in process store (default 100). */
  retainRuns?: number;
};
