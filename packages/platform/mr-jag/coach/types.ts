/**
 * P-004 — Coach engine types (additive to P-001 CoachTip / CoachTrigger).
 */

import type { CoachTrigger, MrJagPersona } from "../types";

/** Built-in observation events + custom registrations. */
export type CoachEventKind =
  | CoachTrigger
  | "first_organization_setup"
  | "first_school"
  | "first_employee"
  | "first_class"
  | "first_enrollment"
  | "first_tuition_payment"
  | "first_report"
  | "first_connector"
  | "first_backup"
  | "first_executive_intelligence_review"
  | "first_certification"
  | (string & {});

export type CoachingType =
  | "milestone"
  | "behavior"
  | "risk"
  | "efficiency"
  | "compliance"
  | "learning"
  | "executive";

export type CoachingTone =
  | "congratulations"
  | "suggestion"
  | "warning"
  | "best_practice"
  | "next_step"
  | "learning"
  | "workflow";

export type CoachObservationEvent = {
  readonly id: string;
  readonly kind: CoachEventKind;
  readonly organizationId: string;
  readonly userId: string;
  readonly persona: MrJagPersona;
  readonly occurredAt: string;
  readonly metadata?: Readonly<Record<string, string | number | boolean>>;
};

export type CoachRecommendation = {
  readonly id: string;
  readonly type: CoachingType;
  readonly tone: CoachingTone;
  readonly persona: MrJagPersona;
  readonly title: string;
  readonly body: string;
  readonly priorityScore: number;
  readonly urgency: number;
  readonly businessImpact: number;
  readonly riskScore: number;
  readonly confidence: number;
  readonly pageId?: string | null;
  readonly walkthroughId?: string | null;
  readonly lessonId?: string | null;
  readonly relatedEventKind?: CoachEventKind | null;
  readonly createdAt: string;
};

export type CoachRiskSeverity = "low" | "medium" | "high" | "critical";

export type CoachRiskKind =
  | "incomplete_onboarding"
  | "missing_backups"
  | "unused_features"
  | "low_training_completion"
  | "repeated_help_requests"
  | "configuration_issues"
  | "inactive_workflows"
  | "unapproved_payroll"
  | "unresolved_incidents"
  | "connector_failures"
  | "expired_certifications";

export type CoachRisk = {
  readonly id: string;
  readonly kind: CoachRiskKind;
  readonly severity: CoachRiskSeverity;
  readonly title: string;
  readonly body: string;
  readonly organizationId: string;
  readonly userId: string;
  readonly persona: MrJagPersona;
  readonly open: boolean;
  readonly detectedAt: string;
  readonly relatedEventKinds: readonly CoachEventKind[];
};

export type CoachGoalHorizon = "daily" | "weekly" | "monthly" | "milestone";

export type CoachGoal = {
  readonly id: string;
  readonly organizationId: string;
  readonly userId: string;
  readonly persona: MrJagPersona;
  readonly horizon: CoachGoalHorizon;
  readonly title: string;
  readonly description: string;
  readonly targetCount: number;
  readonly completedCount: number;
  readonly completionPercent: number;
  readonly relatedEventKind?: CoachEventKind | null;
  readonly dueAt: string | null;
  readonly createdAt: string;
  readonly completedAt: string | null;
};

export type TimelineEntryStatus =
  | "active"
  | "accepted"
  | "dismissed"
  | "completed";

export type CoachTimelineEntry = {
  readonly id: string;
  readonly organizationId: string;
  readonly userId: string;
  readonly kind: "recommendation" | "risk" | "goal" | "milestone" | "event";
  readonly title: string;
  readonly body: string;
  readonly status: TimelineEntryStatus;
  readonly relatedId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type CoachDashboard = {
  readonly generatedAt: string;
  readonly todaysCoaching: readonly CoachRecommendation[];
  readonly recommendedActions: readonly CoachRecommendation[];
  readonly congratulations: readonly CoachRecommendation[];
  readonly warnings: readonly CoachRecommendation[];
  readonly openRisks: readonly CoachRisk[];
  readonly learningSuggestions: readonly CoachRecommendation[];
  readonly progress: {
    readonly eventsObserved: number;
    readonly milestonesHit: number;
    readonly goalsCompletionPercent: number;
    readonly acceptedRecommendations: number;
  };
  readonly upcomingGoals: readonly CoachGoal[];
};

export type CoachAnalyticsSnapshot = {
  readonly generatedAt: string;
  readonly eventsByKind: Readonly<Record<string, number>>;
  readonly recommendationsByType: Readonly<Record<string, number>>;
  readonly openRiskCount: number;
  readonly acceptedCount: number;
  readonly dismissedCount: number;
  readonly averagePriorityScore: number;
  readonly goalsCompletionPercent: number;
};

export type CustomEventRegistration = {
  readonly kind: string;
  readonly title: string;
  readonly description: string;
  readonly personas: readonly MrJagPersona[];
  readonly coachingType: CoachingType;
};
