/**
 * Common explanation formatter for Education recommendations.
 */

import {
  confidenceLevelFromScore,
  type EducationConfidenceLevel,
} from "./EducationConfidence";
import {
  normalizePriority,
  type EducationPriorityLevel,
} from "./EducationPriority";

export interface EducationFormattedExplanation {
  reason: string;
  evidence: readonly string[];
  confidence: number;
  confidenceLevel: EducationConfidenceLevel;
  priority: number;
  priorityLevel: EducationPriorityLevel;
  suggestedAction?: string;
  /** Single-line summary for bags / logs. */
  summary: string;
}

export function formatEducationExplanation(input: {
  reason: string;
  evidenceIds?: readonly string[];
  evidenceSummaries?: readonly string[];
  confidence: number;
  priority: number | EducationPriorityLevel;
  suggestedAction?: string;
}): EducationFormattedExplanation {
  const { rank, level } = normalizePriority(input.priority);
  const confidenceLevel = confidenceLevelFromScore(input.confidence);
  const evidence =
    input.evidenceSummaries ??
    input.evidenceIds ??
    [];

  const parts = [
    `Reason: ${input.reason}`,
    evidence.length ? `Evidence: ${evidence.join("; ")}` : null,
    `Confidence: ${input.confidence.toFixed(2)} (${confidenceLevel})`,
    `Priority: ${level} (${rank})`,
    input.suggestedAction
      ? `Suggested Action: ${input.suggestedAction}`
      : null,
  ].filter(Boolean);

  return {
    reason: input.reason,
    evidence,
    confidence: input.confidence,
    confidenceLevel,
    priority: rank,
    priorityLevel: level,
    suggestedAction: input.suggestedAction,
    summary: parts.join(" | "),
  };
}
