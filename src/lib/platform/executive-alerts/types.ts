/** Executive Alert Orchestrator — Sprint 002 Task 3 */

import type { ExecutiveMetricsFilters } from "@/lib/platform/executive-metrics";

export type ExecutiveAlertCategory =
  | "Financial"
  | "Enrollment"
  | "Admissions"
  | "Staffing"
  | "Compliance"
  | "Operations"
  | "Security"
  | "Executive";

export type ExecutiveAlertSeverity = "Critical" | "High" | "Medium" | "Low";

export type ExecutiveAlertConfidence = "High" | "Medium" | "Low" | "Unknown";

export type ExecutiveAlertStatus = "open" | "acknowledged" | "dismissed";

export type ExecutiveAlertSourceKind =
  | "kpi_snapshots"
  | "executive_metrics"
  | "activity"
  | "financial_intelligence"
  | "mission_control"
  | "compliance"
  | "hr"
  | "admissions"
  | "operational_loop"
  | "executive_insights";

export interface ExecutiveAlertRelatedEntity {
  type: string;
  id: string;
}

export interface ExecutiveAlertSourceRef {
  source: ExecutiveAlertSourceKind;
  sourceId: string;
  label?: string;
}

/** Scope filters for alert composition (mirrors executive metrics). */
export type ExecutiveAlertsFilters = ExecutiveMetricsFilters;

export interface ExecutiveAlertsScope {
  networkId: string | null;
  regionId: string | null;
  campusId: string | null;
  programId: string | null;
  program: string | null;
  organizationId: string | null;
  schoolId: string | null;
}

/**
 * Canonical executive alert — one issue, many source refs.
 * Does not invent a second notification store or work queue.
 */
export interface ExecutiveAlert {
  id: string;
  title: string;
  description: string;
  category: ExecutiveAlertCategory;
  severity: ExecutiveAlertSeverity;
  /** 1–100; higher = more urgent. */
  priority: number;
  confidence: ExecutiveAlertConfidence;
  organization: string | null;
  region: string | null;
  campus: string | null;
  program: string | null;
  relatedEntity: ExecutiveAlertRelatedEntity | null;
  /** Multiple Activity Engine event ids when known. */
  activityReferences: string[];
  workflowReference: string | null;
  jagWorkReference: string | null;
  missionControlReference: string | null;
  recommendedAction: string | null;
  createdAt: string;
  status: ExecutiveAlertStatus;
  acknowledgedAt: string | null;
  dismissedAt: string | null;
  /** Stable merge key across producers. */
  dedupeKey: string;
  /** Logical signal (e.g. finance.collection_rate, mc.item). */
  signalKey: string;
  sources: ExecutiveAlertSourceRef[];
}

/** Adapter output before scoring / dedupe. */
export interface ExecutiveAlertDraft {
  signalKey: string;
  title: string;
  description: string;
  category: ExecutiveAlertCategory;
  severity: ExecutiveAlertSeverity;
  confidence: ExecutiveAlertConfidence;
  organization: string | null;
  region: string | null;
  campus: string | null;
  program: string | null;
  relatedEntity: ExecutiveAlertRelatedEntity | null;
  activityReferences?: string[];
  workflowReference?: string | null;
  jagWorkReference?: string | null;
  missionControlReference?: string | null;
  recommendedAction?: string | null;
  createdAt: string;
  status?: ExecutiveAlertStatus;
  acknowledgedAt?: string | null;
  dismissedAt?: string | null;
  source: ExecutiveAlertSourceRef;
  /** Optional entity id for dedupe when relatedEntity is absent. */
  entityType?: string | null;
  entityId?: string | null;
}

export interface ExecutiveAlertStream {
  scope: ExecutiveAlertsScope;
  builtAt: string;
  alerts: ExecutiveAlert[];
  /** Count before dedupe. */
  rawDraftCount: number;
  /** Count removed by merge. */
  dedupedAway: number;
}

export interface BuildExecutiveAlertsInput {
  scope: ExecutiveAlertsScope;
  drafts: ExecutiveAlertDraft[];
  builtAt?: string;
  /** Include acknowledged/dismissed alerts. Default false. */
  includeClosed?: boolean;
}

export interface GetExecutiveAlertsOptions {
  filters?: ExecutiveAlertsFilters;
  includeClosed?: boolean;
  /** Cap returned open alerts after sort. */
  limit?: number;
}

export const EXECUTIVE_ALERT_CATEGORIES: ExecutiveAlertCategory[] = [
  "Financial",
  "Enrollment",
  "Admissions",
  "Staffing",
  "Compliance",
  "Operations",
  "Security",
  "Executive",
];

export const EXECUTIVE_ALERT_SEVERITIES: ExecutiveAlertSeverity[] = [
  "Critical",
  "High",
  "Medium",
  "Low",
];

export const SEVERITY_RANK: Record<ExecutiveAlertSeverity, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};
