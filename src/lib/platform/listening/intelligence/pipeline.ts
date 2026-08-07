/**
 * Pure analysis pipeline — no I/O.
 * AI clustering can swap ListeningThemeGrouper later.
 */

import { extractListeningSignals } from "./extract";
import { DeterministicThemeGrouper } from "./grouping";
import {
  computeCampaignMetrics,
  type ListeningAnswerRow,
  type ListeningQuestionRow,
  type ListeningResponseRow,
} from "./metrics";
import type {
  ListeningCampaignMetrics,
  ListeningExtractedSignal,
  ListeningThemeGrouper,
} from "./types";

export type ListeningAnalysisPlan = {
  readonly metrics: ListeningCampaignMetrics;
  readonly signals: readonly ListeningExtractedSignal[];
  readonly engine: "deterministic_v1";
  readonly grouperId: string;
};

export function planListeningAnalysis(input: {
  readonly responses: readonly ListeningResponseRow[];
  readonly questions: readonly ListeningQuestionRow[];
  readonly answers: readonly ListeningAnswerRow[];
  readonly grouper?: ListeningThemeGrouper;
}): ListeningAnalysisPlan {
  const grouper = input.grouper ?? new DeterministicThemeGrouper();
  const metrics = computeCampaignMetrics({
    responses: input.responses,
    questions: input.questions,
    answers: input.answers,
  });
  const signals = extractListeningSignals({
    answers: input.answers,
    questions: input.questions,
    metrics,
    grouper,
  });
  return {
    metrics,
    signals,
    engine: "deterministic_v1",
    grouperId: grouper.id,
  };
}
