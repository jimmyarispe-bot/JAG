/**
 * RC-5 — Executive Copilot 2.0 types.
 * Soft-reads knowledge graph + domain feeds only (never connector APIs).
 */

export const EXECUTIVE_COPILOT_V2_VERSION = "2.0.0";

export const COPILOT_V2_CAPABILITIES = [
  "cross_domain_reasoning",
  "organizational_investigation",
  "root_cause_analysis",
  "decision_support",
  "executive_narratives",
  "board_preparation",
  "digital_twin_reasoning",
  "timeline_reasoning",
  "memory_reasoning",
] as const;

export type CopilotV2Capability = (typeof COPILOT_V2_CAPABILITIES)[number];

export const COPILOT_V2_INTENTS = [
  "revenue_decline",
  "disconnected_departments",
  "initiative_impact",
  "decision_makers",
  "organizational_risks",
  "cross_domain",
  "root_cause",
  "narrative",
  "board_prep",
  "digital_twin",
  "timeline",
  "memory",
  "general_investigate",
] as const;

export type CopilotV2Intent = (typeof COPILOT_V2_INTENTS)[number];

export type CopilotV2Evidence = {
  id: string;
  statement: string;
  domain: string;
  supporting: boolean;
};

export type CopilotV2Answer = {
  version: string;
  organizationId: string;
  question: string;
  intent: CopilotV2Intent;
  capabilitiesUsed: CopilotV2Capability[];
  answer: string;
  narrative?: string;
  rootCauses?: string[];
  decisionSupport?: string[];
  boardPrep?: {
    briefingSummary: string;
    risks: string[];
    decisions: string[];
    forecasts: string[];
  };
  investigation?: {
    topic: string;
    findings: string[];
    risks: string[];
    nextSteps: string[];
  };
  evidence: CopilotV2Evidence[];
  contributingDomains: string[];
  confidence: number;
  followUps: string[];
};
