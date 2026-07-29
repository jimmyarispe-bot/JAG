import type {
  EducationAnalysisContext,
  EducationRecommendationBuilder,
} from "../framework";
import {
  analyzeExecutiveBriefing,
  type ExecutiveBriefingAnalysis,
} from "./ExecutiveBriefingAnalyzer";
import type { ExecutiveBriefingInputs } from "./ExecutiveBriefingInputs";
import { EXECUTIVE_BRIEFING_ACTION_PROPOSAL_IDS } from "./ExecutiveBriefingTypes";

export function buildExecutiveBriefingRecommendations(
  builder: EducationRecommendationBuilder,
  ctx: EducationAnalysisContext<ExecutiveBriefingInputs>,
  analysis?: ExecutiveBriefingAnalysis
): void {
  const a = analysis ?? analyzeExecutiveBriefing(ctx.observation);
  const byCode = new Set(ctx.evidence.map((e) => e.code));

  if (byCode.has("insufficient_upstream")) {
    builder
      .recommend(
        "gather_upstream_results",
        "Gather Executive Briefing Upstream Results"
      )
      .because(
        "Executive briefing requires School Health, Campus Performance, Funding Readiness, Support Planning, and/or Operational Readiness outputs."
      )
      .confidence("medium")
      .priority("high")
      .supportedBy("insufficient_upstream", "synthesis_inputs_bound")
      .proposeAction({
        kind: "ScheduleBoardReview",
        actionId: EXECUTIVE_BRIEFING_ACTION_PROPOSAL_IDS.ScheduleBoardReview,
        rationale: "Propose board review once upstream results exist",
      })
      .asWarning();
    return;
  }

  builder
    .recommend("publish_executive_brief", "Publish Executive Education Brief")
    .because(a.executiveSummary)
    .confidence(a.briefingConfidence)
    .priority(
      a.stance === "urgent"
        ? "critical"
        : a.stance === "cautionary"
          ? "high"
          : "medium"
    )
    .supportedBy(
      "synthesis_inputs_bound",
      "executive_summary",
      "briefing_favorable",
      "briefing_cautionary",
      "briefing_urgent",
      "evidence_index"
    )
    .proposeAction({
      kind: "PublishExecutiveBrief",
      actionId: EXECUTIVE_BRIEFING_ACTION_PROPOSAL_IDS.PublishExecutiveBrief,
      rationale: "Propose publishing executive education brief",
    });

  builder
    .recommend("set_strategic_priorities", "Set Strategic Priorities")
    .because(
      a.strategicPriorities.join("; ") ||
        "Establish strategic priorities from the executive synthesis."
    )
    .confidence(0.9)
    .priority(a.stance === "urgent" ? "critical" : "high")
    .supportedBy("strategic_priorities", "executive_summary")
    .proposeAction({
      kind: "ScheduleBoardReview",
      actionId: EXECUTIVE_BRIEFING_ACTION_PROPOSAL_IDS.ScheduleBoardReview,
      rationale: "Propose board/strategic priority review",
    });

  if (byCode.has("critical_risks") || byCode.has("briefing_urgent")) {
    builder
      .recommend("mitigate_critical_risks", "Mitigate Critical Risks")
      .because(
        a.criticalRisks.join("; ") ||
          "Critical risks require executive mitigation before the next review cycle."
      )
      .confidence(0.92)
      .priority("critical")
      .supportedBy("critical_risks", "briefing_urgent", "briefing_cautionary")
      .proposeAction({
        kind: "EscalateStrategicRisk",
        actionId: EXECUTIVE_BRIEFING_ACTION_PROPOSAL_IDS.EscalateStrategicRisk,
        rationale: "Propose escalating strategic risk",
      })
      .proposeAction({
        kind: "ScheduleBoardReview",
        actionId: EXECUTIVE_BRIEFING_ACTION_PROPOSAL_IDS.ScheduleBoardReview,
        priority: 2,
        rationale: "Propose urgent board review",
      })
      .asWarning();
  }

  if (byCode.has("key_opportunities") || a.keyOpportunities.length > 0) {
    builder
      .recommend("pursue_key_opportunities", "Pursue Key Opportunities")
      .because(
        a.keyOpportunities.join("; ") ||
          "Key opportunities identified from healthy upstream postures."
      )
      .confidence(0.86)
      .priority("medium")
      .supportedBy("key_opportunities", "briefing_favorable")
      .proposeAction({
        kind: "PublishExecutiveBrief",
        actionId: EXECUTIVE_BRIEFING_ACTION_PROPOSAL_IDS.PublishExecutiveBrief,
        rationale: "Propose capturing opportunities in executive brief",
      })
      .asInformational();
  }
}
