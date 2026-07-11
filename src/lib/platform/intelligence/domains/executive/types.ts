/**
 * Executive Intelligence domain — shared types.
 *
 * Tenant-agnostic contracts for strategic executive request analysis.
 * See `docs/architecture/JAG_INTELLIGENCE_ARCHITECTURE.md` (Executive Intelligence).
 */

import type {
  IntelligenceActionAuthority,
  IntelligenceCasePriority,
  IntelligenceConfidenceScore,
  IntelligenceEvidenceRef,
  IntelligenceHypothesis,
  IntelligenceMetadata,
} from "@/lib/platform/intelligence/types";

/** Semantic version of the Executive Intelligence domain pack. */
export const EXECUTIVE_INTELLIGENCE_VERSION = "0.1.0";

/** Executive request categories (tenant-agnostic). */
export const EXECUTIVE_CATEGORIES = [
  "strategic",
  "risk",
  "opportunity",
  "forecast",
  "scenario",
  "summary",
  "board",
  "enrollment",
  "financial_health",
  "operations",
  "compliance",
  "general",
] as const;
export type ExecutiveCategory = (typeof EXECUTIVE_CATEGORIES)[number];

/** Severity of executive impact. */
export const EXECUTIVE_SEVERITIES = ["critical", "high", "medium", "low"] as const;
export type ExecutiveSeverity = (typeof EXECUTIVE_SEVERITIES)[number];

/** Default follow-up window in days for executive verification. */
export const EXECUTIVE_FOLLOWUP_DAYS = 7;

/** Follow-up action statuses. */
export const EXECUTIVE_FOLLOWUP_STATUSES = [
  "scheduled",
  "pending_review",
  "completed",
  "cancelled",
] as const;
export type ExecutiveFollowupStatus = (typeof EXECUTIVE_FOLLOWUP_STATUSES)[number];

/** Analysis / briefing statuses. */
export const EXECUTIVE_ANALYSIS_STATUSES = [
  "draft",
  "ready",
  "in_review",
  "accepted",
  "escalated",
] as const;
export type ExecutiveAnalysisStatus = (typeof EXECUTIVE_ANALYSIS_STATUSES)[number];

/** Opaque metadata bag — never use `any`. */
export type ExecutiveMetadata = IntelligenceMetadata;

/** Normalized executive intelligence request. */
export interface ExecutiveRequest {
  requestId: string;
  subject: string;
  description?: string;
  workspace?: string;
  signals?: ExecutiveDiagnosticSignal[];
  evidenceRefs?: IntelligenceEvidenceRef[];
  metadata?: ExecutiveMetadata;
}

/** Diagnostic signal supplied with an executive request. */
export interface ExecutiveDiagnosticSignal {
  key: string;
  label: string;
  value: string | number | boolean | null;
  source?: string;
  observedAt?: string;
  metadata?: ExecutiveMetadata;
}

/** Classification of an executive request. */
export interface ExecutiveClassification {
  requestId: string;
  category: ExecutiveCategory;
  secondaryCategories: ExecutiveCategory[];
  severity: ExecutiveSeverity;
  priority: IntelligenceCasePriority;
  confidence: IntelligenceConfidenceScore;
  matchedSignals: string[];
  rationale: string[];
  metadata?: ExecutiveMetadata;
}

/** Ranked diagnostic hypothesis for an executive issue. */
export interface ExecutiveHypothesis extends IntelligenceHypothesis {
  category: ExecutiveCategory;
  suggestedChecks: string[];
}

/** Diagnostics output. */
export interface ExecutiveDiagnosticsResult {
  requestId: string;
  category: ExecutiveCategory;
  hypotheses: ExecutiveHypothesis[];
  primaryHypothesis: ExecutiveHypothesis | null;
  signalsUsed: ExecutiveDiagnosticSignal[];
  notes: string[];
  metadata?: ExecutiveMetadata;
}

/** Structured finding derived from diagnostics / analysis. */
export interface ExecutiveFinding {
  findingId: string;
  category: ExecutiveCategory;
  title: string;
  summary: string;
  severity: ExecutiveSeverity;
  confidence: IntelligenceConfidenceScore;
  evidenceRefs: IntelligenceEvidenceRef[];
  metadata?: ExecutiveMetadata;
}

/** Analysis package of findings. */
export interface ExecutiveAnalysisResult {
  requestId: string;
  classification: ExecutiveClassification;
  findings: ExecutiveFinding[];
  primaryFinding: ExecutiveFinding | null;
  summary: string;
  metadata?: ExecutiveMetadata;
}

/** Recommended executive action. */
export interface ExecutiveRecommendation {
  recommendationId: string;
  actionKey: string;
  label: string;
  instruction: string;
  authority: IntelligenceActionAuthority;
  order: number;
  expectedImpact?: string;
  optional?: boolean;
  metadata?: ExecutiveMetadata;
}

/** Set of recommendations for a category. */
export interface ExecutiveRecommendationSet {
  setKey: string;
  category: ExecutiveCategory;
  title: string;
  summary: string;
  recommendations: ExecutiveRecommendation[];
  metadata?: ExecutiveMetadata;
}

/** Follow-up action for executives. */
export interface ExecutiveFollowupAction {
  actionId: string;
  label: string;
  instruction: string;
  authority: IntelligenceActionAuthority;
  order: number;
  metadata?: ExecutiveMetadata;
}

/** Scheduled executive follow-up. */
export interface ExecutiveFollowup {
  followupId: string;
  requestId: string;
  analysisId: string;
  status: ExecutiveFollowupStatus;
  dueAt: string;
  scheduledAt: string;
  actions: ExecutiveFollowupAction[];
  metadata?: ExecutiveMetadata;
}

/** Full executive briefing produced by the resolver. */
export interface ExecutiveBriefing {
  briefingId: string;
  requestId: string;
  status: ExecutiveAnalysisStatus;
  classification: ExecutiveClassification;
  diagnostics: ExecutiveDiagnosticsResult;
  analysis: ExecutiveAnalysisResult;
  recommendations: ExecutiveRecommendationSet;
  followup: ExecutiveFollowup;
  summary: string;
  createdAt: string;
  metadata?: ExecutiveMetadata;
}

/** Aggregate Executive Intelligence result. */
export interface ExecutiveIntelligenceResult {
  requestId: string;
  classification: ExecutiveClassification;
  diagnostics: ExecutiveDiagnosticsResult;
  analysis: ExecutiveAnalysisResult;
  recommendations: ExecutiveRecommendationSet;
  followup: ExecutiveFollowup;
  briefing: ExecutiveBriefing;
  domainVersion: string;
  completedAt: string;
  metadata?: ExecutiveMetadata;
}
