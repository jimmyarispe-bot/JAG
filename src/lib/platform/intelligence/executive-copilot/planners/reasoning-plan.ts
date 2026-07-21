/**
 * Reasoning plan — how to compose a unified answer (Sprint 067).
 */

import type { CopilotIntent } from "@/lib/platform/intelligence/executive-copilot/types";

export interface ReasoningPlan {
  intent: CopilotIntent;
  steps: string[];
  requireEvidence: boolean;
  allowComparison: boolean;
  allowInvestigation: boolean;
  allowBoardPrep: boolean;
  attachExecutionRefs: boolean;
}

export function planReasoning(
  intent: CopilotIntent,
  requestExecutionPrep?: boolean
): ReasoningPlan {
  return {
    intent,
    steps: [
      "Detect intent from question",
      "Select contributing domains",
      "Assemble soft-read context",
      "Run skill for intent",
      "Attach explainability and follow-ups",
      "Enforce governance (no auto-execute)",
    ],
    requireEvidence: true,
    allowComparison: intent === "compare" || intent === "recommend",
    allowInvestigation: intent === "investigate",
    allowBoardPrep: intent === "plan",
    attachExecutionRefs:
      Boolean(requestExecutionPrep) || intent === "recommend" || intent === "plan",
  };
}
