/**
 * Recommendation — suggested action grounded in findings/evidence.
 */

import type { Confidence } from "@/jag/intelligence/contracts/confidence";
import { isConfidence } from "@/jag/intelligence/contracts/confidence";

export type RecommendationPriority = "low" | "medium" | "high" | "urgent";

export type Recommendation = {
  readonly id: string;
  readonly action: string;
  readonly rationale: string;
  readonly findingIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly confidence: Confidence;
  readonly priority?: RecommendationPriority;
  /** Optional links into work / decision / policy artifacts. */
  readonly suggestedArtifactRefs?: readonly {
    readonly kind: "work" | "decision" | "policy" | "document";
    readonly refId: string;
  }[];
};

export function isRecommendation(value: unknown): value is Recommendation {
  if (!value || typeof value !== "object") return false;
  const v = value as Recommendation;
  return (
    typeof v.id === "string" &&
    v.id.length > 0 &&
    typeof v.action === "string" &&
    typeof v.rationale === "string" &&
    Array.isArray(v.findingIds) &&
    Array.isArray(v.evidenceIds) &&
    isConfidence(v.confidence)
  );
}
