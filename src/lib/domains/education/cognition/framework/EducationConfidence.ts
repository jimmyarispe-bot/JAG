/**
 * Shared confidence utilities for Education cognitive contributors.
 */

export const EducationConfidenceLevel = {
  High: "high",
  Medium: "medium",
  Low: "low",
} as const;

export type EducationConfidenceLevel =
  (typeof EducationConfidenceLevel)[keyof typeof EducationConfidenceLevel];

export const EDUCATION_CONFIDENCE_THRESHOLDS = {
  high: 0.85,
  medium: 0.55,
} as const;

export function clampConfidence(score: number): number {
  return Math.max(0, Math.min(1, Number(score.toFixed(4))));
}

export function confidenceLevelFromScore(
  score: number
): EducationConfidenceLevel {
  const n = clampConfidence(score);
  if (n >= EDUCATION_CONFIDENCE_THRESHOLDS.high) {
    return EducationConfidenceLevel.High;
  }
  if (n >= EDUCATION_CONFIDENCE_THRESHOLDS.medium) {
    return EducationConfidenceLevel.Medium;
  }
  return EducationConfidenceLevel.Low;
}

export function scoreFromConfidenceLevel(
  level: EducationConfidenceLevel
): number {
  switch (level) {
    case EducationConfidenceLevel.High:
      return 0.9;
    case EducationConfidenceLevel.Medium:
      return 0.7;
    case EducationConfidenceLevel.Low:
      return 0.4;
  }
}

export function normalizeConfidence(input: number | EducationConfidenceLevel): number {
  if (typeof input === "number") return clampConfidence(input);
  return scoreFromConfidenceLevel(input);
}

/**
 * Default readiness confidence from blocker/warning counts.
 * Matches Enrollment D2.1 scoring (behavior-preserving for that contributor).
 */
export function scoreReadinessConfidence(input: {
  blockingCount: number;
  warningCount: number;
}): {
  confidence: number;
  level: EducationConfidenceLevel;
  readiness: "ready" | "blocked" | "conditional";
} {
  let confidence = 1;
  confidence -= input.blockingCount * 0.18;
  confidence -= input.warningCount * 0.06;
  confidence = clampConfidence(confidence);

  let readiness: "ready" | "blocked" | "conditional";
  if (input.blockingCount > 0) {
    readiness = "blocked";
  } else if (input.warningCount > 0) {
    readiness = "conditional";
    confidence = Math.min(confidence, 0.82);
  } else {
    readiness = "ready";
    confidence = Math.max(confidence, 0.88);
  }

  return {
    confidence: clampConfidence(confidence),
    level: confidenceLevelFromScore(confidence),
    readiness,
  };
}
