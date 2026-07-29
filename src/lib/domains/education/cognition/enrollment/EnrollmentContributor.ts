/**
 * Enrollment Intelligence — CognitiveContributor for JAG Runtime.
 * Observes enrollment state, publishes evidence, recommends actions.
 * NEVER executes Action Runtime.
 */

import type {
  CognitiveContributor,
  CognitiveEvidenceRef,
  CognitiveFinding,
  CognitiveRecommendationDraft,
  CognitiveThinkRequest,
} from "@/lib/jag/runtime";
import { analyzeEnrollment } from "./EnrollmentAnalyzer";
import {
  ENROLLMENT_CONTRIBUTOR_ID,
  ENROLLMENT_OBSERVATION_ATTR,
  type EnrollmentIntelligenceResult,
  type EnrollmentObservation,
} from "./EnrollmentTypes";

export interface EnrollmentContributorOptions {
  /** Override contributor id (tests). */
  id?: string;
  priority?: number;
}

/**
 * Create the Enrollment Intelligence cognitive contributor.
 * Expects a normalized {@link EnrollmentObservation} on Intent or Context attributes
 * under {@link ENROLLMENT_OBSERVATION_ATTR}.
 */
export function createEnrollmentContributor(
  options: EnrollmentContributorOptions = {}
): CognitiveContributor {
  const id = options.id ?? ENROLLMENT_CONTRIBUTOR_ID;
  const priority = options.priority ?? 50;

  return {
    id,
    priority,
    capabilities: ["education", "enrollment"],
    supports(request) {
      return extractObservation(request) !== null || isEnrollIntent(request);
    },
    gatherEvidence(request) {
      const observation = extractObservation(request);
      if (!observation) return [];
      return analyzeEnrollment(observation, { now: request.now }).evidence;
    },
    analyze(request, evidence) {
      const observation = extractObservation(request);
      if (!observation) return [];
      const result = analyzeEnrollment(observation, { now: request.now });
      return toFindings(id, result, evidence);
    },
    recommend(request, evidence) {
      const observation = extractObservation(request);
      if (!observation) return [];
      const result = analyzeEnrollment(observation, { now: request.now });
      return toRecommendationDrafts(result, evidence);
    },
  };
}

/** Direct API for hosts/tests — same intelligence without a Think request. */
export function runEnrollmentIntelligence(
  observation: EnrollmentObservation,
  options?: { now?: string }
): EnrollmentIntelligenceResult {
  return analyzeEnrollment(observation, options);
}

export function extractObservation(
  request: CognitiveThinkRequest
): EnrollmentObservation | null {
  const fromIntent = request.intent?.attributes?.[ENROLLMENT_OBSERVATION_ATTR];
  const fromContext =
    request.organizationalContext?.attributes?.[ENROLLMENT_OBSERVATION_ATTR];
  const raw = fromIntent ?? fromContext;
  if (!raw || typeof raw !== "object") return null;
  return raw as EnrollmentObservation;
}

function isEnrollIntent(request: CognitiveThinkRequest): boolean {
  const intentId = request.intent?.intentId ?? "";
  if (intentId === "education.enroll" || intentId.endsWith(".enroll")) {
    return true;
  }
  return request.intent?.domainHints?.includes("education") === true;
}

function toFindings(
  providerId: string,
  result: EnrollmentIntelligenceResult,
  evidence: readonly CognitiveEvidenceRef[]
): CognitiveFinding[] {
  const findings: CognitiveFinding[] = [
    {
      id: `finding.enrollment.readiness.${result.enrollmentRequestId}`,
      providerId,
      title: `Enrollment readiness: ${result.readiness}`,
      summary: result.explanation,
      confidence: result.confidence,
      evidenceRefs: evidence.length > 0 ? evidence : result.evidence,
      attributes: {
        readiness: result.readiness,
        blockingIssues: result.blockingIssues,
        warnings: result.warnings,
        priority: result.priority,
      },
    },
  ];

  for (const issue of result.blockingIssues) {
    findings.push({
      id: `finding.enrollment.blocking.${hash(issue)}`,
      providerId,
      title: "Blocking issue",
      summary: issue,
      confidence: 0.95,
      evidenceRefs: result.evidence,
      attributes: { severity: "blocking" },
    });
  }

  return findings;
}

function toRecommendationDrafts(
  result: EnrollmentIntelligenceResult,
  evidence: readonly CognitiveEvidenceRef[]
): CognitiveRecommendationDraft[] {
  return result.recommendations.map((rec) => {
    const refs =
      evidence.length > 0
        ? evidence.filter((e) => rec.evidenceIds.includes(e.id))
        : result.evidence.filter((e) => rec.evidenceIds.includes(e.id));
    const primaryAction = rec.suggestedActions[0];
    return {
      id: rec.id,
      type:
        rec.kind === "approve_enrollment"
          ? "actionable"
          : rec.kind === "waitlist" || rec.kind === "hold_pending_documents"
            ? "warning"
            : "actionable",
      title: rec.title,
      rationale: rec.explanation,
      priority: rec.priority,
      confidence: rec.confidence,
      evidenceRefs: refs.length > 0 ? refs : result.evidence,
      topicId: "education.enrollment",
      suggestedNextAction: primaryAction?.actionId,
      attributes: {
        kind: rec.kind,
        why: rec.explanation,
        supportingEvidenceIds: rec.evidenceIds,
        confidence: rec.confidence,
        priority: rec.priority,
        suggestedActions: rec.suggestedActions,
        constitutionalTrace: rec.constitutionalTrace,
        actionProposalsOnly: true,
      },
    };
  });
}

function hash(value: string): string {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}
