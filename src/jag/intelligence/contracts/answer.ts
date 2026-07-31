/**
 * ExecutiveAnswer — composed response grounded in the organizational model.
 */

import type { Assumption } from "@/jag/intelligence/contracts/assumption";
import { isAssumption } from "@/jag/intelligence/contracts/assumption";
import type { Confidence } from "@/jag/intelligence/contracts/confidence";
import { isConfidence } from "@/jag/intelligence/contracts/confidence";
import type { DecisionTrace } from "@/jag/intelligence/contracts/decision-trace";
import { isDecisionTrace } from "@/jag/intelligence/contracts/decision-trace";
import type { Evidence } from "@/jag/intelligence/contracts/evidence";
import { isEvidence } from "@/jag/intelligence/contracts/evidence";
import type { Explanation } from "@/jag/intelligence/contracts/explanation";
import { isExplanation } from "@/jag/intelligence/contracts/explanation";
import type { Finding } from "@/jag/intelligence/contracts/finding";
import { isFinding } from "@/jag/intelligence/contracts/finding";
import type { Recommendation } from "@/jag/intelligence/contracts/recommendation";
import { isRecommendation } from "@/jag/intelligence/contracts/recommendation";

export type ExecutiveAnswer = {
  readonly id: string;
  readonly questionId: string;
  readonly summary: string;
  readonly findings: readonly Finding[];
  readonly evidence: readonly Evidence[];
  readonly recommendations: readonly Recommendation[];
  readonly explanation: Explanation;
  readonly decisionTrace: DecisionTrace;
  readonly assumptions?: readonly Assumption[];
  readonly confidence: Confidence;
};

export function isExecutiveAnswer(value: unknown): value is ExecutiveAnswer {
  if (!value || typeof value !== "object") return false;
  const v = value as ExecutiveAnswer;
  return (
    typeof v.id === "string" &&
    typeof v.questionId === "string" &&
    typeof v.summary === "string" &&
    Array.isArray(v.findings) &&
    v.findings.every(isFinding) &&
    Array.isArray(v.evidence) &&
    v.evidence.every(isEvidence) &&
    Array.isArray(v.recommendations) &&
    v.recommendations.every(isRecommendation) &&
    isExplanation(v.explanation) &&
    isDecisionTrace(v.decisionTrace) &&
    isConfidence(v.confidence) &&
    (v.assumptions === undefined ||
      (Array.isArray(v.assumptions) && v.assumptions.every(isAssumption)))
  );
}
