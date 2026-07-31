/**
 * Executive Intelligence Layer v1 (Sprint 064).
 *
 * Lives under `intelligence/executive-layer` because the parent
 * `src/lib/platform/intelligence/` package already owns the broader
 * JAG Intelligence Engine (`service.ts`, `briefing/`, etc.).
 */

export type {
  ExecutiveIntelligenceResult,
  IntelligenceAnomaly,
  IntelligenceBriefSection,
  IntelligenceBriefSectionId,
  IntelligenceDomain,
  IntelligenceInsight,
  IntelligencePriorityLevel,
  IntelligenceRecommendation,
  IntelligenceSignal,
  IntelligenceSignalKey,
  PlatformDataSnapshot,
  PrioritizedInsight,
} from "@/lib/platform/intelligence/executive-layer/types";

export {
  collectSignals,
  findSignal,
  pctChange,
} from "@/lib/platform/intelligence/executive-layer/signals";

export { detectAnomalies } from "@/lib/platform/intelligence/executive-layer/anomalies";

export { generateInsights } from "@/lib/platform/intelligence/executive-layer/insights";

export {
  highestPriority,
  prioritizeInsights,
} from "@/lib/platform/intelligence/executive-layer/priorities";

export { generateRecommendations } from "@/lib/platform/intelligence/executive-layer/recommendations";

export { buildIntelligenceBrief } from "@/lib/platform/intelligence/executive-layer/briefing";

export {
  ExecutiveIntelligenceService,
  runExecutiveIntelligencePipeline,
  snapshotFromFounderMetrics,
} from "@/lib/platform/intelligence/executive-layer/service";
