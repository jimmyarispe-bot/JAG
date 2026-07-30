/**
 * WatcherEvaluation — inputs and candidate findings — Sprint 206.
 */

import type { WatcherEvidenceRef } from "./WatcherAlert";
import type { WatcherPriority, WatcherType } from "./WatcherRule";

export type WatcherSignal = {
  readonly id: string;
  readonly kind: string;
  readonly label: string;
  readonly score: number;
  readonly confidence: number;
  readonly summary: string;
  readonly decisionId?: string;
  readonly goalId?: string;
  readonly memoryId?: string;
  readonly forecastId?: string;
  readonly scenarioId?: string;
  readonly tags?: readonly string[];
};

export type WatcherEvaluationContext = {
  readonly organizationId: string;
  readonly organizationName: string;
  readonly evaluatedAt: string;
  readonly signals: readonly WatcherSignal[];
  readonly openDecisionCount: number;
  readonly overdueDecisionCount: number;
  readonly goalsAtRisk: readonly string[];
  readonly goalsBlocked: readonly string[];
  readonly initiativesBehind: readonly string[];
  readonly missionTrend: string;
  readonly alignmentScore: number;
  readonly memoryPatternSummaries: readonly string[];
  readonly forecastRisks: readonly string[];
};

export type WatcherCandidate = {
  readonly watcherId: string;
  readonly type: WatcherType;
  readonly title: string;
  readonly summary: string;
  readonly severity: WatcherPriority;
  readonly score: number;
  readonly confidence: number;
  readonly evidence: readonly WatcherEvidenceRef[];
  readonly primaryDrivers: readonly string[];
  readonly supportingContributors: readonly string[];
  readonly recommendedExecutiveAction: string;
  readonly relatedDecisionIds: readonly string[];
  readonly relatedGoalIds: readonly string[];
  readonly relatedMemoryIds: readonly string[];
  readonly policies: readonly string[];
  readonly forecasts: readonly string[];
  readonly scenarios: readonly string[];
  readonly memory: readonly string[];
  readonly fingerprintKey: string;
};

export type WatcherEvaluationResult = {
  readonly organizationId: string;
  readonly evaluatedAt: string;
  readonly durationMs: number;
  readonly candidates: readonly WatcherCandidate[];
  readonly suppressedCount: number;
  readonly advisoryNotice: string;
};
