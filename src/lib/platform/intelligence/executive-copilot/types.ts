/**
 * Executive Copilot — shared types / DTOs (Sprint 067).
 *
 * Leaf module: soft-reads prior executive-stack lights.
 * Orchestrates existing domains — does not duplicate their logic or auto-execute.
 */

import type { ResultLightBase } from "@/lib/platform/intelligence/common/result-lights";

export const EXECUTIVE_COPILOT_VERSION = "0.1.0";
export const EXECUTIVE_COPILOT_MODULE_ID = "executive-copilot" as const;

export const COPILOT_INTENTS = [
  "explain",
  "summarize",
  "compare",
  "investigate",
  "forecast",
  "recommend",
  "recall",
  "plan",
] as const;

export const COPILOT_DOMAIN_KEYS = [
  "synthesis",
  "briefing",
  "executive-memory",
  "decision-intelligence",
  "executive-predictive",
  "executive-autonomous",
] as const;

export type CopilotIntent = (typeof COPILOT_INTENTS)[number];
export type CopilotDomainKey = (typeof COPILOT_DOMAIN_KEYS)[number];
export type CopilotMetadata = Record<string, unknown>;

export interface CopilotScope {
  organizationId: string | null;
  schoolId: string | null;
}

export interface SynthesisResultLight extends ResultLightBase {
  brief?: { executiveSummary?: string; headline?: string };
  correlations?: Array<{ title?: string; summary?: string; domains?: string[] }>;
  recommendations?: Array<{ title?: string; summary?: string; priority?: number }>;
  contributingDomains?: string[];
}

export interface BriefingResultLight extends ResultLightBase {
  healthScore?: { value?: number; label?: string };
  overnight?: { summary?: string; newRisks?: string[] };
  briefing?: {
    sections?: {
      executiveSummary?: string;
      topRisks?: Array<{
        title?: string;
        summary?: string;
        severity?: number;
        urgency?: number;
        domains?: string[];
      }>;
      topOpportunities?: Array<{
        title?: string;
        summary?: string;
        estimatedImpact?: number;
        domains?: string[];
      }>;
    };
  };
  decisionQueue?: Array<{
    id?: string;
    title?: string;
    decisionNeeded?: string;
    recommendedDecision?: string;
  }>;
  contributingDomains?: string[];
}

export interface ExecutiveMemoryResultLight extends ResultLightBase {
  timeline?: Array<{
    at?: string;
    kind?: string;
    title?: string;
    summary?: string;
    domains?: string[];
  }>;
  decisions?: Array<{
    id?: string;
    title?: string;
    decision?: string;
    expectedOutcome?: string;
    actualOutcome?: string;
    domains?: string[];
    confidence?: number;
  }>;
  lessons?: Array<{
    id?: string;
    title?: string;
    summary?: string;
    change?: string[];
    domains?: string[];
  }>;
  contributingDomains?: string[];
}

export interface DecisionIntelligenceResultLight extends ResultLightBase {
  recommendation?: {
    id?: string;
    executiveSummary?: string;
    recommendedOptionId?: string | null;
    rankedOptions?: Array<{
      id?: string;
      title?: string;
      summary?: string;
      category?: string;
      confidence?: number;
      scorecard?: {
        overall?: number;
        expectedImpact?: number;
        financialImpact?: number;
        operationalImpact?: number;
        risk?: number;
        effort?: number;
        roi?: number;
      };
    }>;
    confidence?: number;
    issue?: { title?: string; kind?: string; domains?: string[] };
  };
  contributingDomains?: string[];
}

export interface ExecutivePredictiveResultLight extends ResultLightBase {
  healthScore?: { value?: number; label?: string };
  forecasts?: Array<{
    subject?: string;
    horizon?: string;
    direction?: string;
    confidence?: number;
    projectedValue?: number;
    delta?: number;
  }>;
  emergingSignals?: Array<{
    title?: string;
    subject?: string;
    narrative?: string;
    strength?: number;
  }>;
  decisionImpacts?: Array<{
    optionId?: string;
    optionTitle?: string;
    organizationalImpact?: number;
    financialImpact?: number;
    narrative?: string;
  }>;
  scenarios?: Array<{
    kind?: string;
    label?: string;
    narrative?: string;
    overallOutlook?: number;
  }>;
  contributingDomains?: string[];
}

export interface AutonomousResultLight extends ResultLightBase {
  plans?: Array<{
    id?: string;
    workflowKind?: string;
    objective?: string;
    optionTitle?: string;
    readiness?: string;
    readinessReasons?: string[];
    humanAuthorizationRequired?: boolean;
    autoExecute?: boolean;
  }>;
  approvalQueue?: Array<{
    role?: string;
    status?: string;
    rationale?: string;
  }>;
  autoExecute?: boolean;
  humanInTheLoop?: boolean;
  contributingDomains?: string[];
}

export interface CopilotEvidence {
  id: string;
  statement: string;
  domain: CopilotDomainKey | string;
  supporting: boolean;
  weight?: number;
}

export interface DomainTraceEntry {
  domain: CopilotDomainKey;
  reason: string;
  used: boolean;
}

export interface CopilotExplainability {
  executiveSummary: string;
  supportingEvidence: CopilotEvidence[];
  contributingDomains: string[];
  confidence: number;
  knownUncertainties: string[];
  domainTrace: DomainTraceEntry[];
}

export interface CopilotFollowUp {
  id: string;
  prompt: string;
  intent: CopilotIntent;
}

export interface CopilotCompareItem {
  id: string;
  label: string;
  summary: string;
  score?: number;
  domains?: string[];
}

export interface CopilotInvestigation {
  topic: string;
  signals: string[];
  risks: string[];
  opportunities: string[];
  historicalDecisions: string[];
  predictions: string[];
  recommendedNextSteps: string[];
}

export interface CopilotBoardPrep {
  briefingSummary: string;
  openDecisions: string[];
  highPriorityRisks: string[];
  pendingApprovals: string[];
  forecasts: string[];
  recentChanges: string[];
}

export interface CopilotMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  at: string;
  intent?: CopilotIntent;
}

export interface CopilotRequest {
  requestId: string;
  question: string;
  scope: CopilotScope;
  conversationId?: string;
  priorMessages?: CopilotMessage[];
  synthesisResult?: SynthesisResultLight;
  briefingResult?: BriefingResultLight;
  memoryResult?: ExecutiveMemoryResultLight;
  decisionResult?: DecisionIntelligenceResultLight;
  predictiveResult?: ExecutivePredictiveResultLight;
  autonomousResult?: AutonomousResultLight;
  /** When true and recommend/plan intents apply, attach autonomous plan refs only. */
  requestExecutionPrep?: boolean;
  periodLabel?: string;
  metadata?: CopilotMetadata;
}

export interface CopilotResult {
  requestId: string;
  conversationId: string;
  version: string;
  scope: CopilotScope;
  generatedAt: string;
  intent: CopilotIntent;
  answer: string;
  explainability: CopilotExplainability;
  comparison?: CopilotCompareItem[];
  investigation?: CopilotInvestigation;
  boardPrep?: CopilotBoardPrep;
  followUps: CopilotFollowUp[];
  /** When execution prep is requested, reference autonomous plans — never auto-execute. */
  executionPlanRefs?: Array<{
    planId: string;
    optionTitle: string;
    readiness: string;
    humanAuthorizationRequired: true;
    autoExecute: false;
  }>;
  messages: CopilotMessage[];
  contributingDomains: string[];
  metadata: CopilotMetadata;
  governance: {
    mayExplain: true;
    mayRecommend: true;
    mayPrepare: true;
    mayInvestigate: true;
    mayAutoExecute: false;
    routesExecutionThroughAutonomous: true;
  };
}
