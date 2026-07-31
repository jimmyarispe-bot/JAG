/**
 * Question — executive question posed against organizational knowledge.
 */

export type ExecutiveQuestionIntent =
  | "status"
  | "risk"
  | "performance"
  | "compliance"
  | "capacity"
  | "decision_support"
  | "explanation"
  | "recommendation"
  | "unknown";

export type ExecutiveQuestion = {
  readonly id: string;
  readonly text: string;
  readonly askedAt?: string;
  readonly askerRole?: string;
  /** Optional pre-classified intent (pipeline may refine). */
  readonly intentHint?: ExecutiveQuestionIntent;
  readonly organizationId?: string;
  readonly tags?: readonly string[];
};

export function isExecutiveQuestion(value: unknown): value is ExecutiveQuestion {
  if (!value || typeof value !== "object") return false;
  const v = value as ExecutiveQuestion;
  return (
    typeof v.id === "string" &&
    v.id.length > 0 &&
    typeof v.text === "string" &&
    v.text.trim().length > 0
  );
}
