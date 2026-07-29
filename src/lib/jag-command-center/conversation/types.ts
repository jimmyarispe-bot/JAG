/**
 * Executive Conversation Intelligence — Sprint 203.
 * Evidence-grounded answers only. Not a chatbot. No fabricated facts.
 * Application layer — does not modify Core or Runtime.
 */

export const JAG_CONVERSATION_INTENTS = [
  "decide_today",
  "organization_health",
  "overdue_decisions",
  "what_changed",
  "highest_risk",
  "forecasts_attention",
  "high_confidence_recommendations",
  "delay_decision",
  "funding",
  "student_success",
  "scenario_what_if",
  "briefings",
  "search",
  "follow_up",
  "general_status",
  "insufficient",
] as const;

export type JagConversationIntent = (typeof JAG_CONVERSATION_INTENTS)[number];

export type JagConversationEntityKind =
  | "decision"
  | "briefing"
  | "forecast"
  | "scenario"
  | "goal"
  | "contributor"
  | "knowledge"
  | "policy"
  | "organization"
  | "capability_pack"
  | "navigation";

export type JagConversationEntityLink = {
  readonly id: string;
  readonly kind: JagConversationEntityKind;
  readonly label: string;
  readonly href: string;
  readonly subtitle?: string;
};

export type JagConversationEvidenceItem = {
  readonly id: string;
  readonly source: string;
  readonly summary: string;
  readonly kind: "observed" | "forecast" | "scenario" | "derived";
  readonly href?: string;
  readonly confidence?: number;
};

export type JagConversationDriver = {
  readonly label: string;
  readonly explanation: string;
};

export type JagConversationAnswer = {
  readonly executiveSummary: string;
  readonly evidence: readonly JagConversationEvidenceItem[];
  readonly confidence: number;
  readonly confidenceBand: "low" | "moderate" | "high" | "none";
  readonly confidenceExplanation: string;
  readonly primaryDrivers: readonly JagConversationDriver[];
  readonly supportingContributors: readonly string[];
  readonly relatedPolicies: readonly JagConversationEntityLink[];
  readonly relatedKnowledge: readonly JagConversationEntityLink[];
  readonly relatedDecisions: readonly JagConversationEntityLink[];
  readonly forecasts: readonly JagConversationEntityLink[];
  readonly scenarios: readonly JagConversationEntityLink[];
  readonly recommendedNextActions: readonly string[];
  readonly suggestedFollowUps: readonly string[];
  readonly reasoningChain: readonly string[];
  readonly timeline: readonly { readonly at: string; readonly message: string }[];
  readonly policyTrace: readonly string[];
  readonly contributorTrace: readonly string[];
  readonly dependencies: readonly string[];
  readonly insufficientData: boolean;
  readonly advisoryNotice: string;
};

export type JagConversationTurn = {
  readonly id: string;
  readonly role: "executive" | "jag";
  readonly at: string;
  readonly content: string;
  readonly intent?: JagConversationIntent;
  readonly answer?: JagConversationAnswer;
  readonly durationMs?: number;
};

export type JagConversationRecord = {
  readonly id: string;
  readonly title: string;
  readonly organizationId: string | null;
  readonly organizationName: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly pinned: boolean;
  readonly archived: boolean;
  readonly turns: readonly JagConversationTurn[];
  /** Topics remembered for follow-up grounding in this conversation. */
  readonly memoryTopics: readonly string[];
  readonly memoryEntityIds: readonly string[];
};

export type JagConversationListItem = {
  readonly id: string;
  readonly title: string;
  readonly updatedAt: string;
  readonly pinned: boolean;
  readonly archived: boolean;
  readonly preview: string;
  readonly turnCount: number;
};

export const SUGGESTED_PROMPTS = [
  "What should I decide today?",
  "Why is organization health declining?",
  "Which decisions are overdue?",
  "What changed since last week?",
  "Which schools are highest risk?",
  "Which forecasts deserve attention?",
  "Show only high-confidence recommendations.",
  "What happens if we delay this decision?",
] as const;
