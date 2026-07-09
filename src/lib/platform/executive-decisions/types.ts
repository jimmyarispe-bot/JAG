/** Executive Decision Queue — Sprint 002 Task 4 */

import type { ExecutiveMetricsFilters } from "@/lib/platform/executive-metrics";

export type ExecutiveDecisionType =
  | "Approval"
  | "Escalation"
  | "Review"
  | "Exception"
  | "Financial"
  | "Compliance"
  | "Staffing"
  | "Admissions"
  | "Operations"
  | "Strategic";

export type ExecutiveDecisionStatus =
  | "Open"
  | "Acknowledged"
  | "Delegated"
  | "Waiting"
  | "Completed"
  | "Dismissed";

export type ExecutiveDecisionSeverity = "Critical" | "High" | "Medium" | "Low";

export type ExecutiveDecisionConfidence = "High" | "Medium" | "Low" | "Unknown";

export type ExecutiveDecisionSourceKind =
  | "executive_alerts"
  | "mission_control"
  | "jag_work"
  | "workflow"
  | "activity"
  | "kpi_snapshots";

export interface ExecutiveDecisionSourceRef {
  source: ExecutiveDecisionSourceKind;
  sourceId: string;
  label?: string;
}

export interface ExecutiveDecisionHistoryEntry {
  at: string;
  action:
    | "created"
    | "acknowledged"
    | "delegated"
    | "waiting"
    | "completed"
    | "dismissed"
    | "reopened"
    | "follow_up"
    | "linked";
  actorUserId?: string | null;
  note?: string | null;
  toOwner?: string | null;
  dueDate?: string | null;
}

/** Scope filters (mirrors executive metrics / alerts). */
export type ExecutiveDecisionsFilters = ExecutiveMetricsFilters;

export interface ExecutiveDecisionsScope {
  networkId: string | null;
  regionId: string | null;
  campusId: string | null;
  programId: string | null;
  program: string | null;
  organizationId: string | null;
  schoolId: string | null;
}

/**
 * Canonical executive decision — composed view over existing work systems.
 * Does not invent a second work queue or workflow engine.
 */
export interface ExecutiveDecision {
  id: string;
  title: string;
  summary: string;
  decisionType: ExecutiveDecisionType;
  /** 1–100; higher = more urgent. */
  priority: number;
  severity: ExecutiveDecisionSeverity;
  confidence: ExecutiveDecisionConfidence;
  organization: string | null;
  region: string | null;
  campus: string | null;
  program: string | null;
  status: ExecutiveDecisionStatus;
  recommendedAction: string | null;
  recommendedOwner: string | null;
  dueDate: string | null;
  blocking: boolean;
  relatedAlerts: string[];
  relatedActivities: string[];
  relatedWorkflow: string | null;
  relatedMissionControlItem: string | null;
  relatedJagWorkItem: string | null;
  createdAt: string;
  updatedAt: string;
  /** Stable merge key across producers. */
  mergeKey: string;
  /** Logical decision signal for cross-source merge. */
  signalKey: string;
  sources: ExecutiveDecisionSourceRef[];
  history: ExecutiveDecisionHistoryEntry[];
  /** Optional entity for entity-level merge. */
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  /** Scoring hints preserved from adapters. */
  financialImpact: boolean;
  studentImpact: boolean;
  complianceRisk: boolean;
}

/** Adapter output before merge / score. */
export interface ExecutiveDecisionDraft {
  signalKey: string;
  title: string;
  summary: string;
  decisionType: ExecutiveDecisionType;
  severity: ExecutiveDecisionSeverity;
  confidence: ExecutiveDecisionConfidence;
  organization: string | null;
  region: string | null;
  campus: string | null;
  program: string | null;
  status?: ExecutiveDecisionStatus;
  recommendedAction?: string | null;
  recommendedOwner?: string | null;
  dueDate?: string | null;
  blocking?: boolean;
  relatedAlerts?: string[];
  relatedActivities?: string[];
  relatedWorkflow?: string | null;
  relatedMissionControlItem?: string | null;
  relatedJagWorkItem?: string | null;
  createdAt: string;
  updatedAt?: string;
  source: ExecutiveDecisionSourceRef;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  financialImpact?: boolean;
  studentImpact?: boolean;
  complianceRisk?: boolean;
  history?: ExecutiveDecisionHistoryEntry[];
}

export interface ExecutiveDecisionQueue {
  scope: ExecutiveDecisionsScope;
  builtAt: string;
  decisions: ExecutiveDecision[];
  rawDraftCount: number;
  mergedAway: number;
  counts: Record<ExecutiveDecisionStatus, number>;
}

export interface BuildExecutiveDecisionQueueInput {
  scope: ExecutiveDecisionsScope;
  drafts: ExecutiveDecisionDraft[];
  builtAt?: string;
  /** Include Completed / Dismissed. Default false. */
  includeClosed?: boolean;
}

export interface GetExecutiveDecisionQueueOptions {
  filters?: ExecutiveDecisionsFilters;
  includeClosed?: boolean;
  limit?: number;
  /** Prefer decision types filter (optional). */
  decisionTypes?: ExecutiveDecisionType[];
}

export const EXECUTIVE_DECISION_TYPES: ExecutiveDecisionType[] = [
  "Approval",
  "Escalation",
  "Review",
  "Exception",
  "Financial",
  "Compliance",
  "Staffing",
  "Admissions",
  "Operations",
  "Strategic",
];

export const EXECUTIVE_DECISION_STATUSES: ExecutiveDecisionStatus[] = [
  "Open",
  "Acknowledged",
  "Delegated",
  "Waiting",
  "Completed",
  "Dismissed",
];

export const DECISION_SEVERITY_RANK: Record<ExecutiveDecisionSeverity, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

/** Source precedence when merging fields (higher wins for identity links). */
export const DECISION_SOURCE_PRECEDENCE: Record<ExecutiveDecisionSourceKind, number> = {
  mission_control: 50,
  workflow: 40,
  jag_work: 30,
  executive_alerts: 20,
  kpi_snapshots: 10,
  activity: 5,
};
