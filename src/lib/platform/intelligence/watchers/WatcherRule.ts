/**
 * WatcherRule — Sprint 206 Autonomous Executive Intelligence.
 * Application layer only. Watchers never execute organizational decisions.
 */

export const WATCHER_TYPES = [
  "strategic_risk",
  "operational_risk",
  "funding_risk",
  "enrollment_risk",
  "compliance_risk",
  "decision_risk",
  "forecast_drift",
  "goal_drift",
  "opportunity_detection",
  "executive_attention",
  "custom",
] as const;

export type WatcherType = (typeof WATCHER_TYPES)[number];

export const WATCHER_TYPE_LABELS: Record<WatcherType, string> = {
  strategic_risk: "Strategic Risk",
  operational_risk: "Operational Risk",
  funding_risk: "Funding Risk",
  enrollment_risk: "Enrollment Risk",
  compliance_risk: "Compliance Risk",
  decision_risk: "Decision Risk",
  forecast_drift: "Forecast Drift",
  goal_drift: "Goal Drift",
  opportunity_detection: "Opportunity Detection",
  executive_attention: "Executive Attention",
  custom: "Custom",
};

export const WATCHER_PRIORITIES = [
  "critical",
  "high",
  "medium",
  "low",
  "informational",
] as const;

export type WatcherPriority = (typeof WATCHER_PRIORITIES)[number];

export type WatcherRule = {
  readonly id: string;
  readonly type: WatcherType;
  readonly label: string;
  readonly description: string;
  readonly enabled: boolean;
  readonly defaultPriority: WatcherPriority;
  /** Minimum severity score 0–1 before an alert is emitted. */
  readonly threshold: number;
  readonly scheduleHint: WatcherScheduleKind;
};

export const WATCHER_SCHEDULE_KINDS = [
  "continuous",
  "morning",
  "afternoon",
  "weekly",
  "monthly",
  "board",
] as const;

export type WatcherScheduleKind = (typeof WATCHER_SCHEDULE_KINDS)[number];

export const DIGEST_KINDS = [
  "morning",
  "afternoon",
  "weekly",
  "monthly",
  "board",
] as const;

export type DigestKind = (typeof DIGEST_KINDS)[number];

export const ALERT_STATUSES = [
  "open",
  "acknowledged",
  "dismissed",
  "resolved",
  "suppressed",
] as const;

export type AlertStatus = (typeof ALERT_STATUSES)[number];
