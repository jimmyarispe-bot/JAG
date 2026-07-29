import type {
  EducationAnalysisContext,
  EducationRecommendationBuilder,
} from "../framework";
import {
  analyzeCampusPerformance,
  type CampusPerformanceAnalysis,
} from "./CampusPerformanceAnalyzer";
import type { CampusPerformanceInputs } from "./CampusPerformanceInputs";
import { CAMPUS_PERFORMANCE_ACTION_PROPOSAL_IDS } from "./CampusPerformanceTypes";

export function buildCampusPerformanceRecommendations(
  builder: EducationRecommendationBuilder,
  ctx: EducationAnalysisContext<CampusPerformanceInputs>,
  analysis?: CampusPerformanceAnalysis
): void {
  const a = analysis ?? analyzeCampusPerformance(ctx.observation);
  const byCode = new Set(ctx.evidence.map((e) => e.code));

  if (byCode.has("insufficient_upstream")) {
    builder
      .recommend(
        "gather_upstream_results",
        "Gather Campus Performance Upstream Results"
      )
      .because(
        "Campus performance requires aggregated upstream synthesis outputs and/or campus comparison units."
      )
      .confidence("medium")
      .priority("high")
      .supportedBy("insufficient_upstream", "synthesis_inputs_bound")
      .proposeAction({
        kind: "ScheduleCampusReview",
        actionId: CAMPUS_PERFORMANCE_ACTION_PROPOSAL_IDS.ScheduleCampusReview,
        rationale: "Propose campus review once upstream results exist",
      })
      .asWarning();
    return;
  }

  builder
    .recommend("publish_performance_brief", "Publish Campus Performance Brief")
    .because(
      `Campus performance stance is ${a.stance} (score ${a.performanceScore.toFixed(2)}). ${a.comparativeInsights[0] ?? ""}`
    )
    .confidence(0.9)
    .priority(
      a.stance === "underperforming"
        ? "critical"
        : a.stance === "mixed"
          ? "high"
          : "medium"
    )
    .supportedBy(
      "synthesis_inputs_bound",
      "performance_strong",
      "performance_mixed",
      "performance_underperforming",
      "comparative_insights"
    )
    .proposeAction({
      kind: "PublishCampusPerformanceBrief",
      actionId:
        CAMPUS_PERFORMANCE_ACTION_PROPOSAL_IDS.PublishCampusPerformanceBrief,
      rationale: "Propose publishing campus performance brief",
    });

  if (
    byCode.has("performance_underperforming") ||
    byCode.has("performance_mixed")
  ) {
    builder
      .recommend("close_performance_gaps", "Close Campus Performance Gaps")
      .because(
        a.priorityRecommendations.join("; ") ||
          "Comparative signals indicate campus/program performance gaps."
      )
      .confidence(0.91)
      .priority(a.stance === "underperforming" ? "critical" : "high")
      .supportedBy(
        "performance_underperforming",
        "performance_mixed",
        "comparative_insights"
      )
      .proposeAction({
        kind: "EscalateCampusGap",
        actionId: CAMPUS_PERFORMANCE_ACTION_PROPOSAL_IDS.EscalateCampusGap,
        rationale: "Propose escalating campus performance gap",
      })
      .proposeAction({
        kind: "ScheduleCampusReview",
        actionId: CAMPUS_PERFORMANCE_ACTION_PROPOSAL_IDS.ScheduleCampusReview,
        priority: 2,
        rationale: "Propose cross-campus performance review",
      })
      .asWarning();

    builder
      .recommend("prioritize_campus_actions", "Prioritize Campus Actions")
      .because(
        a.priorityRecommendations.join("; ") ||
          "Prioritize remediation across lagging campuses/programs."
      )
      .confidence(0.88)
      .priority("high")
      .supportedBy("comparative_insights", "trend_summaries")
      .proposeAction({
        kind: "ScheduleCampusReview",
        actionId: CAMPUS_PERFORMANCE_ACTION_PROPOSAL_IDS.ScheduleCampusReview,
        rationale: "Propose prioritized campus action review",
      });
  }

  if (byCode.has("performance_strong") || a.campuses.length >= 2) {
    builder
      .recommend("replicate_high_performers", "Replicate High Performers")
      .because(
        a.comparativeInsights.join("; ") ||
          "High-performing campuses/programs can inform network practice."
      )
      .confidence(0.86)
      .priority("low")
      .supportedBy("performance_strong", "comparative_insights")
      .proposeAction({
        kind: "PublishCampusPerformanceBrief",
        actionId:
          CAMPUS_PERFORMANCE_ACTION_PROPOSAL_IDS.PublishCampusPerformanceBrief,
        rationale: "Propose sharing high-performer practices",
      })
      .asInformational();
  }
}
