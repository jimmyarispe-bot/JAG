/**
 * Support Intelligence domain — shared types.
 *
 * Tenant-agnostic contracts for classifying, diagnosing, remediating,
 * and following up on customer support requests across all organizations.
 *
 * See `docs/architecture/JAG_SUCCESS_INTELLIGENCE.md`.
 */

import type {
  IntelligenceActionAuthority,
  IntelligenceCasePriority,
  IntelligenceConfidenceScore,
  IntelligenceEvidenceRef,
  IntelligenceHypothesis,
  IntelligenceMetadata,
} from "@/lib/platform/intelligence/types";

/** Semantic version of the Support Intelligence domain pack. */
export const SUPPORT_INTELLIGENCE_VERSION = "0.1.0";

/**
 * Support request categories (tenant-agnostic).
 * Aligned with Success Intelligence classification vocabulary.
 */
export const SUPPORT_CATEGORIES = [
  "authentication",
  "payments",
  "billing",
  "scheduling",
  "workflow",
  "permissions",
  "missing_records",
  "synchronization",
  "reporting",
  "integrations",
  "student_information",
  "attendance",
  "communications",
  "notifications",
  "email",
  "mobile",
  "performance",
  "general",
] as const;

export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];

/** Severity of impact for triage (not org-specific). */
export const SUPPORT_SEVERITIES = ["critical", "high", "medium", "low"] as const;
export type SupportSeverity = (typeof SUPPORT_SEVERITIES)[number];

/** Channels through which a support request may arrive. */
export const SUPPORT_CHANNELS = [
  "dashboard",
  "portal",
  "api",
  "email",
  "sms",
  "voice",
  "mobile",
  "unknown",
] as const;
export type SupportChannel = (typeof SUPPORT_CHANNELS)[number];

/** Status of a guided resolution plan. */
export const SUPPORT_RESOLUTION_STATUSES = [
  "draft",
  "ready",
  "in_progress",
  "awaiting_user",
  "resolved",
  "escalated",
] as const;
export type SupportResolutionStatus = (typeof SUPPORT_RESOLUTION_STATUSES)[number];

/** Follow-up verification outcome states. */
export const SUPPORT_FOLLOWUP_STATUSES = [
  "scheduled",
  "pending_verification",
  "verified_resolved",
  "reopened",
  "cancelled",
] as const;
export type SupportFollowupStatus = (typeof SUPPORT_FOLLOWUP_STATUSES)[number];

/** Default follow-up window in days (Success Intelligence verification loop). */
export const SUPPORT_FOLLOWUP_DAYS = 7;

/** Opaque metadata bag for the support domain — never use `any`. */
export type SupportMetadata = IntelligenceMetadata;

/**
 * Normalized support request submitted by a user of an organization on JAG.
 * Tenant identifiers are optional context only — domain logic must not branch on them.
 */
export interface SupportRequest {
  /** Caller-supplied correlation id (case id, ticket id, or run id). */
  requestId: string;
  subject: string;
  description?: string;
  channel?: SupportChannel;
  affectedModule?: string;
  workspace?: string;
  /** Optional signals already known (errors, flags) — not fetched here. */
  signals?: SupportDiagnosticSignal[];
  evidenceRefs?: IntelligenceEvidenceRef[];
  metadata?: SupportMetadata;
}

/** A single diagnostic signal provided with or derived for a request. */
export interface SupportDiagnosticSignal {
  key: string;
  label: string;
  value: string | number | boolean | null;
  source?: string;
  observedAt?: string;
  metadata?: SupportMetadata;
}

/** Result of classifying a support request. */
export interface SupportClassification {
  requestId: string;
  category: SupportCategory;
  secondaryCategories: SupportCategory[];
  severity: SupportSeverity;
  priority: IntelligenceCasePriority;
  confidence: IntelligenceConfidenceScore;
  matchedSignals: string[];
  rationale: string[];
  metadata?: SupportMetadata;
}

/** A ranked diagnostic hypothesis for a support issue. */
export interface SupportHypothesis extends IntelligenceHypothesis {
  category: SupportCategory;
  suggestedChecks: string[];
}

/** Output of the diagnostics engine. */
export interface SupportDiagnosticsResult {
  requestId: string;
  category: SupportCategory;
  hypotheses: SupportHypothesis[];
  primaryHypothesis: SupportHypothesis | null;
  signalsUsed: SupportDiagnosticSignal[];
  notes: string[];
  metadata?: SupportMetadata;
}

/** One remediation step from a playbook. */
export interface SupportPlaybookStep {
  stepKey: string;
  label: string;
  instruction: string;
  authority: IntelligenceActionAuthority;
  order: number;
  optional?: boolean;
  metadata?: SupportMetadata;
}

/** Category-scoped remediation playbook. */
export interface SupportPlaybook {
  playbookKey: string;
  category: SupportCategory;
  title: string;
  summary: string;
  steps: SupportPlaybookStep[];
  escalationGuidance?: string;
  metadata?: SupportMetadata;
}

/** Guided resolution step presented to the user or operator. */
export interface SupportResolutionStep {
  stepId: string;
  playbookStepKey: string;
  label: string;
  instruction: string;
  authority: IntelligenceActionAuthority;
  order: number;
  status: "pending" | "active" | "completed" | "skipped";
  metadata?: SupportMetadata;
}

/** Guided resolution plan built by the resolver. */
export interface SupportResolutionPlan {
  planId: string;
  requestId: string;
  status: SupportResolutionStatus;
  classification: SupportClassification;
  diagnostics: SupportDiagnosticsResult;
  playbook: SupportPlaybook;
  steps: SupportResolutionStep[];
  primaryHypothesis: SupportHypothesis | null;
  summary: string;
  createdAt: string;
  metadata?: SupportMetadata;
}

/** Scheduled verification follow-up (default: 7 days). */
export interface SupportFollowup {
  followupId: string;
  requestId: string;
  planId: string;
  status: SupportFollowupStatus;
  /** ISO-8601 timestamp when verification should run. */
  dueAt: string;
  scheduledAt: string;
  verificationChecklist: string[];
  metadata?: SupportMetadata;
}

/** Aggregate domain result for a support analysis pass. */
export interface SupportIntelligenceResult {
  requestId: string;
  classification: SupportClassification;
  diagnostics: SupportDiagnosticsResult;
  resolution: SupportResolutionPlan;
  followup: SupportFollowup;
  domainVersion: string;
  completedAt: string;
  metadata?: SupportMetadata;
}
