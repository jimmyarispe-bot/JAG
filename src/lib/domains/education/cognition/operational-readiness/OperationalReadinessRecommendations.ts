import type {
  EducationAnalysisContext,
  EducationRecommendationBuilder,
} from "../framework";
import {
  analyzeOperationalReadiness,
  type OperationalReadinessAnalysis,
} from "./OperationalReadinessAnalyzer";
import type { OperationalReadinessInputs } from "./OperationalReadinessInputs";
import { OPERATIONAL_READINESS_ACTION_PROPOSAL_IDS } from "./OperationalReadinessTypes";

export function buildOperationalReadinessRecommendations(
  builder: EducationRecommendationBuilder,
  ctx: EducationAnalysisContext<OperationalReadinessInputs>,
  analysis?: OperationalReadinessAnalysis
): void {
  const a = analysis ?? analyzeOperationalReadiness(ctx.observation);
  const byCode = new Set(ctx.evidence.map((e) => e.code));

  if (byCode.has("insufficient_upstream")) {
    builder
      .recommend("gather_upstream_results", "Gather Operations Upstream Results")
      .because(
        "Operational readiness requires Scheduling, Staffing, and/or Capacity contributor outputs."
      )
      .confidence("medium")
      .priority("high")
      .supportedBy("insufficient_upstream", "synthesis_inputs_bound")
      .proposeAction({
        kind: "ScheduleOperationsReview",
        actionId:
          OPERATIONAL_READINESS_ACTION_PROPOSAL_IDS.ScheduleOperationsReview,
        rationale: "Propose operations review once upstream results exist",
      })
      .asWarning();
    return;
  }

  builder
    .recommend("publish_operations_brief", "Publish Leadership Operations Brief")
    .because(
      `Operational readiness stance is ${a.stance} with score ${a.readinessScore}. Synthesized from Scheduling, Staffing, and Capacity.`
    )
    .confidence(0.9)
    .priority(a.stance === "blocked" ? "critical" : a.stance === "at_risk" ? "high" : "medium")
    .supportedBy(
      "synthesis_inputs_bound",
      "readiness_score",
      "ops_ready",
      "ops_at_risk",
      "ops_blocked"
    )
    .proposeAction({
      kind: "PublishOperationsBrief",
      actionId: OPERATIONAL_READINESS_ACTION_PROPOSAL_IDS.PublishOperationsBrief,
      rationale: "Propose publishing leadership operations brief",
    });

  if (byCode.has("ops_blocked") || byCode.has("ops_at_risk")) {
    builder
      .recommend("stabilize_operations", "Stabilize Academic Operations")
      .because(
        "Upstream operations contributors indicate conflicts, overload, or capacity risk."
      )
      .confidence(0.91)
      .priority("critical")
      .supportedBy("ops_blocked", "ops_at_risk", "ops_risks")
      .proposeAction({
        kind: "EscalateOperationsRisk",
        actionId: OPERATIONAL_READINESS_ACTION_PROPOSAL_IDS.EscalateOperationsRisk,
        rationale: "Propose escalating operations risk",
      })
      .proposeAction({
        kind: "ScheduleOperationsReview",
        actionId:
          OPERATIONAL_READINESS_ACTION_PROPOSAL_IDS.ScheduleOperationsReview,
        priority: 2,
        rationale: "Propose daily/semester operations review",
      })
      .asWarning();

    builder
      .recommend("prioritize_ops_actions", "Prioritize Operations Actions")
      .because(
        a.recommendedActions.join("; ") ||
          "Prioritize actions from scheduling, staffing, and capacity outputs."
      )
      .confidence(0.88)
      .priority("high")
      .supportedBy("ops_risks", "readiness_score")
      .proposeAction({
        kind: "ScheduleOperationsReview",
        actionId:
          OPERATIONAL_READINESS_ACTION_PROPOSAL_IDS.ScheduleOperationsReview,
        rationale: "Propose prioritized operations action review",
      });
  }

  if (byCode.has("ops_ready")) {
    builder
      .recommend(
        "maintain_operational_readiness",
        "Maintain Operational Readiness"
      )
      .because(
        "Scheduling, staffing, and capacity upstream signals indicate healthy operations."
      )
      .confidence(0.87)
      .priority("low")
      .supportedBy("ops_ready", "ops_strengths")
      .proposeAction({
        kind: "PublishOperationsBrief",
        actionId: OPERATIONAL_READINESS_ACTION_PROPOSAL_IDS.PublishOperationsBrief,
        rationale: "Propose healthy operations brief",
      })
      .asInformational();
  }
}
