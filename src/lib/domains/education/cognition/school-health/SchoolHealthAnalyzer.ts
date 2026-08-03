import {
  EDUCATION_CAPABILITY_IDS,
  EDUCATION_ENTITY_IDS,
} from "../../knowledge";
import type { EducationContributorResult } from "../framework";
import {
  countSchoolHealthUpstream,
  type SchoolHealthInputs,
} from "./SchoolHealthInputs";
import type {
  SchoolHealthEvidenceCode,
  SchoolHealthStance,
} from "./SchoolHealthTypes";

interface UpstreamSlice {
  contributorId: string;
  readiness: EducationContributorResult["readiness"];
  confidence: number;
  evidenceCodes: readonly string[];
  blockingCount: number;
  warningCount: number;
}

export interface SchoolHealthAnalysis {
  stance: SchoolHealthStance;
  healthScore: number;
  signals: SchoolHealthEvidenceCode[];
  healthIndicators: string[];
  riskProfile: string[];
  strengthProfile: string[];
  recommendedActions: string[];
  knowledgeRefs: {
    capabilityId: string;
    entityIds: readonly string[];
  };
  upstreamSummary: {
    studentSuccess?: UpstreamSlice;
    supportPlanning?: UpstreamSlice;
    operationalReadiness?: UpstreamSlice;
    fundingReadiness?: UpstreamSlice;
  };
}

export function validateSchoolHealthInputs(inputs: SchoolHealthInputs): void {
  if (!inputs.subjectId?.trim()) {
    throw new Error("School health inputs require subjectId");
  }
}

export function analyzeSchoolHealth(
  inputs: SchoolHealthInputs
): SchoolHealthAnalysis {
  const studentSuccess = slice(
    "education.cognition.student_success",
    inputs.studentSuccess
  );
  const supportPlanning = slice(
    "education.cognition.support_planning",
    inputs.supportPlanning
  );
  const operationalReadiness = slice(
    "education.cognition.operational_readiness",
    inputs.operationalReadiness
  );
  const fundingReadiness = slice(
    "education.cognition.funding_readiness",
    inputs.fundingReadiness
  );

  if (countSchoolHealthUpstream(inputs) === 0) {
    return {
      stance: "insufficient",
      healthScore: 0,
      signals: ["insufficient_upstream", "synthesis_inputs_bound"],
      healthIndicators: [],
      riskProfile: ["No upstream synthesis contributor results"],
      strengthProfile: [],
      recommendedActions: [],
      knowledgeRefs: knowledgeRefs(),
      upstreamSummary: {},
    };
  }

  const signals: SchoolHealthEvidenceCode[] = ["synthesis_inputs_bound"];
  if (studentSuccess) signals.push("upstream_student_success");
  if (supportPlanning) signals.push("upstream_support_planning");
  if (operationalReadiness) signals.push("upstream_operational_readiness");
  if (fundingReadiness) signals.push("upstream_funding_readiness");
  if (inputs.policyResult && inputs.policyResult.evaluations.length > 0) {
    signals.push("policy_signals_present");
  }

  const riskProfile: string[] = [];
  const strengthProfile: string[] = [];
  const present = [
    studentSuccess,
    supportPlanning,
    operationalReadiness,
    fundingReadiness,
  ].filter(Boolean) as UpstreamSlice[];

  for (const p of present) {
    if (p.readiness === "blocked" || p.blockingCount > 0) {
      riskProfile.push(`${p.contributorId}: blocked`);
    } else if (p.readiness === "conditional" || p.warningCount > 0) {
      riskProfile.push(`${p.contributorId}: conditional/warnings`);
    } else if (p.readiness === "ready") {
      strengthProfile.push(`${p.contributorId}: ready`);
    }
  }

  const successConcern =
    studentSuccess?.readiness === "blocked" ||
    studentSuccess?.readiness === "conditional" ||
    hasCode(studentSuccess, "high_academic_risk") ||
    hasCode(studentSuccess, "attendance_concern");
  const supportConcern =
    supportPlanning?.readiness === "blocked" ||
    supportPlanning?.readiness === "conditional";
  const opsConcern =
    operationalReadiness?.readiness === "blocked" ||
    operationalReadiness?.readiness === "conditional" ||
    hasCode(operationalReadiness, "readiness_blocked");
  const fundingConcern =
    fundingReadiness?.readiness === "blocked" ||
    fundingReadiness?.readiness === "conditional" ||
    hasCode(fundingReadiness, "funding_blocked") ||
    hasCode(fundingReadiness, "funding_at_risk");

  if (successConcern) riskProfile.push("Student success concerns");
  if (supportConcern) riskProfile.push("Support planning concerns");
  if (opsConcern) riskProfile.push("Operational readiness concerns");
  if (fundingConcern) riskProfile.push("Funding readiness concerns");

  const hard =
    present.some((p) => p.readiness === "blocked") ||
    hasCode(fundingReadiness, "funding_blocked") ||
    hasCode(operationalReadiness, "readiness_blocked");
  const soft =
    successConcern ||
    supportConcern ||
    opsConcern ||
    fundingConcern ||
    riskProfile.length > 0;

  let stance: SchoolHealthStance = "healthy";
  if (hard && (successConcern || fundingConcern || opsConcern)) {
    stance = "critical";
    signals.push("health_critical", "health_risks");
  } else if (hard) {
    stance = "at_risk";
    signals.push("health_at_risk", "health_risks");
  } else if (soft) {
    stance = "watch";
    signals.push("health_watch", "health_risks");
  } else {
    stance = "healthy";
    signals.push("health_healthy");
  }

  if (strengthProfile.length > 0) {
    signals.push("health_strengths");
  }

  const readyCount = present.filter((p) => p.readiness === "ready").length;
  const healthScore = Math.max(
    0,
    Math.min(
      1,
      readyCount / Math.max(present.length, 1) -
        (stance === "critical" ? 0.45 : stance === "at_risk" ? 0.25 : 0)
    )
  );

  const healthIndicators = [
    `stance:${stance}`,
    `score:${healthScore.toFixed(2)}`,
    `upstream_ready:${readyCount}/${present.length}`,
  ];

  const recommendedActions: string[] = [];
  if (successConcern) {
    recommendedActions.push("Address student success risks before board review");
  }
  if (opsConcern) {
    recommendedActions.push("Stabilize operational readiness across campuses");
  }
  if (fundingConcern) {
    recommendedActions.push("Resolve funding readiness gaps");
  }
  if (supportConcern) {
    recommendedActions.push("Align support planning with organizational risk");
  }
  if (stance === "healthy") {
    recommendedActions.push("Publish school health brief for leadership");
  } else {
    recommendedActions.push("Prioritize organizational health remediation");
  }

  return {
    stance,
    healthScore,
    signals: [...new Set(signals)],
    healthIndicators,
    riskProfile: [...new Set(riskProfile)],
    strengthProfile: [...new Set(strengthProfile)],
    recommendedActions,
    knowledgeRefs: knowledgeRefs(),
    upstreamSummary: {
      studentSuccess,
      supportPlanning,
      operationalReadiness,
      fundingReadiness,
    },
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
    capabilityId: EDUCATION_CAPABILITY_IDS.schoolHealth,
    entityIds: [
      EDUCATION_ENTITY_IDS.campus,
      EDUCATION_ENTITY_IDS.district,
      EDUCATION_ENTITY_IDS.network,
      EDUCATION_ENTITY_IDS.executiveKpi,
      EDUCATION_ENTITY_IDS.performanceIndicator,
    ],
  };
}
