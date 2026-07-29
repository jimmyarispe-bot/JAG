import type { EducationEvidenceBuilder } from "../framework";
import type { CampusPerformanceAnalysis } from "./CampusPerformanceAnalyzer";
import type { CampusPerformanceInputs } from "./CampusPerformanceInputs";

export function collectCampusPerformanceEvidence(
  builder: EducationEvidenceBuilder,
  inputs: CampusPerformanceInputs,
  analysis: CampusPerformanceAnalysis
): void {
  builder.addSupportingEvidence(
    "synthesis_inputs_bound",
    "Bound campus performance to aggregated upstream synthesis outputs",
    {
      capabilityId: analysis.knowledgeRefs.capabilityId,
      entityIds: analysis.knowledgeRefs.entityIds,
      upstreamCount: [
        inputs.studentSuccess,
        inputs.supportPlanning,
        inputs.operationalReadiness,
        inputs.fundingReadiness,
      ].filter(Boolean).length,
      stance: analysis.stance,
      performanceScore: analysis.performanceScore,
      campusCount: analysis.campuses.length,
    }
  );

  emitUpstream(
    builder,
    "upstream_student_success",
    analysis.upstreamSummary.studentSuccess
  );
  emitUpstream(
    builder,
    "upstream_support_planning",
    analysis.upstreamSummary.supportPlanning
  );
  emitUpstream(
    builder,
    "upstream_operational_readiness",
    analysis.upstreamSummary.operationalReadiness
  );
  emitUpstream(
    builder,
    "upstream_funding_readiness",
    analysis.upstreamSummary.fundingReadiness
  );

  if (analysis.campuses.length > 0) {
    builder.addSupportingEvidence(
      "campus_units_bound",
      `Bound ${analysis.campuses.length} campus/program comparison unit(s)`,
      {
        campuses: analysis.campuses.map((c) => ({
          campusId: c.campusId,
          score: c.score,
          trend: c.trend,
        })),
      }
    );
  }

  for (const insight of analysis.comparativeInsights) {
    builder.addFinding("comparative_insights", insight, {
      stance: analysis.stance,
    });
  }
  for (const trend of analysis.trendSummaries) {
    builder.addFinding("trend_summaries", trend, {
      stance: analysis.stance,
    });
  }

  for (const signal of analysis.signals) {
    if (
      signal === "synthesis_inputs_bound" ||
      signal.startsWith("upstream_") ||
      signal === "campus_units_bound" ||
      signal === "comparative_insights" ||
      signal === "trend_summaries"
    ) {
      continue;
    }
    if (signal === "insufficient_upstream") {
      builder.addBlockingIssue(
        signal,
        "Insufficient upstream results for campus performance synthesis",
        { stance: analysis.stance }
      );
    } else if (
      signal === "performance_underperforming" ||
      signal === "performance_mixed"
    ) {
      builder.addWarning(signal, signal.replace(/_/g, " "), {
        stance: analysis.stance,
        performanceScore: analysis.performanceScore,
      });
    } else {
      builder.addFinding(signal, signal.replace(/_/g, " "), {
        stance: analysis.stance,
        performanceScore: analysis.performanceScore,
      });
    }
  }
}

function emitUpstream(
  builder: EducationEvidenceBuilder,
  code: string,
  slice:
    | {
        contributorId: string;
        readiness: string;
        confidence: number;
      }
    | undefined
): void {
  if (!slice) return;
  const summary = `Upstream ${slice.contributorId}: readiness=${slice.readiness}, confidence=${slice.confidence.toFixed(2)}`;
  if (slice.readiness === "blocked" || slice.readiness === "conditional") {
    builder.addWarning(code, summary, { ...slice });
  } else {
    builder.addSupportingEvidence(code, summary, { ...slice });
  }
}
