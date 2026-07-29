/**
 * Enrollment recommendations — proposals only, no Action execution.
 */

import type { EnrollmentEvidenceItem } from "./EnrollmentEvidence";
import {
  ENROLLMENT_ACTION_PROPOSAL_IDS,
  ENROLLMENT_CONTRIBUTOR_ID,
  type EnrollmentActionProposal,
  type EnrollmentConstitutionalTrace,
  type EnrollmentObservation,
  type EnrollmentRecommendation,
  type EnrollmentRecommendationKind,
} from "./EnrollmentTypes";

function trace(rationale: string): EnrollmentConstitutionalTrace {
  return {
    domainPackageId: "education",
    contributorId: ENROLLMENT_CONTRIBUTOR_ID,
    laws: [
      "LAW_1_JAG_IS_THE_PRODUCT",
      "LAW_3_INTELLIGENCE_BEFORE_INTERFACES",
      "LAW_7_EVIDENCE_REQUIRED",
    ],
    rationale,
  };
}

function action(
  kind: EnrollmentActionProposal["kind"],
  priority: number,
  rationale: string,
  label?: string
): EnrollmentActionProposal {
  return {
    kind,
    actionId: ENROLLMENT_ACTION_PROPOSAL_IDS[kind],
    label: label ?? kind,
    priority,
    rationale,
  };
}

function recommendation(input: {
  kind: EnrollmentRecommendationKind;
  title: string;
  explanation: string;
  confidence: number;
  priority: number;
  evidence: readonly EnrollmentEvidenceItem[];
  codes: readonly string[];
  suggestedActions: readonly EnrollmentActionProposal[];
}): EnrollmentRecommendation {
  const evidenceIds = input.evidence
    .filter((e) => input.codes.includes(e.code))
    .map((e) => e.id);
  return {
    id: `rec.${input.kind}`,
    kind: input.kind,
    title: input.title,
    explanation: input.explanation,
    confidence: clamp01(input.confidence),
    priority: input.priority,
    evidenceIds:
      evidenceIds.length > 0
        ? evidenceIds
        : input.evidence.map((e) => e.id).slice(0, 3),
    suggestedActions: input.suggestedActions,
    constitutionalTrace: trace(input.explanation),
    attributes: {
      why: input.explanation,
      supportingEvidenceIds: evidenceIds,
      confidence: clamp01(input.confidence),
      priority: input.priority,
    },
  };
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

export interface EnrollmentRecommendationContext {
  observation: EnrollmentObservation;
  evidence: readonly EnrollmentEvidenceItem[];
  blockingIssues: readonly string[];
  warnings: readonly string[];
  readiness: "ready" | "blocked" | "conditional";
  confidence: number;
}

/** Build ranked recommendations from evidence + readiness. */
export function buildEnrollmentRecommendations(
  ctx: EnrollmentRecommendationContext
): EnrollmentRecommendation[] {
  const { evidence, observation, readiness, confidence } = ctx;
  const byCode = new Set(evidence.map((e) => e.code));
  const recs: EnrollmentRecommendation[] = [];

  const hasMissingDocs =
    byCode.has("missing_transcript") ||
    byCode.has("missing_required_document");
  const capacityReached = byCode.has("capacity_reached");
  const scholarshipPending = byCode.has("scholarship_pending");
  const scholarshipReview = byCode.has("scholarship_review_required");
  const assessmentPending =
    byCode.has("assessment_pending") || byCode.has("assessment_incomplete");
  const interviewPending = byCode.has("family_interview_pending");
  const campusUnassigned = byCode.has("campus_unassigned");
  const waitlistOpen = observation.capacity?.waitlistOpen === true;

  if (hasMissingDocs) {
    recs.push(
      recommendation({
        kind: "hold_pending_documents",
        title: "Hold Pending Documents",
        explanation:
          "Enrollment cannot proceed because required documents are missing or rejected. Supporting evidence identifies each gap.",
        confidence: Math.min(confidence + 0.1, 0.95),
        priority: 1,
        evidence,
        codes: ["missing_transcript", "missing_required_document"],
        suggestedActions: [
          action(
            "RequestDocuments",
            1,
            "Request outstanding required documents from the family"
          ),
          action("NotifyFamily", 2, "Notify family of document hold"),
        ],
      })
    );
  }

  if (capacityReached) {
    recs.push(
      recommendation({
        kind: "waitlist",
        title: waitlistOpen ? "Waitlist" : "Hold — No Capacity",
        explanation: waitlistOpen
          ? "Program capacity is reached; waitlist is open. Recommend waitlisting rather than approval."
          : "Program capacity is reached and waitlist is not open. Approval is blocked.",
        confidence: 0.95,
        priority: 1,
        evidence,
        codes: ["capacity_reached"],
        suggestedActions: waitlistOpen
          ? [
              action(
                "WaitlistEnrollment",
                1,
                "Place enrollment request on waitlist"
              ),
              action("NotifyFamily", 2, "Notify family of waitlist status"),
            ]
          : [
              action(
                "NotifyFamily",
                1,
                "Notify family that capacity is unavailable"
              ),
              action(
                "RejectEnrollment",
                3,
                "Reject only if host policy requires closure when waitlist is closed"
              ),
            ],
      })
    );
  }

  if (assessmentPending) {
    recs.push(
      recommendation({
        kind: "request_evaluation",
        title: "Request Evaluation",
        explanation:
          "Assessment is pending or incomplete. Evaluation must complete before approval.",
        confidence: 0.9,
        priority: 2,
        evidence,
        codes: ["assessment_pending", "assessment_incomplete"],
        suggestedActions: [
          action(
            "ScheduleEvaluation",
            1,
            "Schedule required enrollment evaluation"
          ),
          action("NotifyFamily", 2, "Notify family of evaluation requirement"),
        ],
      })
    );
  }

  if (scholarshipPending || scholarshipReview) {
    recs.push(
      recommendation({
        kind: "flag_scholarship_review",
        title: "Flag Scholarship Review",
        explanation: scholarshipReview
          ? "Scholarship status requires manual review before final enrollment decision."
          : "Scholarship decision is still pending; flag for review before approval.",
        confidence: 0.85,
        priority: 2,
        evidence,
        codes: ["scholarship_pending", "scholarship_review_required"],
        suggestedActions: [
          action(
            "FlagScholarshipReview",
            1,
            "Route scholarship for review"
          ),
        ],
      })
    );
  }

  if (campusUnassigned) {
    recs.push(
      recommendation({
        kind: "assign_campus",
        title: "Assign Campus",
        explanation:
          "No campus is assigned on the enrollment observation. Campus assignment is required for placement.",
        confidence: 0.8,
        priority: 3,
        evidence,
        codes: ["campus_unassigned"],
        suggestedActions: [
          action("AssignCampus", 1, "Assign campus for this enrollment"),
        ],
      })
    );
  }

  if (!observation.program?.programId) {
    recs.push(
      recommendation({
        kind: "assign_program",
        title: "Assign Program",
        explanation:
          "Program assignment is missing from the enrollment observation.",
        confidence: 0.8,
        priority: 3,
        evidence,
        codes: ["program_assigned"],
        suggestedActions: [
          action("AssignProgram", 1, "Assign program for this enrollment"),
        ],
      })
    );
  }

  if (interviewPending) {
    recs.push(
      recommendation({
        kind: "recommend_parent_meeting",
        title: "Recommend Parent Meeting",
        explanation:
          "Family interview is pending or scheduled but not complete. A parent meeting supports enrollment readiness.",
        confidence: 0.75,
        priority: 3,
        evidence,
        codes: ["family_interview_pending"],
        suggestedActions: [
          action(
            "ScheduleParentMeeting",
            1,
            "Schedule parent / family meeting"
          ),
          action("NotifyFamily", 2, "Notify family of meeting request"),
        ],
      })
    );
  }

  if (readiness === "ready") {
    recs.push(
      recommendation({
        kind: "approve_enrollment",
        title: "Approve Enrollment",
        explanation:
          "No blocking issues remain: documents, capacity, assessment, and signatures satisfy readiness. Approval is recommended as an Action proposal only.",
        confidence: Math.max(confidence, 0.85),
        priority: 1,
        evidence,
        codes: [
          "documents_complete",
          "capacity_available",
          "assessment_complete",
          "scholarship_approved",
          "family_interview_complete",
          "program_assigned",
        ],
        suggestedActions: [
          action(
            "ApproveEnrollment",
            1,
            "Propose enrollment approval (Action Runtime executes separately)"
          ),
          action("NotifyFamily", 2, "Notify family after host approves"),
        ],
      })
    );
  }

  return recs.sort((a, b) => a.priority - b.priority || b.confidence - a.confidence);
}

/** Flatten unique action proposals from recommendations. */
export function flattenSuggestedActions(
  recommendations: readonly EnrollmentRecommendation[]
): EnrollmentActionProposal[] {
  const seen = new Set<string>();
  const out: EnrollmentActionProposal[] = [];
  for (const rec of recommendations) {
    for (const proposal of rec.suggestedActions) {
      if (seen.has(proposal.actionId)) continue;
      seen.add(proposal.actionId);
      out.push(proposal);
    }
  }
  return out.sort((a, b) => a.priority - b.priority);
}
