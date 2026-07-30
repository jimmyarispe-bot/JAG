/**
 * WatcherAlert — proactive finding for the executive inbox — Sprint 206.
 * Advisory only. Never an autonomous decision.
 */

import type {
  AlertStatus,
  WatcherPriority,
  WatcherType,
} from "./WatcherRule";

export type WatcherEvidenceRef = {
  readonly id: string;
  readonly source: string;
  readonly summary: string;
};

export type WatcherExplanation = {
  readonly evidence: readonly WatcherEvidenceRef[];
  readonly policies: readonly string[];
  readonly forecasts: readonly string[];
  readonly scenarios: readonly string[];
  readonly memory: readonly string[];
  readonly contributors: readonly string[];
  readonly timeline: readonly { readonly at: string; readonly message: string }[];
};

export type WatcherAlert = {
  readonly id: string;
  readonly organizationId: string;
  readonly organizationName: string;
  readonly watcherId: string;
  readonly type: WatcherType;
  readonly title: string;
  readonly summary: string;
  readonly severity: WatcherPriority;
  readonly confidence: number;
  readonly evidence: readonly WatcherEvidenceRef[];
  readonly primaryDrivers: readonly string[];
  readonly supportingContributors: readonly string[];
  readonly recommendedExecutiveAction: string;
  readonly relatedDecisionIds: readonly string[];
  readonly relatedGoalIds: readonly string[];
  readonly relatedMemoryIds: readonly string[];
  readonly explanation: WatcherExplanation;
  readonly status: AlertStatus;
  readonly fingerprint: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly acknowledgedAt?: string;
  readonly dismissedAt?: string;
  readonly resolvedAt?: string;
  readonly advisoryNotice: string;
};

export type WatcherDigest = {
  readonly id: string;
  readonly kind: import("./WatcherRule").DigestKind;
  readonly organizationId: string;
  readonly organizationName: string;
  readonly title: string;
  readonly generatedAt: string;
  readonly alertIds: readonly string[];
  readonly highlights: readonly string[];
  readonly criticalCount: number;
  readonly highCount: number;
  readonly advisoryNotice: string;
};
