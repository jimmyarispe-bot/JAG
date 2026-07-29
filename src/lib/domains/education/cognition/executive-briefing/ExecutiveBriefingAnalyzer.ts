import {
  EDUCATION_CAPABILITY_IDS,
  EDUCATION_ENTITY_IDS,
} from "../../knowledge";
import type { EducationContributorResult } from "../framework";
import {
  countExecutiveBriefingUpstream,
  type ExecutiveBriefingInputs,
} from "./ExecutiveBriefingInputs";
import type {
  ExecutiveBriefingEvidenceCode,
  ExecutiveBriefingStance,
} from "./ExecutiveBriefingTypes";

export interface UpstreamSlice {
  contributorId: string;
  readiness: EducationContributorResult["readiness"];
  confidence: number;
  evidenceCodes: readonly string[];
  blockingCount: number;
  warningCount: number;
  recommendationKinds: readonly string[];
}

export interface ExecutiveBriefingAnalysis {
  stance: ExecutiveBriefingStance;
  briefingConfidence: number;
  signals: ExecutiveBriefingEvidenceCode[];
  executiveSummary: string;
  strategicPriorities: string[];
  keyOpportunities: string[];
  criticalRisks: string[];
  recommendedActions: string[];
  evidenceIndex: string[];
  knowledgeRefs: {
    capabilityId: string;
    entityIds: readonly string[];
  };
  upstreamSummary: {
    schoolHealth?: UpstreamSlice;
    campusPerformance?: UpstreamSlice;
    fundingReadiness?: UpstreamSlice;
    supportPlanning?: UpstreamSlice;
    operationalReadiness?: UpstreamSlice;
  };
}

export function validateExecutiveBriefingInputs(
  inputs: ExecutiveBriefingInputs
): void {
  if (!inputs.subjectId?.trim()) {
    throw new Error("Executive briefing inputs require subjectId");
  }
}

export function analyzeExecutiveBriefing(
  inputs: ExecutiveBriefingInputs
): ExecutiveBriefingAnalysis {
  const schoolHealth = slice(
    "education.cognition.school_health",
    inputs.schoolHealth
  );
  const campusPerformance = slice(
    "education.cognition.campus_performance",
    inputs.campusPerformance
  );
  const fundingReadiness = slice(
    "education.cognition.funding_readiness",
    inputs.fundingReadiness
  );
  const supportPlanning = slice(
    "education.cognition.support_planning",
    inputs.supportPlanning
  );
  const operationalReadiness = slice(
    "education.cognition.operational_readiness",
    inputs.operationalReadiness
  );

  if (countExecutiveBriefingUpstream(inputs) === 0) {
    return {
      stance: "insufficient",
      briefingConfidence: 0,
      signals: ["insufficient_upstream", "synthesis_inputs_bound"],
      executiveSummary:
        "Insufficient upstream results for an executive education briefing.",
      strategicPriorities: [],
      keyOpportunities: [],
      criticalRisks: ["No upstream executive synthesis contributor results"],
      recommendedActions: [],
      evidenceIndex: [],
      knowledgeRefs: knowledgeRefs(),
      upstreamSummary: {},
    };
  }

  const signals: ExecutiveBriefingEvidenceCode[] = ["synthesis_inputs_bound"];
  if (schoolHealth) signals.push("upstream_school_health");
  if (campusPerformance) signals.push("upstream_campus_performance");
  if (fundingReadiness) signals.push("upstream_funding_readiness");
  if (supportPlanning) signals.push("upstream_support_planning");
  if (operationalReadiness) signals.push("upstream_operational_readiness");
  if (inputs.policyResult && inputs.policyResult.evaluations.length > 0) {
    signals.push("policy_signals_present");
  }

  const present = [
    schoolHealth,
    campusPerformance,
    fundingReadiness,
    supportPlanning,
    operationalReadiness,
  ].filter(Boolean) as UpstreamSlice[];

  const criticalRisks: string[] = [];
  const keyOpportunities: string[] = [];
  const strategicPriorities: string[] = [];
  const recommendedActions: string[] = [];
  const evidenceIndex: string[] = present.map(
    (p) => `${p.contributorId}:${p.readiness}`
  );

  for (const p of present) {
    if (p.readiness === "blocked" || p.blockingCount > 0) {
      criticalRisks.push(`${p.contributorId}: blocked`);
    } else if (p.readiness === "conditional" || p.warningCount > 0) {
      criticalRisks.push(`${p.contributorId}: conditional/warnings`);
    } else if (p.readiness === "ready") {
      keyOpportunities.push(`${p.contributorId}: ready posture`);
    }
    for (const code of p.evidenceCodes.slice(0, 3)) {
      evidenceIndex.push(`${p.contributorId}:${code}`);
    }
  }

  if (hasCode(schoolHealth, "health_critical") || hasCode(schoolHealth, "health_at_risk")) {
    criticalRisks.push("School health indicates organizational risk");
    strategicPriorities.push("Stabilize organizational health");
  }
  if (
    hasCode(campusPerformance, "performance_underperforming") ||
    hasCode(campusPerformance, "performance_mixed")
  ) {
    criticalRisks.push("Campus performance gaps require leadership attention");
    strategicPriorities.push("Close cross-campus performance gaps");
  }
  if (
    hasCode(fundingReadiness, "funding_blocked") ||
    hasCode(fundingReadiness, "funding_at_risk")
  ) {
    criticalRisks.push("Funding readiness concerns");
    strategicPriorities.push("Secure funding readiness");
  }
  if (supportPlanning && supportPlanning.readiness !== "ready") {
    strategicPriorities.push("Strengthen student support planning");
  }
  if (operationalReadiness && operationalReadiness.readiness !== "ready") {
    strategicPriorities.push("Restore operational readiness");
  }

  if (hasCode(schoolHealth, "health_healthy")) {
    keyOpportunities.push("Healthy organizational baseline to extend");
  }
  if (hasCode(campusPerformance, "performance_strong")) {
    keyOpportunities.push("Replicate high-performing campus practices");
  }
  if (fundingReadiness?.readiness === "ready") {
    keyOpportunities.push("Funding posture supports strategic investment");
  }

  if (strategicPriorities.length === 0) {
    strategicPriorities.push(
      "Maintain network health",
      "Advance strategic goals",
      "Sustain campus performance"
    );
  }

  const urgent =
    present.some((p) => p.readiness === "blocked") ||
    hasCode(schoolHealth, "health_critical") ||
    hasCode(fundingReadiness, "funding_blocked");
  const cautionary =
    !urgent &&
    (criticalRisks.length > 0 ||
      present.some((p) => p.readiness === "conditional") ||
      hasCode(schoolHealth, "health_watch") ||
      hasCode(campusPerformance, "performance_mixed"));

  let stance: ExecutiveBriefingStance = "favorable";
  if (urgent) {
    stance = "urgent";
    signals.push("briefing_urgent", "critical_risks");
  } else if (cautionary) {
    stance = "cautionary";
    signals.push("briefing_cautionary", "critical_risks");
  } else {
    stance = "favorable";
    signals.push("briefing_favorable");
  }

  signals.push(
    "executive_summary",
    "strategic_priorities",
    "key_opportunities",
    "evidence_index"
  );
  if (criticalRisks.length > 0) signals.push("critical_risks");

  const avgConfidence =
    present.reduce((sum, p) => sum + p.confidence, 0) /
    Math.max(present.length, 1);
  const briefingConfidence = Math.max(
    0,
    Math.min(
      1,
      avgConfidence *
        (stance === "urgent" ? 0.85 : stance === "cautionary" ? 0.9 : 0.95)
    )
  );

  const executiveSummary = `Executive education briefing stance is ${stance} (confidence ${briefingConfidence.toFixed(2)}). School health, campus performance, funding readiness, support planning, and operational readiness were synthesized for leadership review.`;

  if (stance === "urgent") {
    recommendedActions.push("Escalate critical strategic risks to the board");
  }
  if (criticalRisks.length > 0) {
    recommendedActions.push("Mitigate critical risks before next quarterly review");
  }
  if (keyOpportunities.length > 0) {
    recommendedActions.push("Pursue key opportunities identified in the brief");
  }
  recommendedActions.push("Publish executive education brief");
  recommendedActions.push(...strategicPriorities.slice(0, 2));

  return {
    stance,
    briefingConfidence,
    signals: [...new Set(signals)],
    executiveSummary,
    strategicPriorities: [...new Set(strategicPriorities)],
    keyOpportunities: [...new Set(keyOpportunities)],
    criticalRisks: [...new Set(criticalRisks)],
    recommendedActions: [...new Set(recommendedActions)],
    evidenceIndex: [...new Set(evidenceIndex)],
    knowledgeRefs: knowledgeRefs(),
    upstreamSummary: {
      schoolHealth,
      campusPerformance,
      fundingReadiness,
      supportPlanning,
      operationalReadiness,
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
    recommendationKinds: result.recommendations.map((r) => r.kind),
  };
}

function hasCode(slice: UpstreamSlice | undefined, code: string): boolean {
  return Boolean(slice?.evidenceCodes.includes(code));
}

function knowledgeRefs() {
  return {
    capabilityId: EDUCATION_CAPABILITY_IDS.executiveBriefing,
    entityIds: [
      EDUCATION_ENTITY_IDS.network,
      EDUCATION_ENTITY_IDS.district,
      EDUCATION_ENTITY_IDS.strategicGoal,
      EDUCATION_ENTITY_IDS.executiveKpi,
      EDUCATION_ENTITY_IDS.performanceIndicator,
    ],
  };
}
