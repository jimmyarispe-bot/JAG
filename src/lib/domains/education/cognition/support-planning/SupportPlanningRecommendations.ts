/**
 * Support Planning recommendations — unified plan proposals only.
 */

import type {
  EducationAnalysisContext,
  EducationRecommendationBuilder,
} from "../framework";
import {
  analyzeSupportPlanning,
  type SupportPlanningAnalysis,
} from "./SupportPlanningAnalyzer";
import type { SupportPlanningInputs } from "./SupportPlanningInputs";
import { SUPPORT_PLANNING_ACTION_PROPOSAL_IDS } from "./SupportPlanningTypes";

export function buildSupportPlanningRecommendations(
  builder: EducationRecommendationBuilder,
  ctx: EducationAnalysisContext<SupportPlanningInputs>,
  analysis?: SupportPlanningAnalysis
): void {
  const a = analysis ?? analyzeSupportPlanning(ctx.observation);
  const byCode = new Set(ctx.evidence.map((e) => e.code));

  if (byCode.has("insufficient_upstream")) {
    builder
      .recommend("gather_upstream_results", "Gather Support Upstream Results")
      .because(
        "Support planning requires Intervention, Family Engagement, and/or Student Success contributor outputs."
      )
      .confidence("medium")
      .priority("high")
      .supportedBy("insufficient_upstream", "synthesis_inputs_bound")
      .proposeAction({
        kind: "ScheduleSupportReview",
        actionId: SUPPORT_PLANNING_ACTION_PROPOSAL_IDS.ScheduleSupportReview,
        rationale: "Propose support review once upstream results exist",
      })
      .asWarning();
    return;
  }

  builder
    .recommend("publish_support_plan", "Publish Unified Student Support Plan")
    .because(
      `Synthesize a unified support plan (stance: ${a.stance.replace(/_/g, " ")}) from Intervention, Family Engagement, and Student Success outputs. Expected outcomes and prioritized actions are bound as evidence.`
    )
    .confidence(0.9)
    .priority(
      a.stance === "intensive_support"
        ? "critical"
        : a.stance === "targeted_support"
          ? "high"
          : "medium"
    )
    .supportedBy(
      "unified_support_plan",
      "prioritized_actions",
      "expected_outcomes",
      "synthesis_inputs_bound"
    )
    .proposeAction({
      kind: "PublishSupportPlan",
      actionId: SUPPORT_PLANNING_ACTION_PROPOSAL_IDS.PublishSupportPlan,
      rationale: "Propose publishing the unified student support plan",
    })
    .proposeAction({
      kind: "AssignCaseOwner",
      actionId: SUPPORT_PLANNING_ACTION_PROPOSAL_IDS.AssignCaseOwner,
      priority: 2,
      rationale: "Propose assigning a support case owner",
    });

  if (
    byCode.has("intensive_support") ||
    byCode.has("targeted_support") ||
    byCode.has("upstream_intervention")
  ) {
    builder
      .recommend(
        "prioritize_intervention_actions",
        "Prioritize Intervention Actions"
      )
      .because(
        "Intervention Intelligence candidates and priorities should drive the near-term support plan actions."
      )
      .confidence(0.88)
      .priority(a.stance === "intensive_support" ? "critical" : "high")
      .supportedBy(
        "upstream_intervention",
        "intensive_support",
        "targeted_support",
        "prioritized_actions"
      )
      .proposeAction({
        kind: "ActivateInterventionPlan",
        actionId: SUPPORT_PLANNING_ACTION_PROPOSAL_IDS.ActivateInterventionPlan,
        rationale: "Propose activating prioritized intervention actions",
      })
      .proposeAction({
        kind: "ScheduleSupportReview",
        actionId: SUPPORT_PLANNING_ACTION_PROPOSAL_IDS.ScheduleSupportReview,
        priority: 2,
        rationale: "Propose MTSS / support review",
      });
  }

  if (
    byCode.has("upstream_family_engagement") ||
    byCode.has("family_led_partnership")
  ) {
    builder
      .recommend("align_family_outreach", "Align Family Outreach with Plan")
      .because(
        "Family Engagement opportunities and communication priorities should be synchronized with the support plan."
      )
      .confidence(0.86)
      .priority("high")
      .supportedBy(
        "upstream_family_engagement",
        "family_led_partnership",
        "unified_support_plan"
      )
      .proposeAction({
        kind: "ScheduleFamilyMeeting",
        actionId: SUPPORT_PLANNING_ACTION_PROPOSAL_IDS.ScheduleFamilyMeeting,
        rationale: "Propose family meeting aligned to support plan",
      });
  }

  if (byCode.has("intensive_support")) {
    builder
      .recommend("coordinate_mtss_cycle", "Coordinate MTSS Support Cycle")
      .because(
        "Intensive multi-domain support stance warrants a coordinated MTSS / student services cycle."
      )
      .confidence(0.9)
      .priority("critical")
      .supportedBy("intensive_support", "unified_support_plan")
      .proposeAction({
        kind: "ScheduleSupportReview",
        actionId: SUPPORT_PLANNING_ACTION_PROPOSAL_IDS.ScheduleSupportReview,
        rationale: "Propose MTSS coordination review",
      })
      .asWarning();
  }

  if (byCode.has("monitor_and_maintain")) {
    builder
      .recommend("maintain_support_watch", "Maintain Support Watch")
      .because(
        "Upstream support contributors indicate stability. Keep a light support plan and watch for emerging need."
      )
      .confidence(0.8)
      .priority("low")
      .supportedBy("monitor_and_maintain", "unified_support_plan")
      .proposeAction({
        kind: "PublishSupportPlan",
        actionId: SUPPORT_PLANNING_ACTION_PROPOSAL_IDS.PublishSupportPlan,
        rationale: "Propose light-touch support plan publication",
      })
      .asInformational();
  }
}
