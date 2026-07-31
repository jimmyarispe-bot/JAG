export type {
  Confidence,
  ConfidenceLevel,
} from "@/jag/intelligence/contracts/confidence";
export { isConfidence } from "@/jag/intelligence/contracts/confidence";

export type {
  Assumption,
  AssumptionStatus,
} from "@/jag/intelligence/contracts/assumption";
export { isAssumption } from "@/jag/intelligence/contracts/assumption";

export type {
  Evidence,
  EvidenceReference,
} from "@/jag/intelligence/contracts/evidence";
export {
  isEvidence,
  isEvidenceReference,
} from "@/jag/intelligence/contracts/evidence";

export type {
  ExecutiveQuestion,
  ExecutiveQuestionIntent,
} from "@/jag/intelligence/contracts/question";
export { isExecutiveQuestion } from "@/jag/intelligence/contracts/question";

export type { IntelligenceContext } from "@/jag/intelligence/contracts/context";
export { isIntelligenceContext } from "@/jag/intelligence/contracts/context";

export type {
  Finding,
  FindingSeverity,
} from "@/jag/intelligence/contracts/finding";
export { isFinding } from "@/jag/intelligence/contracts/finding";

export type {
  Recommendation,
  RecommendationPriority,
} from "@/jag/intelligence/contracts/recommendation";
export { isRecommendation } from "@/jag/intelligence/contracts/recommendation";

export type {
  DecisionTrace,
  DecisionTraceStep,
  DecisionTraceStepKind,
} from "@/jag/intelligence/contracts/decision-trace";
export {
  isDecisionTrace,
  isDecisionTraceStep,
} from "@/jag/intelligence/contracts/decision-trace";

export type { Explanation } from "@/jag/intelligence/contracts/explanation";
export { isExplanation } from "@/jag/intelligence/contracts/explanation";

export type { ExecutiveAnswer } from "@/jag/intelligence/contracts/answer";
export { isExecutiveAnswer } from "@/jag/intelligence/contracts/answer";
