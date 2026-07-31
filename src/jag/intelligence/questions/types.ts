/**
 * Supported executive question type catalog (Foundation v1).
 */

import type { ExecutiveQuestionIntent } from "@/jag/intelligence/contracts/question";

export type ExecutiveQuestionTypeDefinition = {
  readonly intent: ExecutiveQuestionIntent;
  readonly label: string;
  readonly description: string;
  readonly examplePrompts: readonly string[];
  /** Evidence kinds typically required. */
  readonly typicalEvidenceKinds: readonly string[];
};

export const EXECUTIVE_QUESTION_TYPES: readonly ExecutiveQuestionTypeDefinition[] =
  Object.freeze([
    Object.freeze({
      intent: "status" as const,
      label: "Status",
      description: "Current state of work, programs, or operations.",
      examplePrompts: Object.freeze([
        "What is the status of open work items this week?",
        "How are enrollment or case pipelines progressing?",
      ]),
      typicalEvidenceKinds: Object.freeze(["work", "report", "runtime_state"]),
    }),
    Object.freeze({
      intent: "risk" as const,
      label: "Risk",
      description: "Emerging risks grounded in policy, work, and analytics.",
      examplePrompts: Object.freeze([
        "Where are we most at risk of missing SLAs?",
      ]),
      typicalEvidenceKinds: Object.freeze([
        "policy",
        "work",
        "analytics",
        "decision",
      ]),
    }),
    Object.freeze({
      intent: "performance" as const,
      label: "Performance",
      description: "Performance against reporting and analytics definitions.",
      examplePrompts: Object.freeze([
        "How is utilization trending against our analytics definitions?",
      ]),
      typicalEvidenceKinds: Object.freeze(["report", "analytics", "work"]),
    }),
    Object.freeze({
      intent: "compliance" as const,
      label: "Compliance",
      description: "Alignment with policies and control obligations.",
      examplePrompts: Object.freeze([
        "Are we compliant with our records retention policy?",
      ]),
      typicalEvidenceKinds: Object.freeze(["policy", "document", "decision"]),
    }),
    Object.freeze({
      intent: "capacity" as const,
      label: "Capacity",
      description: "Capacity and scheduling pressure.",
      examplePrompts: Object.freeze([
        "Do we have capacity for next month's demand?",
      ]),
      typicalEvidenceKinds: Object.freeze([
        "schedule",
        "work",
        "analytics",
        "runtime_state",
      ]),
    }),
    Object.freeze({
      intent: "decision_support" as const,
      label: "Decision Support",
      description: "Support for pending or historical decisions.",
      examplePrompts: Object.freeze([
        "What evidence informed the last procurement decision?",
      ]),
      typicalEvidenceKinds: Object.freeze([
        "decision",
        "document",
        "policy",
        "report",
      ]),
    }),
    Object.freeze({
      intent: "explanation" as const,
      label: "Explanation",
      description: "Explain why a state or finding exists.",
      examplePrompts: Object.freeze([
        "Why did wait times increase last quarter?",
      ]),
      typicalEvidenceKinds: Object.freeze([
        "analytics",
        "report",
        "work",
        "policy",
      ]),
    }),
    Object.freeze({
      intent: "recommendation" as const,
      label: "Recommendation",
      description: "Ask for grounded next actions.",
      examplePrompts: Object.freeze([
        "What should we do to improve inspection compliance?",
      ]),
      typicalEvidenceKinds: Object.freeze([
        "work",
        "policy",
        "analytics",
        "decision",
      ]),
    }),
  ]);
