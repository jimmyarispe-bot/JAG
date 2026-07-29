import {
  EDUCATION_CAPABILITY_IDS,
  EDUCATION_ENTITY_IDS,
} from "../../knowledge";
import type { EducationContributorResult } from "../framework";
import {
  countFundingUpstream,
  type FundingReadinessInputs,
} from "./FundingReadinessInputs";
import type {
  FundingReadinessEvidenceCode,
  FundingReadinessStance,
} from "./FundingReadinessTypes";

export interface UpstreamSlice {
  contributorId: string;
  readiness: EducationContributorResult["readiness"];
  confidence: number;
  evidenceCodes: readonly string[];
  blockingCount: number;
  warningCount: number;
}

export interface FundingReadinessAnalysis {
  stance: FundingReadinessStance;
  fundingPriority: number;
  signals: FundingReadinessEvidenceCode[];
  fundingRisks: string[];
  recommendedActions: string[];
  knowledgeRefs: {
    capabilityId: string;
    entityIds: readonly string[];
  };
  upstreamSummary: {
    scholarship?: UpstreamSlice;
    compliance?: UpstreamSlice;
    enrollment?: UpstreamSlice;
  };
}

export function validateFundingReadinessInputs(
  inputs: FundingReadinessInputs
): void {
  if (!inputs.subjectId?.trim()) {
    throw new Error("Funding readiness inputs require subjectId");
  }
}

export function analyzeFundingReadiness(
  inputs: FundingReadinessInputs
): FundingReadinessAnalysis {
  const scholarship = slice(
    "education.cognition.scholarship",
    inputs.scholarship
  );
  const compliance = slice("education.cognition.compliance", inputs.compliance);
  const enrollment = slice("education.cognition.enrollment", inputs.enrollment);

  if (countFundingUpstream(inputs) === 0) {
    return {
      stance: "insufficient",
      fundingPriority: 1,
      signals: ["insufficient_upstream", "synthesis_inputs_bound"],
      fundingRisks: ["No upstream funding/compliance contributor results"],
      recommendedActions: [],
      knowledgeRefs: knowledgeRefs(),
      upstreamSummary: {},
    };
  }

  const signals: FundingReadinessEvidenceCode[] = ["synthesis_inputs_bound"];
  if (scholarship) signals.push("upstream_scholarship");
  if (compliance) signals.push("upstream_compliance");
  if (enrollment) signals.push("upstream_enrollment");
  if (inputs.policyResult && inputs.policyResult.evaluations.length > 0) {
    signals.push("policy_signals_present");
  }

  const fundingRisks: string[] = [];
  const present = [scholarship, compliance, enrollment].filter(
    Boolean
  ) as UpstreamSlice[];

  for (const p of present) {
    if (p.readiness === "blocked" || p.blockingCount > 0) {
      fundingRisks.push(`${p.contributorId}: blocked`);
    } else if (p.readiness === "conditional" || p.warningCount > 0) {
      fundingRisks.push(`${p.contributorId}: conditional/warnings`);
    }
  }

  const renewalRisk = hasCode(scholarship, "renewal_risk");
  const complianceViolation = hasCode(compliance, "compliance_violation");
  const outstanding = hasCode(compliance, "outstanding_obligation");
  const enrollmentBlocked = enrollment?.readiness === "blocked";

  if (renewalRisk) fundingRisks.push("Scholarship renewal risk");
  if (complianceViolation) fundingRisks.push("Compliance violations");
  if (outstanding) fundingRisks.push("Outstanding compliance obligations");
  if (enrollmentBlocked) fundingRisks.push("Enrollment blockers");

  const hard =
    complianceViolation ||
    enrollmentBlocked ||
    present.some((p) => p.readiness === "blocked");
  const soft = renewalRisk || outstanding;

  let stance: FundingReadinessStance = "ready";
  if (hard) {
    stance = "blocked";
    signals.push("funding_blocked", "funding_risks");
  } else if (soft || fundingRisks.length > 0) {
    stance = "at_risk";
    signals.push("funding_at_risk", "funding_risks");
  } else {
    stance = "ready";
    signals.push("funding_ready");
  }

  const fundingPriority =
    stance === "blocked" ? 1 : stance === "at_risk" ? 2 : 4;

  const recommendedActions: string[] = [];
  if (renewalRisk) recommendedActions.push("Address scholarship renewal risk");
  if (complianceViolation || outstanding) {
    recommendedActions.push("Clear compliance obligations before funding release");
  }
  if (stance === "ready") {
    recommendedActions.push("Publish executive funding brief");
  } else {
    recommendedActions.push("Stabilize funding posture before audit/eligibility");
  }

  return {
    stance,
    fundingPriority,
    signals: [...new Set(signals)],
    fundingRisks: [...new Set(fundingRisks)],
    recommendedActions,
    knowledgeRefs: knowledgeRefs(),
    upstreamSummary: { scholarship, compliance, enrollment },
  };
}

function slice(
  contributorId: string,
  result?: EducationContributorResult
): UpstreamSlice | undefined {
  if (!result) return undefined;
  return {
    contributorId,
    readiness: result.readiness,
    confidence: result.confidence,
    evidenceCodes: result.evidence
      .map((e) =>
        typeof e.attributes?.code === "string" ? e.attributes.code : ""
      )
      .filter(Boolean),
    blockingCount: result.blockingIssues.length,
    warningCount: result.warnings.length,
  };
}

function hasCode(slice: UpstreamSlice | undefined, code: string): boolean {
  return Boolean(slice?.evidenceCodes.includes(code));
}

function knowledgeRefs() {
  return {
    capabilityId: EDUCATION_CAPABILITY_IDS.fundingReadiness,
    entityIds: [
      EDUCATION_ENTITY_IDS.scholarshipAward,
      EDUCATION_ENTITY_IDS.complianceRequirement,
      EDUCATION_ENTITY_IDS.fundingPeriod,
      EDUCATION_ENTITY_IDS.enrollment,
    ],
  };
}
