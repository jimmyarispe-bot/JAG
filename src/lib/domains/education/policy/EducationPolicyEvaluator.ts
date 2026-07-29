/**
 * Metadata-driven policy evaluators.
 * Maps Knowledge policy parameter definitions + normalized facts → outcomes.
 * No recommendations. No actions. No contributor-specific branches by name
 * beyond stable Knowledge policy ids.
 */

import {
  EDUCATION_POLICY_IDS,
  type EducationPolicyDefinition,
} from "../knowledge";
import type {
  EducationPolicyContext,
  EducationPolicyFacts,
} from "./EducationPolicyContext";
import type { EducationPolicyEvaluationItem } from "./EducationPolicyResult";
import type { EducationPolicySatisfaction } from "./EducationPolicySatisfaction";
import {
  createPolicyEvidenceRef,
  type EducationPolicyEvidenceRef,
  type EducationPolicyOutcome,
  type EducationPolicyTrace,
} from "./EducationPolicyTrace";
import type { EducationPolicyViolation } from "./EducationPolicyViolation";

export function evaluateEducationPolicy(
  policy: EducationPolicyDefinition,
  context: EducationPolicyContext
): EducationPolicyEvaluationItem {
  const evaluatedAt = context.now ?? new Date().toISOString();
  const appliedParameters = resolveParameters(policy, context);
  const facts = context.facts;

  const built = dispatchEvaluation(policy, facts, appliedParameters);

  const trace: EducationPolicyTrace = {
    policyId: policy.id,
    policyName: policy.name,
    outcome: built.outcome,
    explanation: built.explanation,
    supportingEvidence: built.evidence,
    missingEvidence: built.missingEvidence,
    evaluatedAt,
    appliedParameters,
  };

  const item: EducationPolicyEvaluationItem = {
    policyId: policy.id,
    outcome: built.outcome,
    trace,
  };

  if (built.outcome === "satisfied" && built.satisfaction) {
    item.satisfaction = built.satisfaction;
  }
  if (built.outcome === "violated" && built.violation) {
    item.violation = built.violation;
  }

  return item;
}

interface EvalBuilt {
  outcome: EducationPolicyOutcome;
  explanation: string;
  evidence: EducationPolicyEvidenceRef[];
  missingEvidence: string[];
  satisfaction?: EducationPolicySatisfaction;
  violation?: EducationPolicyViolation;
}

function dispatchEvaluation(
  policy: EducationPolicyDefinition,
  facts: EducationPolicyFacts,
  params: Readonly<Record<string, unknown>>
): EvalBuilt {
  switch (policy.id) {
    case EDUCATION_POLICY_IDS.attendanceMinimumRate:
      return evalAttendanceMinimumRate(policy, facts, params);
    case EDUCATION_POLICY_IDS.attendanceChronicAbsence:
      return evalAttendanceChronicAbsence(policy, facts, params);
    case EDUCATION_POLICY_IDS.enrollmentDocumentsRequired:
      return evalEnrollmentDocuments(policy, facts, params);
    case EDUCATION_POLICY_IDS.enrollmentCapacity:
      return evalEnrollmentCapacity(policy, facts, params);
    case EDUCATION_POLICY_IDS.scholarshipEligibility:
      return evalScholarshipEligibility(policy, facts, params);
    case EDUCATION_POLICY_IDS.graduationCredits:
      return evalGraduationCredits(policy, facts, params);
    default:
      return evalGenericByParameters(policy, facts, params);
  }
}

function evalAttendanceMinimumRate(
  policy: EducationPolicyDefinition,
  facts: EducationPolicyFacts,
  params: Readonly<Record<string, unknown>>
): EvalBuilt {
  const minimumRate = asNumber(params.minimumRate);
  const missing: string[] = [];
  if (facts.attendancePresentRate === undefined) {
    missing.push("attendancePresentRate");
  }
  if (minimumRate === undefined) {
    missing.push("parameter:minimumRate");
  }
  if (missing.length) {
    return unknownResult(
      policy,
      "Insufficient data to evaluate minimum attendance rate",
      missing
    );
  }

  const rate = facts.attendancePresentRate!;
  const evidence = [
    createPolicyEvidenceRef({
      policyId: policy.id,
      source: "attendancePresentRate",
      detail: `Present rate ${rate}`,
      attributes: { rate },
    }),
    createPolicyEvidenceRef({
      policyId: policy.id,
      source: "minimumRate",
      detail: `Threshold ${minimumRate}`,
      attributes: { minimumRate },
    }),
  ];

  if (rate >= minimumRate!) {
    return satisfied(
      policy,
      "ATTENDANCE_RATE_MET",
      `Attendance rate ${pct(rate)} meets minimum ${pct(minimumRate!)}`,
      evidence,
      ["minimumRate"]
    );
  }
  return violated(
    policy,
    "ATTENDANCE_RATE_BELOW",
    `Attendance rate ${pct(rate)} below minimum ${pct(minimumRate!)}`,
    evidence,
    ["minimumRate"]
  );
}

function evalAttendanceChronicAbsence(
  policy: EducationPolicyDefinition,
  facts: EducationPolicyFacts,
  params: Readonly<Record<string, unknown>>
): EvalBuilt {
  const threshold = asNumber(params.absenceCount);
  const missing: string[] = [];
  if (facts.attendanceAbsenceCount === undefined) {
    missing.push("attendanceAbsenceCount");
  }
  if (threshold === undefined) missing.push("parameter:absenceCount");
  if (missing.length) {
    return unknownResult(
      policy,
      "Insufficient data to evaluate chronic absence threshold",
      missing
    );
  }

  const count = facts.attendanceAbsenceCount!;
  const evidence = [
    createPolicyEvidenceRef({
      policyId: policy.id,
      source: "attendanceAbsenceCount",
      detail: `Absences ${count}`,
      attributes: { count },
    }),
  ];

  // Satisfied when under the chronic threshold; violated when at/above.
  if (count < threshold!) {
    return satisfied(
      policy,
      "CHRONIC_ABSENCE_NOT_TRIGGERED",
      `Absence count ${count} below chronic threshold ${threshold}`,
      evidence,
      ["absenceCount"]
    );
  }
  return violated(
    policy,
    "CHRONIC_ABSENCE_TRIGGERED",
    `Absence count ${count} meets or exceeds chronic threshold ${threshold}`,
    evidence,
    ["absenceCount"]
  );
}

function evalEnrollmentDocuments(
  policy: EducationPolicyDefinition,
  facts: EducationPolicyFacts,
  params: Readonly<Record<string, unknown>>
): EvalBuilt {
  const required =
    facts.requiredDocumentKinds ??
    asStringList(params.requiredDocumentKinds) ??
    [];
  const completed = facts.completedDocumentKinds ?? [];

  if (required.length === 0 && facts.documentationComplete === undefined) {
    return unknownResult(
      policy,
      "Insufficient data to evaluate document requirements",
      ["requiredDocumentKinds", "completedDocumentKinds"]
    );
  }

  if (facts.documentationComplete === true && required.length === 0) {
    return satisfied(
      policy,
      "DOCUMENTATION_COMPLETE",
      "Documentation marked complete",
      [
        createPolicyEvidenceRef({
          policyId: policy.id,
          source: "documentationComplete",
          detail: "documentationComplete=true",
        }),
      ]
    );
  }

  const missingKinds = required.filter((k) => !completed.includes(k));
  const evidence = [
    createPolicyEvidenceRef({
      policyId: policy.id,
      source: "requiredDocumentKinds",
      detail: `Required: ${required.join(", ")}`,
      attributes: { required },
    }),
    createPolicyEvidenceRef({
      policyId: policy.id,
      source: "completedDocumentKinds",
      detail: `Completed: ${completed.join(", ")}`,
      attributes: { completed },
    }),
  ];

  if (missingKinds.length === 0) {
    return satisfied(
      policy,
      "DOCUMENTS_COMPLETE",
      "All required document kinds are complete",
      evidence,
      ["requiredDocumentKinds"]
    );
  }
  return violated(
    policy,
    "DOCUMENTS_INCOMPLETE",
    `Missing required documents: ${missingKinds.join(", ")}`,
    evidence,
    ["requiredDocumentKinds"],
    { missingKinds }
  );
}

function evalEnrollmentCapacity(
  policy: EducationPolicyDefinition,
  facts: EducationPolicyFacts,
  params: Readonly<Record<string, unknown>>
): EvalBuilt {
  const seatsTotal = facts.seatsTotal ?? asNumber(params.seatsTotal);
  const seatsFilled = facts.seatsFilled;
  const waitlistOpen =
    facts.waitlistOpen ?? asBoolean(params.waitlistOpen);

  const missing: string[] = [];
  if (seatsTotal === undefined) missing.push("seatsTotal");
  if (seatsFilled === undefined) missing.push("seatsFilled");
  if (missing.length) {
    return unknownResult(
      policy,
      "Insufficient data to evaluate enrollment capacity",
      missing
    );
  }

  const evidence = [
    createPolicyEvidenceRef({
      policyId: policy.id,
      source: "seats",
      detail: `${seatsFilled}/${seatsTotal} seats filled`,
      attributes: { seatsFilled, seatsTotal, waitlistOpen },
    }),
  ];

  if (seatsFilled! < seatsTotal!) {
    return satisfied(
      policy,
      "CAPACITY_AVAILABLE",
      `Capacity available (${seatsFilled}/${seatsTotal})`,
      evidence,
      ["seatsTotal"]
    );
  }
  if (waitlistOpen === true) {
    return satisfied(
      policy,
      "CAPACITY_FULL_WAITLIST_OPEN",
      "Seats full but waitlist is open",
      evidence,
      ["seatsTotal", "waitlistOpen"]
    );
  }
  if (waitlistOpen === undefined) {
    return unknownResult(
      policy,
      "Seats full; waitlistOpen unknown",
      ["waitlistOpen"],
      evidence
    );
  }
  return violated(
    policy,
    "CAPACITY_FULL",
    `No seats available (${seatsFilled}/${seatsTotal}) and waitlist closed`,
    evidence,
    ["seatsTotal", "waitlistOpen"]
  );
}

function evalScholarshipEligibility(
  policy: EducationPolicyDefinition,
  facts: EducationPolicyFacts,
  params: Readonly<Record<string, unknown>>
): EvalBuilt {
  const minimumGpa = asNumber(params.minimumGpa);
  const requiresReview =
    facts.scholarshipRequiresReview ?? asBoolean(params.requiresReview);

  const missing: string[] = [];
  if (facts.studentGpa === undefined && facts.scholarshipStatus === undefined) {
    missing.push("studentGpa", "scholarshipStatus");
  }
  if (missing.length) {
    return unknownResult(
      policy,
      "Insufficient data to evaluate scholarship eligibility",
      missing
    );
  }

  const evidence: EducationPolicyEvidenceRef[] = [];
  if (facts.studentGpa !== undefined) {
    evidence.push(
      createPolicyEvidenceRef({
        policyId: policy.id,
        source: "studentGpa",
        detail: `GPA ${facts.studentGpa}`,
        attributes: { gpa: facts.studentGpa },
      })
    );
  }
  if (facts.scholarshipStatus !== undefined) {
    evidence.push(
      createPolicyEvidenceRef({
        policyId: policy.id,
        source: "scholarshipStatus",
        detail: `Status ${facts.scholarshipStatus}`,
        attributes: { status: facts.scholarshipStatus },
      })
    );
  }

  if (
    facts.scholarshipStatus === "denied" ||
    facts.scholarshipStatus === "rejected"
  ) {
    return violated(
      policy,
      "SCHOLARSHIP_DENIED",
      `Scholarship status is ${facts.scholarshipStatus}`,
      evidence
    );
  }

  if (minimumGpa !== undefined && facts.studentGpa !== undefined) {
    if (facts.studentGpa < minimumGpa) {
      return violated(
        policy,
        "SCHOLARSHIP_GPA_BELOW",
        `GPA ${facts.studentGpa} below minimum ${minimumGpa}`,
        evidence,
        ["minimumGpa"]
      );
    }
  } else if (minimumGpa !== undefined && facts.studentGpa === undefined) {
    return unknownResult(
      policy,
      "GPA required for scholarship eligibility but missing",
      ["studentGpa"],
      evidence
    );
  }

  if (
    requiresReview === true &&
    (facts.scholarshipStatus === "review_required" ||
      facts.scholarshipStatus === "pending")
  ) {
    return unknownResult(
      policy,
      "Scholarship requires review; eligibility not yet determined",
      ["scholarshipReviewDecision"],
      evidence
    );
  }

  return satisfied(
    policy,
    "SCHOLARSHIP_ELIGIBLE",
    "Scholarship eligibility criteria satisfied with available evidence",
    evidence,
    ["minimumGpa", "requiresReview"]
  );
}

function evalGraduationCredits(
  policy: EducationPolicyDefinition,
  facts: EducationPolicyFacts,
  params: Readonly<Record<string, unknown>>
): EvalBuilt {
  const required = asNumber(params.requiredCredits);
  const missing: string[] = [];
  if (facts.earnedCredits === undefined) missing.push("earnedCredits");
  if (required === undefined) missing.push("parameter:requiredCredits");
  if (missing.length) {
    return unknownResult(
      policy,
      "Insufficient data to evaluate graduation credits",
      missing
    );
  }

  const evidence = [
    createPolicyEvidenceRef({
      policyId: policy.id,
      source: "earnedCredits",
      detail: `${facts.earnedCredits} / ${required} credits`,
      attributes: {
        earnedCredits: facts.earnedCredits,
        requiredCredits: required,
      },
    }),
  ];

  if (facts.earnedCredits! >= required!) {
    return satisfied(
      policy,
      "GRADUATION_CREDITS_MET",
      `Earned credits ${facts.earnedCredits} meet requirement ${required}`,
      evidence,
      ["requiredCredits"]
    );
  }
  return violated(
    policy,
    "GRADUATION_CREDITS_SHORT",
    `Earned credits ${facts.earnedCredits} below requirement ${required}`,
    evidence,
    ["requiredCredits"]
  );
}

/**
 * Generic fallback: if assessment/documentation flags exist on facts and
 * policy kind suggests prerequisites, use them; else unknown.
 */
function evalGenericByParameters(
  policy: EducationPolicyDefinition,
  facts: EducationPolicyFacts,
  _params: Readonly<Record<string, unknown>>
): EvalBuilt {
  if (
    policy.kind === "enrollment_requirement" &&
    facts.assessmentComplete !== undefined
  ) {
    const evidence = [
      createPolicyEvidenceRef({
        policyId: policy.id,
        source: "assessmentComplete",
        detail: `assessmentComplete=${facts.assessmentComplete}`,
      }),
    ];
    if (facts.assessmentComplete) {
      return satisfied(
        policy,
        "ASSESSMENT_PREREQUISITE_MET",
        "Assessment prerequisite complete",
        evidence
      );
    }
    return violated(
      policy,
      "ASSESSMENT_PREREQUISITE_MISSING",
      "Assessment prerequisite incomplete",
      evidence
    );
  }

  return unknownResult(
    policy,
    `No evaluator registered for policy ${policy.id}`,
    ["evaluator"],
    []
  );
}

function resolveParameters(
  policy: EducationPolicyDefinition,
  context: EducationPolicyContext
): Record<string, unknown> {
  const applied: Record<string, unknown> = {};
  const overrides = context.parameterOverrides?.[policy.id] ?? {};
  for (const param of policy.parameters) {
    if (overrides[param.key] !== undefined) {
      applied[param.key] = overrides[param.key];
    } else if (param.example !== undefined) {
      applied[param.key] = param.example;
    }
  }
  return applied;
}

function satisfied(
  policy: EducationPolicyDefinition,
  code: string,
  message: string,
  evidence: EducationPolicyEvidenceRef[],
  parameterKeys?: string[],
  attributes?: Record<string, unknown>
): EvalBuilt {
  return {
    outcome: "satisfied",
    explanation: message,
    evidence,
    missingEvidence: [],
    satisfaction: {
      policyId: policy.id,
      code,
      message,
      parameterKeys,
      attributes,
    },
  };
}

function violated(
  policy: EducationPolicyDefinition,
  code: string,
  message: string,
  evidence: EducationPolicyEvidenceRef[],
  parameterKeys?: string[],
  attributes?: Record<string, unknown>
): EvalBuilt {
  return {
    outcome: "violated",
    explanation: message,
    evidence,
    missingEvidence: [],
    violation: {
      policyId: policy.id,
      code,
      message,
      parameterKeys,
      attributes,
    },
  };
}

function unknownResult(
  policy: EducationPolicyDefinition,
  explanation: string,
  missingEvidence: string[],
  evidence: EducationPolicyEvidenceRef[] = []
): EvalBuilt {
  return {
    outcome: "unknown",
    explanation,
    evidence,
    missingEvidence,
  };
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function asStringList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  if (!value.every((v) => typeof v === "string")) return undefined;
  return value as string[];
}

function pct(n: number): string {
  return `${(n * 100).toFixed(0)}%`;
}
