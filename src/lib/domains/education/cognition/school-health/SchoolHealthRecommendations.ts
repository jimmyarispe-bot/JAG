import type {
  EducationAnalysisContext,
  EducationRecommendationBuilder,
} from "../framework";
import {
  analyzeSchoolHealth,
  type SchoolHealthAnalysis,
} from "./SchoolHealthAnalyzer";
import type { SchoolHealthInputs } from "./SchoolHealthInputs";
import { SCHOOL_HEALTH_ACTION_PROPOSAL_IDS } from "./SchoolHealthTypes";

export function buildSchoolHealthRecommendations(
  builder: EducationRecommendationBuilder,
  ctx: EducationAnalysisContext<SchoolHealthInputs>,
  analysis?: SchoolHealthAnalysis
): void {
  const a = analysis ?? analyzeSchoolHealth(ctx.observation);
  const byCode = new Set(ctx.evidence.map((e) => e.code));

  if (byCode.has("insufficient_upstream")) {
    builder
      .recommend("gather_upstream_results", "Gather School Health Upstream Results")
      .because(
        "School health requires Student Success, Support Planning, Operational Readiness, and/or Funding Readiness outputs."
      )
      .confidence("medium")
      .priority("high")
      .supportedBy("insufficient_upstream", "synthesis_inputs_bound")
      .proposeAction({
        kind: "ScheduleLeadershipReview",
        actionId: SCHOOL_HEALTH_ACTION_PROPOSAL_IDS.ScheduleLeadershipReview,
        rationale: "Propose leadership review once upstream results exist",
      })
      .asWarning();
    return;
  }

  builder
    .recommend("publish_health_brief", "Publish School Health Brief")
    .because(
      `School health stance is ${a.stance} (score ${a.healthScore.toFixed(2)}). Synthesized from lifecycle, support, operations, and funding postures.`
    )
    .confidence(0.9)
    .priority(
      a.stance === "critical"
        ? "critical"
        : a.stance === "at_risk"
          ? "high"
          : "medium"
    )
    .supportedBy(
      "synthesis_inputs_bound",
      "health_healthy",
      "health_watch",
      "health_at_risk",
      "health_critical"
    )
    .proposeAction({
      kind: "PublishSchoolHealthBrief",
      actionId: SCHOOL_HEALTH_ACTION_PROPOSAL_IDS.PublishSchoolHealthBrief,
      rationale: "Propose publishing school health brief",
    });

  if (
    byCode.has("health_critical") ||
    byCode.has("health_at_risk") ||
    byCode.has("health_watch")
  ) {
    builder
      .recommend(
        "stabilize_organizational_health",
        "Stabilize Organizational Health"
      )
      .because(
        "Upstream synthesis signals indicate organizational health risk for leadership review."
      )
      .confidence(0.91)
      .priority(a.stance === "critical" ? "critical" : "high")
      .supportedBy(
        "health_critical",
        "health_at_risk",
        "health_watch",
        "health_risks"
      )
      .proposeAction({
        kind: "EscalateOrganizationalRisk",
        actionId: SCHOOL_HEALTH_ACTION_PROPOSAL_IDS.EscalateOrganizationalRisk,
        rationale: "Propose escalating organizational health risk",
      })
      .proposeAction({
        kind: "ScheduleLeadershipReview",
        actionId: SCHOOL_HEALTH_ACTION_PROPOSAL_IDS.ScheduleLeadershipReview,
        priority: 2,
        rationale: "Propose executive health review",
      })
      .asWarning();

    builder
      .recommend("prioritize_health_actions", "Prioritize Health Actions")
      .because(
        a.recommendedActions.join("; ") ||
          "Prioritize actions from upstream organizational signals."
      )
      .confidence(0.88)
      .priority("high")
      .supportedBy("health_risks")
      .proposeAction({
        kind: "ScheduleLeadershipReview",
        actionId: SCHOOL_HEALTH_ACTION_PROPOSAL_IDS.ScheduleLeadershipReview,
        rationale: "Propose prioritized health action review",
      });
  }

  if (byCode.has("health_healthy") || byCode.has("health_strengths")) {
    builder
      .recommend("reinforce_strengths", "Reinforce Organizational Strengths")
      .because(
        a.strengthProfile.join("; ") ||
          "Upstream synthesis signals support a healthy organizational posture."
      )
      .confidence(0.87)
      .priority("low")
      .supportedBy("health_healthy", "health_strengths")
      .proposeAction({
        kind: "PublishSchoolHealthBrief",
        actionId: SCHOOL_HEALTH_ACTION_PROPOSAL_IDS.PublishSchoolHealthBrief,
        rationale: "Propose healthy organization brief",
      })
      .asInformational();
  }
}
