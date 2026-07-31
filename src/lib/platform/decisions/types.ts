/**
 * Platform Decision Center (Sprint 066).
 * Execution layer: Recommendations → tracked Decisions.
 */

import type { IntelligencePriorityLevel } from "@/lib/platform/intelligence/executive-layer/types";

export type DecisionStatus =
  | "open"
  | "assigned"
  | "in_progress"
  | "waiting"
  | "completed"
  | "dismissed";

export type DecisionOwnerRole =
  | "founder"
  | "executive_director"
  | "school_leader"
  | "teacher"
  | "employee";

export type DecisionHistoryAction =
  | "created"
  | "assigned"
  | "reassigned"
  | "started"
  | "completed"
  | "dismissed"
  | "updated_from_recommendation"
  | "waiting"
  | "due_date_changed"
  | "priority_escalated"
  | "created_by_automation";

export type DecisionPriority = IntelligencePriorityLevel;

export type DecisionHistoryEntry = {
  id: string;
  action: DecisionHistoryAction;
  actorUserId: string | null;
  actorRole: DecisionOwnerRole | null;
  timestamp: string;
  reason: string | null;
  /** Status after this transition (when applicable). */
  toStatus: DecisionStatus | null;
  toOwnerRole: DecisionOwnerRole | null;
  toOwnerUserId: string | null;
};

export type DecisionOwner = {
  role: DecisionOwnerRole;
  userId: string | null;
  displayName: string | null;
};

export type PlatformDecision = {
  id: string;
  /** Stable key for dedupe across syncs. */
  mergeKey: string;
  sourceInsightId: string | null;
  sourceRecommendationId: string | null;
  signalIds: string[];
  title: string;
  description: string;
  organizationId: string | null;
  applicationId: string | null;
  priority: DecisionPriority;
  owner: DecisionOwner | null;
  status: DecisionStatus;
  createdAt: string;
  updatedAt: string;
  dueDate: string | null;
  completedAt: string | null;
  outcome: string | null;
  history: DecisionHistoryEntry[];
};

export type DecisionQueue = {
  organizationId: string | null;
  decisions: PlatformDecision[];
  counts: Record<DecisionStatus, number>;
  syncedAt: string;
};

export type SyncRecommendationsInput = {
  organizationId: string | null;
  applicationId?: string | null;
  recommendations: Array<{
    id: string;
    action: string;
    priority: DecisionPriority;
    signalIds: string[];
    insightIds: string[];
    domain: string;
  }>;
  insightsById?: Record<string, { statement: string } | undefined>;
  actorUserId?: string | null;
  defaultOwnerRole?: DecisionOwnerRole;
  /** ISO timestamp for deterministic tests. */
  now?: string;
  /** Days until due from create/update (default 7). */
  dueInDays?: number;
};

export type TransitionDecisionInput = {
  decisionId: string;
  toStatus: DecisionStatus;
  actorUserId?: string | null;
  actorRole?: DecisionOwnerRole | null;
  reason?: string | null;
  outcome?: string | null;
  now?: string;
};

export type AssignDecisionInput = {
  decisionId: string;
  ownerRole: DecisionOwnerRole;
  ownerUserId?: string | null;
  ownerDisplayName?: string | null;
  actorUserId?: string | null;
  actorRole?: DecisionOwnerRole | null;
  reason?: string | null;
  now?: string;
  /** Manual due-date override (ISO). */
  dueDate?: string | null;
  /** When true (default), emit an in-app assignment notification. */
  notify?: boolean;
};

export type SetDecisionDueDateInput = {
  decisionId: string;
  dueDate: string;
  actorUserId?: string | null;
  actorRole?: DecisionOwnerRole | null;
  reason?: string | null;
  now?: string;
};

export type CreateDecisionInput = {
  /** Stable key — active decisions with the same key are not duplicated. */
  mergeKey: string;
  title: string;
  description: string;
  organizationId: string | null;
  applicationId?: string | null;
  priority: DecisionPriority;
  ownerRole?: DecisionOwnerRole;
  signalIds?: string[];
  sourceInsightId?: string | null;
  sourceRecommendationId?: string | null;
  actorUserId?: string | null;
  now?: string;
  dueInDays?: number;
  dueDate?: string | null;
  /** History reason (defaults to automation/create wording). */
  reason?: string | null;
  historyAction?: Extract<
    DecisionHistoryAction,
    "created" | "created_by_automation"
  >;
};

export type EscalateDecisionPriorityInput = {
  decisionId: string;
  priority: DecisionPriority;
  actorUserId?: string | null;
  actorRole?: DecisionOwnerRole | null;
  reason?: string | null;
  now?: string;
};
