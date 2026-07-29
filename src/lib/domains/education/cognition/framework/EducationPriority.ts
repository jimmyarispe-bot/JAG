/**
 * Shared priority levels for Education cognitive contributors.
 */

export const EducationPriority = {
  Critical: "critical",
  High: "high",
  Medium: "medium",
  Low: "low",
  Informational: "informational",
} as const;

export type EducationPriorityLevel =
  (typeof EducationPriority)[keyof typeof EducationPriority];

/** Numeric rank — lower is more urgent (matches Enrollment D2.1). */
export const EDUCATION_PRIORITY_RANK: Record<EducationPriorityLevel, number> = {
  critical: 1,
  high: 2,
  medium: 3,
  low: 4,
  informational: 5,
};

export function priorityRank(level: EducationPriorityLevel): number {
  return EDUCATION_PRIORITY_RANK[level];
}

export function priorityLevelFromRank(rank: number): EducationPriorityLevel {
  if (rank <= 1) return EducationPriority.Critical;
  if (rank === 2) return EducationPriority.High;
  if (rank === 3) return EducationPriority.Medium;
  if (rank === 4) return EducationPriority.Low;
  return EducationPriority.Informational;
}

export function normalizePriority(
  input: number | EducationPriorityLevel
): { rank: number; level: EducationPriorityLevel } {
  if (typeof input === "number") {
    const rank = Math.max(1, Math.min(5, Math.round(input)));
    return { rank, level: priorityLevelFromRank(rank) };
  }
  return { rank: priorityRank(input), level: input };
}

/** Overall result priority from readiness (Enrollment-compatible). */
export function readinessPriorityRank(
  readiness: "ready" | "blocked" | "conditional"
): number {
  if (readiness === "blocked") return 1;
  if (readiness === "conditional") return 2;
  return 3;
}
