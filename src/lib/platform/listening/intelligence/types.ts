/**
 * Slice 4.0 — Listening Intelligence Engine types.
 * DB signal_type is constrained by migration 214; semantic classes live in metadata.
 */

export const LISTENING_SIGNAL_CLASSES = [
  "theme",
  "strength",
  "concern",
  "opportunity",
  "risk",
  "question",
  "suggestion",
  "unknown",
] as const;
export type ListeningSignalClass = (typeof LISTENING_SIGNAL_CLASSES)[number];

/** Migration 214 check constraint values. */
export const LISTENING_DB_SIGNAL_TYPES = [
  "priority",
  "theme",
  "tension",
  "opportunity",
  "other",
] as const;
export type ListeningDbSignalType = (typeof LISTENING_DB_SIGNAL_TYPES)[number];

export function mapSignalClassToDbType(
  signalClass: ListeningSignalClass
): ListeningDbSignalType {
  switch (signalClass) {
    case "theme":
      return "theme";
    case "opportunity":
      return "opportunity";
    case "concern":
    case "risk":
      return "tension";
    case "strength":
    case "question":
    case "suggestion":
    case "unknown":
      return "other";
  }
}

export type ListeningNormalizedText = {
  readonly answerId: string;
  readonly responseId: string;
  readonly questionId: string;
  readonly questionPrompt: string;
  readonly rawText: string;
  readonly normalized: string;
  readonly tokens: readonly string[];
};

export type ListeningThemeGroup = {
  readonly groupKey: string;
  readonly label: string;
  readonly members: readonly ListeningNormalizedText[];
};

export type ListeningExtractedSignal = {
  readonly signalClass: ListeningSignalClass;
  readonly title: string;
  readonly description: string;
  readonly confidence: number;
  readonly supportCount: number;
  readonly questionId: string | null;
  readonly evidence: readonly {
    readonly evidenceKind: "answer" | "aggregate" | "question";
    readonly answerId?: string;
    readonly questionId?: string;
    readonly responseId?: string;
    readonly label: string;
    /** May contain excerpt — redacted for non-RAW readers. */
    readonly payload: Record<string, unknown>;
  }[];
};

export type ListeningQuestionMetrics = {
  readonly questionId: string;
  readonly questionType: string;
  readonly prompt: string;
  readonly answeredCount: number;
  readonly completionRate: number;
  readonly averageTextLength?: number;
  readonly choiceDistribution?: Record<string, number>;
  readonly likertDistribution?: Record<string, number>;
  readonly numericSummary?: {
    readonly count: number;
    readonly min: number;
    readonly max: number;
    readonly mean: number;
  };
};

export type ListeningCampaignMetrics = {
  readonly completionCount: number;
  /** Mean fraction of questions answered across responses (0–1). */
  readonly completionRate: number;
  readonly averageResponseLength: number;
  readonly questionCompletion: readonly ListeningQuestionMetrics[];
  readonly engine: "deterministic_v1";
};

export type ListeningAnalysisRunResult = {
  readonly analysisRunId: string;
  readonly organizationId: string;
  readonly campaignId: string;
  readonly status: "succeeded" | "failed";
  readonly signalCount: number;
  readonly evidenceCount: number;
  readonly metrics: ListeningCampaignMetrics;
  readonly errorSummary?: string;
};

export type ListeningSignalRow = {
  readonly id: string;
  readonly organizationId: string;
  readonly campaignId: string;
  readonly analysisRunId: string | null;
  readonly signalKind: string;
  readonly signalType: string;
  readonly signalClass: ListeningSignalClass;
  readonly title: string;
  readonly description: string;
  readonly status: string;
  readonly confidence: number | null;
  readonly supportCount: number;
  readonly instrumentId: string | null;
  readonly instrumentVersionId: string | null;
  readonly createdAt: string;
  readonly metadata: Record<string, unknown>;
};

export type ListeningEvidenceRow = {
  readonly id: string;
  readonly signalId: string;
  readonly evidenceKind: string;
  readonly answerId: string | null;
  readonly questionId: string | null;
  readonly responseId: string | null;
  readonly label: string;
  readonly payload: Record<string, unknown>;
  readonly createdAt: string;
};

/** Pluggable grouping — deterministic now; AI clustering later. */
export interface ListeningThemeGrouper {
  readonly id: string;
  group(units: readonly ListeningNormalizedText[]): ListeningThemeGroup[];
}
