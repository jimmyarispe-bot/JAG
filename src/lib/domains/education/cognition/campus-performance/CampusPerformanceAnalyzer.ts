import {
  EDUCATION_CAPABILITY_IDS,
  EDUCATION_ENTITY_IDS,
} from "../../knowledge";
import type { EducationContributorResult } from "../framework";
import {
  countCampusPerformanceUpstream,
  type CampusPerformanceInputs,
  type CampusUnitSnapshot,
} from "./CampusPerformanceInputs";
import type {
  CampusPerformanceEvidenceCode,
  CampusPerformanceStance,
} from "./CampusPerformanceTypes";

interface UpstreamSlice {
  contributorId: string;
  readiness: EducationContributorResult["readiness"];
  confidence: number;
  evidenceCodes: readonly string[];
  blockingCount: number;
  warningCount: number;
}

export interface CampusPerformanceAnalysis {
  stance: CampusPerformanceStance;
  performanceScore: number;
  signals: CampusPerformanceEvidenceCode[];
  performanceIndicators: string[];
  trendSummaries: string[];
  comparativeInsights: string[];
  priorityRecommendations: string[];
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
  campuses: readonly CampusUnitSnapshot[];
}

export function validateCampusPerformanceInputs(
  inputs: CampusPerformanceInputs
): void {
  if (!inputs.subjectId?.trim()) {
    throw new Error("Campus performance inputs require subjectId");
  }
}

export function analyzeCampusPerformance(
  inputs: CampusPerformanceInputs
): CampusPerformanceAnalysis {
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

  const campuses = inputs.campuses ?? [];

  if (countCampusPerformanceUpstream(inputs) === 0 && campuses.length === 0) {
    return {
      stance: "insufficient",
      performanceScore: 0,
      signals: ["insufficient_upstream", "synthesis_inputs_bound"],
      performanceIndicators: [],
      trendSummaries: [],
      comparativeInsights: [],
      priorityRecommendations: [],
      knowledgeRefs: knowledgeRefs(),
      upstreamSummary: {},
      campuses,
    };
  }

  const signals: CampusPerformanceEvidenceCode[] = ["synthesis_inputs_bound"];
  if (studentSuccess) signals.push("upstream_student_success");
  if (supportPlanning) signals.push("upstream_support_planning");
  if (operationalReadiness) signals.push("upstream_operational_readiness");
  if (fundingReadiness) signals.push("upstream_funding_readiness");
  if (campuses.length > 0) signals.push("campus_units_bound");
  if (inputs.policyResult && inputs.policyResult.evaluations.length > 0) {
    signals.push("policy_signals_present");
  }

  const present = [
    studentSuccess,
    supportPlanning,
    operationalReadiness,
    fundingReadiness,
  ].filter(Boolean) as UpstreamSlice[];

  const readyRatio =
    present.length === 0
      ? 0.5
      : present.filter((p) => p.readiness === "ready").length / present.length;

  const scoredCampuses = campuses.map((c) => ({
    ...c,
    score: c.score ?? readyRatio,
  }));

  const avgCampusScore =
    scoredCampuses.length > 0
      ? scoredCampuses.reduce((sum, c) => sum + (c.score ?? 0), 0) /
        scoredCampuses.length
      : readyRatio;

  const performanceScore = Math.max(
    0,
    Math.min(1, (avgCampusScore + readyRatio) / 2)
  );

  const comparativeInsights: string[] = [];
  const trendSummaries: string[] = [];
  const performanceIndicators: string[] = [
    `network_score:${performanceScore.toFixed(2)}`,
    `upstream_ready_ratio:${readyRatio.toFixed(2)}`,
    `campus_count:${scoredCampuses.length}`,
  ];

  if (scoredCampuses.length >= 2) {
    const ranked = [...scoredCampuses].sort(
      (a, b) => (b.score ?? 0) - (a.score ?? 0)
    );
    const top = ranked[0]!;
    const bottom = ranked[ranked.length - 1]!;
    comparativeInsights.push(
      `${top.label ?? top.campusId} leads (${(top.score ?? 0).toFixed(2)}) vs ${bottom.label ?? bottom.campusId} (${(bottom.score ?? 0).toFixed(2)})`
    );
    signals.push("comparative_insights");
    const spread = (top.score ?? 0) - (bottom.score ?? 0);
    performanceIndicators.push(`performance_spread:${spread.toFixed(2)}`);
  } else if (scoredCampuses.length === 1) {
    comparativeInsights.push(
      `Single campus unit ${scoredCampuses[0]!.label ?? scoredCampuses[0]!.campusId} scored ${(scoredCampuses[0]!.score ?? 0).toFixed(2)}`
    );
    signals.push("comparative_insights");
  } else {
    comparativeInsights.push(
      "Comparative campus units not supplied; inferred from aggregated upstream readiness"
    );
    signals.push("comparative_insights");
  }

  for (const c of scoredCampuses) {
    if (c.trend) {
      trendSummaries.push(
        `${c.label ?? c.campusId}: ${c.trend} (score ${(c.score ?? 0).toFixed(2)})`
      );
    }
  }
  if (trendSummaries.length === 0) {
    const blocked = present.filter((p) => p.readiness === "blocked").length;
    const conditional = present.filter(
      (p) => p.readiness === "conditional"
    ).length;
    if (blocked > 0) {
      trendSummaries.push(`Network trend: declining (${blocked} blocked upstream)`);
    } else if (conditional > 0) {
      trendSummaries.push(
        `Network trend: mixed (${conditional} conditional upstream)`
      );
    } else {
      trendSummaries.push("Network trend: stable/improving from ready upstream");
    }
  }
  if (trendSummaries.length > 0) signals.push("trend_summaries");

  const underperforming =
    performanceScore < 0.55 ||
    present.some((p) => p.readiness === "blocked") ||
    scoredCampuses.some((c) => (c.score ?? 1) < 0.5);
  const mixed =
    !underperforming &&
    (performanceScore < 0.8 ||
      present.some((p) => p.readiness === "conditional") ||
      scoredCampuses.some((c) => (c.score ?? 1) < 0.75));

  let stance: CampusPerformanceStance = "strong";
  if (underperforming) {
    stance = "underperforming";
    signals.push("performance_underperforming");
  } else if (mixed) {
    stance = "mixed";
    signals.push("performance_mixed");
  } else {
    stance = "strong";
    signals.push("performance_strong");
  }

  const priorityRecommendations: string[] = [];
  if (stance === "underperforming") {
    priorityRecommendations.push("Close performance gaps at lagging campuses");
  }
  if (scoredCampuses.length >= 2) {
    const ranked = [...scoredCampuses].sort(
      (a, b) => (b.score ?? 0) - (a.score ?? 0)
    );
    priorityRecommendations.push(
      `Replicate practices from ${ranked[0]!.label ?? ranked[0]!.campusId}`
    );
  }
  if (stance === "strong") {
    priorityRecommendations.push("Publish campus performance brief for board review");
  } else {
    priorityRecommendations.push("Prioritize campus remediation actions");
  }

  return {
    stance,
    performanceScore,
    signals: [...new Set(signals)],
    performanceIndicators,
    trendSummaries,
    comparativeInsights,
    priorityRecommendations,
    knowledgeRefs: knowledgeRefs(),
    upstreamSummary: {
      studentSuccess,
      supportPlanning,
      operationalReadiness,
      fundingReadiness,
    },
    campuses: scoredCampuses,
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

function knowledgeRefs() {
  return {
    capabilityId: EDUCATION_CAPABILITY_IDS.campusPerformance,
    entityIds: [
      EDUCATION_ENTITY_IDS.campus,
      EDUCATION_ENTITY_IDS.program,
      EDUCATION_ENTITY_IDS.district,
      EDUCATION_ENTITY_IDS.network,
      EDUCATION_ENTITY_IDS.performanceIndicator,
      EDUCATION_ENTITY_IDS.executiveKpi,
    ],
  };
}
