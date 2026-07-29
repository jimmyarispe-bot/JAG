import type {
  EducationAnalysisContext,
  EducationRecommendationBuilder,
} from "../framework";
import {
  analyzeFundingReadiness,
  type FundingReadinessAnalysis,
} from "./FundingReadinessAnalyzer";
import type { FundingReadinessInputs } from "./FundingReadinessInputs";
import { FUNDING_READINESS_ACTION_PROPOSAL_IDS } from "./FundingReadinessTypes";

export function buildFundingReadinessRecommendations(
  builder: EducationRecommendationBuilder,
  ctx: EducationAnalysisContext<FundingReadinessInputs>,
  analysis?: FundingReadinessAnalysis
): void {
  const a = analysis ?? analyzeFundingReadiness(ctx.observation);
  const byCode = new Set(ctx.evidence.map((e) => e.code));

  if (byCode.has("insufficient_upstream")) {
    builder
      .recommend("gather_upstream_results", "Gather Funding Upstream Results")
      .because(
        "Funding readiness requires Scholarship, Compliance, and/or Enrollment contributor outputs."
      )
      .confidence("medium")
      .priority("high")
      .supportedBy("insufficient_upstream", "synthesis_inputs_bound")
      .proposeAction({
        kind: "ScheduleFundingReview",
        actionId: FUNDING_READINESS_ACTION_PROPOSAL_IDS.ScheduleFundingReview,
        rationale: "Propose funding review once upstream results exist",
      })
      .asWarning();
    return;
  }

  builder
    .recommend("publish_funding_brief", "Publish Executive Funding Brief")
    .because(
      `Funding readiness stance is ${a.stance} (priority ${a.fundingPriority}). Synthesized from Scholarship, Compliance, and Enrollment.`
    )
    .confidence(0.9)
    .priority(
      a.stance === "blocked"
        ? "critical"
        : a.stance === "at_risk"
          ? "high"
          : "medium"
    )
    .supportedBy(
      "synthesis_inputs_bound",
      "funding_ready",
      "funding_at_risk",
      "funding_blocked"
    )
    .proposeAction({
      kind: "PublishFundingBrief",
      actionId: FUNDING_READINESS_ACTION_PROPOSAL_IDS.PublishFundingBrief,
      rationale: "Propose publishing executive funding brief",
    });

  if (byCode.has("funding_blocked") || byCode.has("funding_at_risk")) {
    builder
      .recommend("stabilize_funding_posture", "Stabilize Funding Posture")
      .because(
        "Upstream scholarship/compliance signals indicate funding risk before eligibility or audit."
      )
      .confidence(0.91)
      .priority("critical")
      .supportedBy("funding_blocked", "funding_at_risk", "funding_risks")
      .proposeAction({
        kind: "EscalateFundingRisk",
        actionId: FUNDING_READINESS_ACTION_PROPOSAL_IDS.EscalateFundingRisk,
        rationale: "Propose escalating funding risk",
      })
      .proposeAction({
        kind: "ScheduleFundingReview",
        actionId: FUNDING_READINESS_ACTION_PROPOSAL_IDS.ScheduleFundingReview,
        priority: 2,
        rationale: "Propose funding/compliance review",
      })
      .asWarning();

    builder
      .recommend("prioritize_funding_actions", "Prioritize Funding Actions")
      .because(
        a.recommendedActions.join("; ") ||
          "Prioritize actions from scholarship and compliance outputs."
      )
      .confidence(0.88)
      .priority("high")
      .supportedBy("funding_risks")
      .proposeAction({
        kind: "ScheduleFundingReview",
        actionId: FUNDING_READINESS_ACTION_PROPOSAL_IDS.ScheduleFundingReview,
        rationale: "Propose prioritized funding action review",
      });
  }

  if (byCode.has("funding_ready")) {
    builder
      .recommend("maintain_funding_readiness", "Maintain Funding Readiness")
      .because(
        "Scholarship and compliance upstream signals support a ready funding posture."
      )
      .confidence(0.87)
      .priority("low")
      .supportedBy("funding_ready")
      .proposeAction({
        kind: "PublishFundingBrief",
        actionId: FUNDING_READINESS_ACTION_PROPOSAL_IDS.PublishFundingBrief,
        rationale: "Propose healthy funding brief",
      })
      .asInformational();
  }
}
