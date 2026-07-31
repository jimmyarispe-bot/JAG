/**
 * Confidence — how strongly the system stands behind a finding/recommendation.
 * Deterministic scoring hooks only; no model logits required.
 */

export type ConfidenceLevel =
  | "very_low"
  | "low"
  | "medium"
  | "high"
  | "very_high";

export type Confidence = {
  readonly level: ConfidenceLevel;
  /** Optional 0–1 score for deterministic pipelines. */
  readonly score?: number;
  readonly rationale?: string;
};

export function isConfidence(value: unknown): value is Confidence {
  if (!value || typeof value !== "object") return false;
  const v = value as Confidence;
  return (
    typeof v.level === "string" &&
    ["very_low", "low", "medium", "high", "very_high"].includes(v.level) &&
    (v.score === undefined ||
      (typeof v.score === "number" && v.score >= 0 && v.score <= 1))
  );
}
