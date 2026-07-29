import {
  EDUCATION_CAPABILITY_IDS,
  EDUCATION_ENTITY_IDS,
  EDUCATION_POLICY_IDS,
} from "../../knowledge";
import type { ComplianceObservation } from "./ComplianceObservation";
import type { ComplianceEvidenceCode } from "./ComplianceTypes";

export interface ComplianceAnalysis {
  signals: ComplianceEvidenceCode[];
  violatedObligationIds: string[];
  outstandingObligationIds: string[];
  riskIndicators: string[];
  knowledgeRefs: {
    capabilityId: string;
    entityIds: readonly string[];
    policyIds: readonly string[];
  };
}

export function analyzeCompliance(
  observation: ComplianceObservation
): ComplianceAnalysis {
  const obligations = observation.obligations ?? [];
  const signals: ComplianceEvidenceCode[] = ["compliance_bound"];

  if (
    obligations.length === 0 &&
    observation.attendanceCompliant === undefined &&
    observation.assessmentsComplete === undefined
  ) {
    return {
      signals: ["insufficient_compliance_data", "compliance_bound"],
      violatedObligationIds: [],
      outstandingObligationIds: [],
      riskIndicators: [],
      knowledgeRefs: knowledgeRefs(),
    };
  }

  const violatedObligationIds = obligations
    .filter((o) => o.status === "overdue")
    .map((o) => o.obligationId);
  const outstandingObligationIds = obligations
    .filter((o) => o.status === "outstanding" || o.status === "overdue")
    .map((o) => o.obligationId);

  const riskIndicators: string[] = [];
  for (const o of obligations) {
    if (o.status === "overdue" || o.riskLevel === "high") {
      riskIndicators.push(`${o.kind}:${o.obligationId}`);
    }
  }
  if (observation.attendanceCompliant === false) {
    riskIndicators.push("attendance_noncompliant");
    violatedObligationIds.push("attendance_posture");
  }
  if (observation.assessmentsComplete === false) {
    riskIndicators.push("assessment_incomplete");
    outstandingObligationIds.push("assessment_posture");
  }

  if (violatedObligationIds.length > 0) signals.push("compliance_violation");
  if (outstandingObligationIds.length > 0) signals.push("outstanding_obligation");
  if (riskIndicators.length > 0) signals.push("compliance_risk");
  if (
    violatedObligationIds.length === 0 &&
    outstandingObligationIds.length === 0 &&
    (obligations.length > 0 ||
      observation.attendanceCompliant === true ||
      observation.assessmentsComplete === true)
  ) {
    signals.push("compliance_satisfied");
  }

  return {
    signals: [...new Set(signals)],
    violatedObligationIds: [...new Set(violatedObligationIds)],
    outstandingObligationIds: [...new Set(outstandingObligationIds)],
    riskIndicators: [...new Set(riskIndicators)],
    knowledgeRefs: knowledgeRefs(),
  };
}

function knowledgeRefs() {
  return {
    capabilityId: EDUCATION_CAPABILITY_IDS.compliance,
    entityIds: [
      EDUCATION_ENTITY_IDS.complianceRequirement,
      EDUCATION_ENTITY_IDS.supportingDocumentation,
      EDUCATION_ENTITY_IDS.student,
      EDUCATION_ENTITY_IDS.program,
      EDUCATION_ENTITY_IDS.enrollment,
    ],
    policyIds: [
      EDUCATION_POLICY_IDS.complianceRequiredDocumentation,
      EDUCATION_POLICY_IDS.complianceThresholds,
    ],
  };
}
