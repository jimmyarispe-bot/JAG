/**
 * Executive Synthesis Intelligence — shared types / DTOs (Sprint 061).
 *
 * Leaf module: soft-reads peer domains via *ResultLight only (no engine imports).
 */

import type { ResultLightBase } from "@/lib/platform/intelligence/common/result-lights";

export const SYNTHESIS_INTELLIGENCE_VERSION = "0.1.0";
export const SYNTHESIS_MODULE_ID = "synthesis" as const;

export const SYNTHESIS_PRIORITIES = [
  "critical",
  "high",
  "medium",
  "low",
  "informational",
] as const;

export const SYNTHESIS_HORIZONS = [
  "immediate",
  "near_term",
  "medium_term",
  "long_term",
] as const;

export const SYNTHESIS_TREND_WINDOWS = [
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "year_over_year",
] as const;

export type SynthesisPriority = (typeof SYNTHESIS_PRIORITIES)[number];
export type SynthesisHorizon = (typeof SYNTHESIS_HORIZONS)[number];
export type SynthesisTrendWindow = (typeof SYNTHESIS_TREND_WINDOWS)[number];
export type SynthesisMetadata = Record<string, unknown>;

export interface SynthesisScope {
  organizationId: string | null;
  schoolId: string | null;
}

/** Soft-read input from any upstream intelligence domain. */
export interface DomainSignalLight extends ResultLightBase {
  domain: string;
  label?: string;
  score?: number;
  direction?: "up" | "down" | "flat" | "unknown";
  narrative?: string;
  tags?: string[];
}

export interface WisdomResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  wisdomScore?: { value?: number };
  outlook?: string;
  headline?: string;
}

export interface SynthesisScores {
  severity: number;
  urgency: number;
  confidence: number;
  businessImpact: number;
  financialImpact: number;
  operationalImpact: number;
  strategicAlignment: number;
  priority: SynthesisPriority;
  timeHorizon: SynthesisHorizon;
}

export interface SynthesisEvidence {
  id: string;
  domain: string;
  statement: string;
  weight: number;
  supporting: boolean;
}

export interface RootCauseAnalysis {
  likelyCause: string;
  supportingEvidence: SynthesisEvidence[];
  confidence: number;
  alternativeCauses: string[];
  affectedDomains: string[];
}

export interface ContradictionFinding {
  id: string;
  title: string;
  domains: string[];
  statementA: string;
  statementB: string;
  explanation: string;
  confidence: number;
}

export interface CorrelationFinding {
  id: string;
  title: string;
  domains: string[];
  narrative: string;
  strength: number;
  evidence: SynthesisEvidence[];
}

export interface TrendFinding {
  id: string;
  title: string;
  window: SynthesisTrendWindow;
  domains: string[];
  direction: "improving" | "degrading" | "mixed" | "stable";
  narrative: string;
  confidence: number;
}

export interface OpportunityFinding {
  id: string;
  title: string;
  category:
    | "revenue"
    | "funding"
    | "operational_efficiency"
    | "staffing"
    | "automation"
    | "cost_savings"
    | "partnership"
    | "growth";
  narrative: string;
  estimatedImpact: number;
  confidence: number;
  domains: string[];
}

export interface RiskFinding {
  id: string;
  title: string;
  narrative: string;
  severity: number;
  urgency: number;
  domains: string[];
  confidence: number;
}

export interface SynthesisRecommendation {
  id: string;
  executiveSummary: string;
  supportingEvidence: SynthesisEvidence[];
  recommendedActions: string[];
  expectedImpact: string;
  estimatedEffort: "low" | "medium" | "high";
  confidence: number;
  dependencies: string[];
  risks: string[];
}

export interface ExplainabilityRecord {
  why: string;
  contributingDomains: string[];
  confidence: number;
  supportingEvidence: SynthesisEvidence[];
  contradictoryEvidence: SynthesisEvidence[];
}

export interface SynthesizedInsight {
  id: string;
  title: string;
  summary: string;
  scores: SynthesisScores;
  rootCause: RootCauseAnalysis;
  correlations: CorrelationFinding[];
  contradictions: ContradictionFinding[];
  opportunities: OpportunityFinding[];
  risks: RiskFinding[];
  trends: TrendFinding[];
  recommendations: SynthesisRecommendation[];
  explainability: ExplainabilityRecord;
  metadata: SynthesisMetadata;
}

export interface ExecutiveBrief {
  id: string;
  generatedAt: string;
  scope: SynthesisScope;
  executiveSummary: string;
  topRisks: RiskFinding[];
  topOpportunities: OpportunityFinding[];
  decisionsNeeded: string[];
  criticalAlerts: string[];
  emergingTrends: TrendFinding[];
  crossDomainCorrelations: CorrelationFinding[];
  recommendedActions: string[];
  confidenceSummary: {
    overall: number;
    byDomain: Record<string, number>;
  };
  insights: SynthesizedInsight[];
  overnightSummary?: string;
  version: string;
}

export interface SynthesisRequest {
  requestId: string;
  scope: SynthesisScope;
  signals?: DomainSignalLight[];
  wisdomResult?: WisdomResultLight;
  periodLabel?: string;
  question?: string;
  metadata?: SynthesisMetadata;
}

export interface SynthesisResult {
  requestId: string;
  version: string;
  scope: SynthesisScope;
  generatedAt: string;
  healthScore: { value: number; label: string };
  insights: SynthesizedInsight[];
  brief: ExecutiveBrief;
  correlations: CorrelationFinding[];
  contradictions: ContradictionFinding[];
  opportunities: OpportunityFinding[];
  risks: RiskFinding[];
  trends: TrendFinding[];
  recommendations: SynthesisRecommendation[];
  explainability: ExplainabilityRecord;
  contributingDomains: string[];
  metadata: SynthesisMetadata;
}

/** Plug-in analyzer contract (extensibility). */
export interface SynthesisAnalyzerContext {
  request: SynthesisRequest;
  signals: DomainSignalLight[];
  createId: (prefix: string) => string;
}

export interface SynthesisAnalyzer {
  id: string;
  name: string;
  version: string;
  analyze(context: SynthesisAnalyzerContext): Promise<Partial<AnalyzerOutput>> | Partial<AnalyzerOutput>;
}

export interface AnalyzerOutput {
  correlations: CorrelationFinding[];
  contradictions: ContradictionFinding[];
  trends: TrendFinding[];
  opportunities: OpportunityFinding[];
  risks: RiskFinding[];
}
