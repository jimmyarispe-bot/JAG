/**
 * Intelligence common primitives — Stabilization A2 / A3.
 *
 * Leaf package for shared scoring, repository, and registry helpers.
 * Domains import from here; this package must not import domains.
 */

export {
  clamp,
  clampUnchecked,
  clamp01,
  clamp01NaNSafe,
  lightScore,
  lightScoreClamped,
} from "@/lib/platform/intelligence/common/numeric";

export {
  statusFromScore,
  signalStatusFromScore,
  priorityFromScoreLowUrgent,
  priorityFromScoreHighHealthy,
  priorityFromScoreHighUrgent,
  priorityBandFromScore01,
  priorityFromRisk,
  levelFromValue,
  levelFromValueFunding,
  levelFromValue01,
  outlookFromScoreConfigured,
  OUTLOOK_THRESHOLDS_STANDARD,
  OUTLOOK_THRESHOLDS_ELEVATED,
  OUTLOOK_THRESHOLDS_WISDOM,
  type StandardHealthStatus,
  type StandardPriorityBand,
  type StandardConfidenceLevel,
  type OutlookBandConfig,
} from "@/lib/platform/intelligence/common/bands";

export {
  buildConfidenceAverage,
  buildConfidenceAverageEmptyHalf,
  buildConfidenceAverageFunding,
  buildConfidenceSum,
  scoreNarrative,
  type ConfidenceFactor,
  type ConfidenceScoreShape,
  type ConfidenceLevelMapper,
} from "@/lib/platform/intelligence/common/confidence";

export {
  defaultCreateId,
  periodLabelQuarter,
  periodLabelIsoMonth,
  periodLabelLocaleMonthYear,
  periodLabelLocaleMonthUtcYear,
  emptyGraphScope,
} from "@/lib/platform/intelligence/common/ids";

export {
  matchesGraphScope,
  type GraphScopeLike,
} from "@/lib/platform/intelligence/common/scope";

export {
  InMemoryResultHistoryRepository,
  type ResultWithRequestId,
  type HistoryWithScope,
  type ClearHistoryMode,
  type InMemoryResultHistoryRepositoryOptions,
} from "@/lib/platform/intelligence/common/in-memory-repository";

export {
  PublisherRegistryArray,
  PublisherRegistryMap,
  type PublisherEntry,
} from "@/lib/platform/intelligence/common/publisher-registry";

export type {
  ResultHistoryRepositoryContract,
  PublisherRegistryContract,
  IntelligenceServiceFacadeContract,
} from "@/lib/platform/intelligence/common/contract-conventions";
