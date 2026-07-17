/**
 * Executive Copilot — shared types.
 * Composition layer only: no new intelligence domains, no connector changes.
 */

export const COPILOT_VERSION = "1.0.0";

export const COPILOT_INTENTS = [
  "daily_brief",
  "ask_anything",
  "explain_recommendation",
  "scenario_analysis",
  "compare_options",
  "why",
  "why_not",
  "what_changed",
  "show_evidence",
  "summarize_week",
  "summarize_month",
  "prepare_board_meeting",
  "decision_simulator",
] as const;

export type CopilotIntent = (typeof COPILOT_INTENTS)[number];

export const EVIDENCE_SYSTEMS = [
  "academyos",
  "quickbooks",
  "square",
  "plaid",
  "google-workspace",
  "intelligence-domains",
  "reasoning",
  "recommendation",
] as const;

export type EvidenceSystem = (typeof EVIDENCE_SYSTEMS)[number];

export type EvidenceItem = {
  id: string;
  system: EvidenceSystem;
  label: string;
  statement: string;
  /** True when drawn from a live/cached connector or intelligence output. */
  grounded: boolean;
  metric?: string;
  value?: string | number | null;
  syncedAt?: string | null;
  refs?: string[];
};

export type EvidenceChain = {
  generatedAt: string;
  /** Ordered AcademyOS → … → Recommendation */
  links: EvidenceItem[];
  systemsPresent: EvidenceSystem[];
  systemsMissing: EvidenceSystem[];
  groundedCount: number;
  ungroundedCount: number;
};

export type ExplainabilityBundle = {
  explain: string;
  evidence: string[];
  assumptions: string[];
  calculations: string[];
  confidence: { value: number; level: string; rationale: string };
  alternatives: string[];
};

/** Eight leadership questions every recommendation must answer. */
export type ExecutiveReasoningLens = {
  whatHappened: string;
  whyItHappened: string;
  whyItMatters: string;
  whatShouldIDo: string;
  whyNow: string;
  alternatives: string[];
  risks: string[];
  confidence: { value: number; level: string };
};

export type CopilotRecommendation = {
  id: string;
  title: string;
  executiveSummary: string;
  evidence: EvidenceItem[];
  supportingSystems: EvidenceSystem[];
  confidence: { value: number; level: string };
  tradeOffs: string[];
  alternatives: string[];
  financialImpact: string;
  humanImpact: string;
  riskImpact: string;
  ethicalImpact: string;
  longTermImpact: string;
  suggestedAction: string;
  expectedOutcome: string;
  reasoning: ExecutiveReasoningLens;
  explainability: ExplainabilityBundle;
  evidenceChain: EvidenceChain;
  sourceRecommendationId?: string;
  priority?: string;
};

export type ConnectorSystemSnapshot = {
  system: Exclude<
    EvidenceSystem,
    "intelligence-domains" | "reasoning" | "recommendation"
  >;
  connected: boolean;
  syncedAt: string | null;
  bullets: string[];
  metrics: Array<{ key: string; label: string; value: string | number | null }>;
};

export type IntelligenceSnapshot = {
  domainsUsed: string[];
  wisdomHeadline?: string;
  wisdomOutlook?: string;
  opportunityHeadlines: string[];
  riskHeadlines: string[];
  predictiveHeadline?: string;
  judgment?: {
    whatLeadershipShouldDo: string;
    why: string;
    whyNow: string;
    whyNotAlternatives: string;
    risksRemaining: string;
    assumptions: string;
    evidence: string;
    expectedOutcome: string;
  };
  recommendations: Array<{
    id: string;
    title: string;
    action: string;
    rationale: string;
    narrative: string;
    priority: string;
    confidenceScore: number;
    evidenceRefs: string[];
    lenses: {
      strategicValue: string;
      longTermImpact: string;
      confidenceLevel: string;
      evidenceQuality: string;
      tradeOffBalance: string;
      organizationalAlignment: string;
      ethicalIntegrity: string;
      wisdomScore: string;
    };
  }>;
};

export type CopilotContext = {
  organizationId: string;
  executiveRole: string;
  generatedAt: string;
  connectors: ConnectorSystemSnapshot[];
  intelligence: IntelligenceSnapshot;
  dataMode: "live" | "cached" | "model-baseline" | "synthetic";
};

export type SessionMemory = {
  sessionId: string;
  organizationId: string;
  executiveRole: string;
  createdAt: string;
  updatedAt: string;
  recentQuestions: string[];
  currentDecisions: string[];
  pendingActions: string[];
  lastRecommendationId: string | null;
  lastIntent: CopilotIntent | null;
};

export type ConversationTurn = {
  id: string;
  at: string;
  intent: CopilotIntent;
  question: string;
  answer: string;
  recommendation: CopilotRecommendation | null;
  recommendations: CopilotRecommendation[];
  evidenceChain: EvidenceChain;
  explainability: ExplainabilityBundle;
  scenario?: DecisionSimulationResult | null;
  memory: SessionMemory;
};

export type DecisionScenarioKind =
  | "raise_tuition"
  | "delay_hiring"
  | "add_campus"
  | "reduce_expenses"
  | "increase_salaries"
  | "custom";

export type DecisionSimulationResult = {
  id: string;
  kind: DecisionScenarioKind;
  title: string;
  question: string;
  summary: string;
  predictiveHeadline: string;
  domainImpacts: Array<{
    domain: string;
    direction: string;
    narrative: string;
    confidence: number;
  }>;
  wisdomJudgment: string;
  risks: string[];
  alternatives: string[];
  confidence: { value: number; level: string };
  evidenceChain: EvidenceChain;
  recommendation: CopilotRecommendation;
};

export type ExecutiveMorningBrief = {
  generatedAt: string;
  headline: string;
  topOpportunities: string[];
  topRisks: string[];
  cash: string;
  revenue: string;
  workforce: string;
  meetings: string[];
  deadlines: string[];
  recommendedActions: CopilotRecommendation[];
  evidenceChain: EvidenceChain;
  dataMode: CopilotContext["dataMode"];
};

export type CopilotAskRequest = {
  question: string;
  intentHint?: CopilotIntent;
  session?: SessionMemory;
  recommendationId?: string;
  organizationId?: string;
  executiveRole?: string;
};

export type CopilotAskResult = ConversationTurn;
