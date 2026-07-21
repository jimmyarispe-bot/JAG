/**
 * Executive Briefing Intelligence — shared types / DTOs (Sprint 062).
 *
 * Leaf module: soft-reads synthesis via light contracts only (no engine imports).
 */

import type { ResultLightBase } from "@/lib/platform/intelligence/common/result-lights";

export const BRIEFING_INTELLIGENCE_VERSION = "0.1.0";
export const BRIEFING_MODULE_ID = "briefing" as const;

export const BRIEFING_ROLES = [
  "founder",
  "ceo",
  "executive",
  "school_leader",
  "board",
] as const;

export const BRIEFING_TIMELINE_WINDOWS = [
  "today",
  "yesterday",
  "last_7_days",
  "last_30_days",
  "quarter",
  "year",
] as const;

export const BRIEFING_CARD_KINDS = [
  "risk",
  "opportunity",
  "decision",
  "alert",
  "metric",
  "summary",
  "focus",
  "action",
] as const;

export const BRIEFING_ACTIONS = [
  "open_investigation",
  "view_evidence",
  "assign_owner",
  "create_initiative",
  "schedule_review",
  "dismiss",
] as const;

export type BriefingRole = (typeof BRIEFING_ROLES)[number];
export type BriefingTimelineWindow = (typeof BRIEFING_TIMELINE_WINDOWS)[number];
export type BriefingCardKind = (typeof BRIEFING_CARD_KINDS)[number];
export type BriefingActionId = (typeof BRIEFING_ACTIONS)[number];
export type BriefingMetadata = Record<string, unknown>;

export interface BriefingScope {
  organizationId: string | null;
  schoolId: string | null;
}

/** Soft-read of SynthesisResult for DI / pipeline adapters. */
export interface SynthesisResultLight extends ResultLightBase {
  requestId?: string;
  version?: string;
  generatedAt?: string;
  healthScore?: { value?: number; label?: string };
  brief?: {
    id?: string;
    executiveSummary?: string;
    topRisks?: SynthesisRiskLight[];
    topOpportunities?: SynthesisOpportunityLight[];
    decisionsNeeded?: string[];
    criticalAlerts?: string[];
    emergingTrends?: Array<{ title?: string; narrative?: string; confidence?: number }>;
    recommendedActions?: string[];
    overnightSummary?: string;
    confidenceSummary?: { overall?: number; byDomain?: Record<string, number> };
  };
  insights?: Array<{
    id?: string;
    title?: string;
    summary?: string;
    scores?: BriefingPriorityScores;
    rootCause?: {
      likelyCause?: string;
      confidence?: number;
      affectedDomains?: string[];
      supportingEvidence?: BriefingEvidence[];
      alternativeCauses?: string[];
    };
    opportunities?: SynthesisOpportunityLight[];
    risks?: SynthesisRiskLight[];
    recommendations?: Array<{
      executiveSummary?: string;
      recommendedActions?: string[];
      expectedImpact?: string;
      confidence?: number;
      dependencies?: string[];
    }>;
    explainability?: BriefingExplainability;
  }>;
  risks?: SynthesisRiskLight[];
  opportunities?: SynthesisOpportunityLight[];
  recommendations?: Array<{
    executiveSummary?: string;
    recommendedActions?: string[];
    expectedImpact?: string;
    confidence?: number;
    dependencies?: string[];
  }>;
  contributingDomains?: string[];
  explainability?: BriefingExplainability;
}

export interface SynthesisRiskLight {
  id?: string;
  title?: string;
  narrative?: string;
  severity?: number;
  urgency?: number;
  domains?: string[];
  confidence?: number;
}

export interface SynthesisOpportunityLight {
  id?: string;
  title?: string;
  category?: string;
  narrative?: string;
  estimatedImpact?: number;
  confidence?: number;
  domains?: string[];
}

export interface BriefingPriorityScores {
  severity?: number;
  urgency?: number;
  confidence?: number;
  businessImpact?: number;
  financialImpact?: number;
  operationalImpact?: number;
  strategicAlignment?: number;
  priority?: string;
  timeHorizon?: string;
}

export interface BriefingEvidence {
  id?: string;
  domain?: string;
  statement?: string;
  weight?: number;
  supporting?: boolean;
}

export interface BriefingExplainability {
  why: string;
  contributingDomains: string[];
  confidence: number;
  supportingEvidence: BriefingEvidence[];
  contradictoryEvidence?: BriefingEvidence[];
}

/** Every card is actionable — UX-003/004 ActionChip contract targets. */
export interface BriefingCardAction {
  id: BriefingActionId;
  label: string;
  href?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "warning" | "info";
}

export interface BriefingCard {
  id: string;
  kind: BriefingCardKind;
  title: string;
  summary: string;
  priorityScore: number;
  severity: number;
  urgency: number;
  confidence: number;
  businessImpact: number;
  strategicAlignment: number;
  domains: string[];
  explainability: BriefingExplainability;
  actions: BriefingCardAction[];
  metadata?: BriefingMetadata;
}

export interface DecisionCard extends BriefingCard {
  kind: "decision";
  decisionNeeded: string;
  why: string;
  impactIfDelayed: string;
  recommendedDecision: string;
}

export interface OpportunityCard extends BriefingCard {
  kind: "opportunity";
  category:
    | "revenue"
    | "growth"
    | "cost_reduction"
    | "automation"
    | "grant"
    | "hiring"
    | "expansion"
    | "operational";
  estimatedImpact: number;
}

export interface RiskCard extends BriefingCard {
  kind: "risk";
  status: "new" | "elevated" | "resolved" | "watch";
}

export interface AlertCard extends BriefingCard {
  kind: "alert";
  alertLevel: "critical" | "high" | "medium" | "low";
}

export interface MetricCard extends BriefingCard {
  kind: "metric";
  metricKey: string;
  value: number;
  label: string;
  direction: "up" | "down" | "flat" | "unknown";
}

export interface OvernightIntelligence {
  summary: string;
  newRisks: string[];
  resolvedRisks: string[];
  newOpportunities: string[];
  financialMovement: string[];
  complianceChanges: string[];
  marketChanges: string[];
  staffingChanges: string[];
  fundingUpdates: string[];
  strategicChanges: string[];
}

export interface BriefingTimelineEntry {
  id: string;
  window: BriefingTimelineWindow;
  label: string;
  summary: string;
  cardIds: string[];
  generatedAt: string;
}

export interface BriefingPreferences {
  role: BriefingRole;
  greetingName?: string;
  maxRisks?: number;
  maxOpportunities?: number;
  maxDecisions?: number;
  maxAlerts?: number;
  emphasizeDomains?: string[];
  hideKinds?: BriefingCardKind[];
}

export interface MorningBriefSections {
  greeting: string;
  organizationHealth: MetricCard | null;
  topRisks: RiskCard[];
  topOpportunities: OpportunityCard[];
  decisionsWaiting: DecisionCard[];
  criticalAlerts: AlertCard[];
  executiveSummary: string;
  todaysFocus: BriefingCard[];
  recommendedActions: BriefingCard[];
  overnight: OvernightIntelligence;
}

export interface ExecutiveBriefing {
  id: string;
  version: string;
  generatedAt: string;
  scope: BriefingScope;
  role: BriefingRole;
  greeting: string;
  sections: MorningBriefSections;
  decisionQueue: DecisionCard[];
  opportunityQueue: OpportunityCard[];
  timeline: BriefingTimelineEntry[];
  cards: BriefingCard[];
  explainability: BriefingExplainability;
  contributingDomains: string[];
  metadata: BriefingMetadata;
}

export interface BriefingRequest {
  requestId: string;
  scope: BriefingScope;
  synthesisResult?: SynthesisResultLight;
  role?: BriefingRole;
  preferences?: Partial<BriefingPreferences>;
  greetingName?: string;
  periodLabel?: string;
  metadata?: BriefingMetadata;
}

export interface BriefingResult {
  requestId: string;
  version: string;
  scope: BriefingScope;
  generatedAt: string;
  healthScore: { value: number; label: string };
  briefing: ExecutiveBriefing;
  overnight: OvernightIntelligence;
  decisionQueue: DecisionCard[];
  opportunityQueue: OpportunityCard[];
  timeline: BriefingTimelineEntry[];
  contributingDomains: string[];
  metadata: BriefingMetadata;
}

/** Plug-in personalization profile (extensibility). */
export interface BriefingPersonalizer {
  id: BriefingRole | string;
  name: string;
  version: string;
  personalize(briefing: ExecutiveBriefing, preferences: BriefingPreferences): ExecutiveBriefing;
}
