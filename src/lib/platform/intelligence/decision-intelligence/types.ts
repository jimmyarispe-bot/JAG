/**
 * Decision Intelligence — shared types / DTOs (Sprint 064).
 *
 * Leaf module: soft-reads executive-memory / briefing / synthesis lights only.
 * Package path is `decision-intelligence` (not `decision/`) to avoid regenerating
 * the early cognitive DecisionResolver at `intelligence/decision`.
 */

import type { ResultLightBase } from "@/lib/platform/intelligence/common/result-lights";

export const DECISION_INTELLIGENCE_VERSION = "0.1.0";
export const DECISION_INTELLIGENCE_MODULE_ID = "decision-intelligence" as const;

export const DECISION_APPROVAL_LEVELS = [
  "none",
  "manager",
  "executive",
  "board",
] as const;

export const DECISION_ISSUE_KINDS = [
  "staffing",
  "financial",
  "enrollment",
  "operations",
  "growth",
  "compliance",
  "strategic",
  "generic",
] as const;

export type DecisionApprovalLevel = (typeof DECISION_APPROVAL_LEVELS)[number];
export type DecisionIssueKind = (typeof DECISION_ISSUE_KINDS)[number];
export type DecisionMetadata = Record<string, unknown>;

export interface DecisionScope {
  organizationId: string | null;
  schoolId: string | null;
}

/** Soft-read of ExecutiveMemoryResult. */
export interface ExecutiveMemoryResultLight extends ResultLightBase {
  requestId?: string;
  decisions?: Array<{
    id?: string;
    title?: string;
    summary?: string;
    decision?: string;
    status?: string;
    expectedOutcome?: string;
    actualOutcome?: string;
    confidence?: number;
    domains?: string[];
  }>;
  lessons?: Array<{
    id?: string;
    title?: string;
    summary?: string;
    whatHappened?: string;
    decisionMade?: string;
    expectedOutcome?: string;
    actualOutcome?: string;
    repeat?: string[];
    change?: string[];
    domains?: string[];
    confidence?: number;
  }>;
  timeline?: Array<{
    id?: string;
    at?: string;
    kind?: string;
    title?: string;
    summary?: string;
    domains?: string[];
  }>;
  contributingDomains?: string[];
}

/** Soft-read of BriefingResult / SynthesisResult for issue context. */
export interface DecisionContextLight extends ResultLightBase {
  requestId?: string;
  healthScore?: { value?: number; label?: string };
  briefing?: {
    id?: string;
    sections?: {
      executiveSummary?: string;
      decisionsWaiting?: Array<{
        id?: string;
        title?: string;
        decisionNeeded?: string;
        why?: string;
        recommendedDecision?: string;
        impactIfDelayed?: string;
        confidence?: number;
        domains?: string[];
      }>;
      topRisks?: Array<{
        id?: string;
        title?: string;
        summary?: string;
        severity?: number;
        urgency?: number;
        domains?: string[];
      }>;
      topOpportunities?: Array<{
        id?: string;
        title?: string;
        summary?: string;
        category?: string;
        estimatedImpact?: number;
        domains?: string[];
      }>;
    };
  };
  decisionQueue?: Array<{
    id?: string;
    title?: string;
    decisionNeeded?: string;
    why?: string;
    recommendedDecision?: string;
    impactIfDelayed?: string;
    confidence?: number;
    domains?: string[];
  }>;
  contributingDomains?: string[];
  insights?: Array<{
    title?: string;
    summary?: string;
    rootCause?: { likelyCause?: string; affectedDomains?: string[] };
  }>;
}

export interface DecisionEvidence {
  id: string;
  domain?: string;
  statement: string;
  weight?: number;
  supporting: boolean;
  source?: "synthesis" | "briefing" | "executive-memory" | "policy" | "assumption";
}

export interface DecisionScorecard {
  strategicAlignment: number;
  financialImpact: number;
  operationalImpact: number;
  risk: number;
  timeToImplement: number;
  resourceRequirements: number;
  confidence: number;
  dependencies: number;
  urgency: number;
  effort: number;
  expectedImpact: number;
  roi: number;
  overall: number;
}

export interface OutcomeScenario {
  label: "best" | "expected" | "worst";
  narrative: string;
  probability: number;
  impactScore: number;
}

export interface HistoricalLookup {
  similarDecisions: Array<{
    id: string;
    title: string;
    outcome?: string;
    status?: string;
  }>;
  lessons: Array<{
    id: string;
    title: string;
    summary: string;
    repeat: string[];
    change: string[];
  }>;
  comparableInitiatives: string[];
}

export interface PolicyFlag {
  id: string;
  policy: string;
  severity: "info" | "warning" | "block";
  message: string;
  requiresApproval: DecisionApprovalLevel;
}

export interface DecisionOption {
  id: string;
  title: string;
  summary: string;
  category: string;
  scorecard: DecisionScorecard;
  scenarios: OutcomeScenario[];
  benefits: string[];
  risks: string[];
  assumptions: string[];
  dependencies: string[];
  estimatedEffort: "low" | "medium" | "high";
  confidence: number;
  tradeOffs: string[];
  whyRanked: string;
  policyFlags: PolicyFlag[];
  approvalRequired: DecisionApprovalLevel;
  evidence: DecisionEvidence[];
  historical: HistoricalLookup;
  rank: number;
}

export interface DecisionExplainability {
  why: string;
  contributingDomains: string[];
  historicalInfluence: string[];
  keyAssumptions: string[];
  contradictoryEvidence: DecisionEvidence[];
  confidence: number;
}

export interface DecisionRecommendation {
  id: string;
  version: string;
  generatedAt: string;
  scope: DecisionScope;
  issue: {
    kind: DecisionIssueKind;
    title: string;
    summary: string;
    domains: string[];
  };
  executiveSummary: string;
  rankedOptions: DecisionOption[];
  recommendedOptionId: string | null;
  evidence: DecisionEvidence[];
  benefits: string[];
  risks: string[];
  assumptions: string[];
  dependencies: string[];
  estimatedEffort: "low" | "medium" | "high";
  confidence: number;
  suggestedNextStep: string;
  explainability: DecisionExplainability;
  policyFlags: PolicyFlag[];
  approvalRequired: DecisionApprovalLevel;
  metadata: DecisionMetadata;
}

export interface OrganizationalPolicy {
  id: string;
  name: string;
  kind: "budget" | "compliance" | "approval" | "governance" | "other";
  /** Soft threshold cues — e.g. max spend, approval level. */
  maxFinancialImpact?: number;
  requiresApprovalAbove?: DecisionApprovalLevel;
  blockedCategories?: string[];
  description?: string;
}

export interface DecisionIntelligenceRequest {
  requestId: string;
  scope: DecisionScope;
  issue?: {
    kind?: DecisionIssueKind;
    title?: string;
    summary?: string;
    domains?: string[];
  };
  briefingResult?: DecisionContextLight;
  memoryResult?: ExecutiveMemoryResultLight;
  policies?: OrganizationalPolicy[];
  periodLabel?: string;
  metadata?: DecisionMetadata;
}

export interface DecisionIntelligenceResult {
  requestId: string;
  version: string;
  scope: DecisionScope;
  generatedAt: string;
  healthScore: { value: number; label: string };
  recommendation: DecisionRecommendation;
  options: DecisionOption[];
  contributingDomains: string[];
  metadata: DecisionMetadata;
}
