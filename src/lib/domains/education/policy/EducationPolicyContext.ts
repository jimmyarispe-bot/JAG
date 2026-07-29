/**
 * Evaluation context + normalized observations for the Education Policy Engine.
 * Hosts supply facts — the engine does not load databases or call contributors.
 */

import type { EducationPolicyDefinition } from "../knowledge";

/**
 * Normalized policy facts. Parameter keys from Knowledge policies map onto
 * these fields (and `attributes`) — not contributor-specific types.
 */
export interface EducationPolicyFacts {
  /** Attendance present rate 0..1. */
  attendancePresentRate?: number;
  /** Count of absences in the evaluation window. */
  attendanceAbsenceCount?: number;
  /** Optional window length in days (informational). */
  attendanceWindowDays?: number;

  /** Document kinds required (may override policy example list). */
  requiredDocumentKinds?: readonly string[];
  /** Document kinds that are complete/verified. */
  completedDocumentKinds?: readonly string[];

  seatsTotal?: number;
  seatsFilled?: number;
  waitlistOpen?: boolean;

  /** Scholarship lifecycle status (string code). */
  scholarshipStatus?: string;
  studentGpa?: number;
  /** Whether the scholarship case requires human review. */
  scholarshipRequiresReview?: boolean;

  /** Credits earned toward graduation. */
  earnedCredits?: number;

  /** Assessment prerequisite completeness. */
  assessmentComplete?: boolean;
  assessmentStatus?: string;

  /** Interview / signature style documentation flags. */
  documentationComplete?: boolean;

  /** Extensible bag for future policy parameters. */
  attributes?: Readonly<Record<string, unknown>>;
}

export interface EducationPolicyContext {
  /** Subject under evaluation (student, enrollment request, etc.). */
  subjectId?: string;
  organizationId?: string;
  /** Normalized observations / facts. */
  facts: EducationPolicyFacts;
  /**
   * Optional parameter overrides keyed by policyId → paramKey → value.
   * When omitted, evaluators use policy parameter `example` metadata.
   */
  parameterOverrides?: Readonly<
    Record<string, Readonly<Record<string, unknown>>>
  >;
  /** Restrict evaluation to these policy ids (default: all registered). */
  policyIds?: readonly string[];
  now?: string;
  attributes?: Readonly<Record<string, unknown>>;
}

/** Optional host-supplied policy set for a single evaluation. */
export interface EducationPolicyEvaluationRequest {
  context: EducationPolicyContext;
  /** Override registry policies for this run. */
  policies?: readonly EducationPolicyDefinition[];
}
