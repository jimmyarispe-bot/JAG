/**
 * Intervention recommendations — support strategy proposals only.
 */

import type {
  EducationAnalysisContext,
  EducationRecommendationBuilder,
} from "../framework";
import {
  analyzeIntervention,
  type InterventionAnalysis,
} from "./InterventionAnalyzer";
import type { InterventionInputs } from "./InterventionInputs";
import { INTERVENTION_ACTION_PROPOSAL_IDS } from "./InterventionTypes";

export function buildInterventionRecommendations(
  builder: EducationRecommendationBuilder,
  ctx: EducationAnalysisContext<InterventionInputs>,
  analysis?: InterventionAnalysis
): void {
  const a = analysis ?? analyzeIntervention(ctx.observation);
  const byCode = new Set(ctx.evidence.map((e) => e.code));

  if (byCode.has("insufficient_upstream")) {
    builder
      .recommend("gather_upstream_results", "Gather Upstream Support Signals")
      .because(
        "Intervention intelligence requires Student Success, Progress, and/or Attendance contributor outputs."
      )
      .confidence("medium")
      .priority("high")
      .supportedBy("insufficient_upstream", "synthesis_inputs_bound")
      .proposeAction({
        kind: "ScheduleMtssReview",
        actionId: INTERVENTION_ACTION_PROPOSAL_IDS.ScheduleMtssReview,
        rationale: "Propose MTSS review once upstream results exist",
      })
      .asWarning();
    return;
  }

  if (byCode.has("multi_domain_intervention")) {
    builder
      .recommend(
        "propose_multi_domain_intervention",
        "Propose Multi-Domain Intervention"
      )
      .because(
        "Upstream Progress and Attendance outputs both indicate risk. Recommend a coordinated support strategy with expected multi-domain impact."
      )
      .confidence(0.92)
      .priority("critical")
      .supportedBy(
        "multi_domain_intervention",
        "intervention_candidate",
        "high_priority_support"
      )
      .proposeAction({
        kind: "CreateIntervention",
        actionId: INTERVENTION_ACTION_PROPOSAL_IDS.CreateIntervention,
        rationale: "Propose coordinated multi-domain intervention",
      })
      .proposeAction({
        kind: "EscalateTier",
        actionId: INTERVENTION_ACTION_PROPOSAL_IDS.EscalateTier,
        priority: 2,
        rationale: "Propose MTSS tier escalation",
      })
      .asWarning();
  }

  if (
    byCode.has("academic_intervention_indicated") &&
    !byCode.has("multi_domain_intervention")
  ) {
    builder
      .recommend(
        "propose_academic_intervention",
        "Propose Academic Intervention"
      )
      .because(
        "Academic Progress upstream (and optional Student Success synthesis) indicates need for academic support strategies. Expected impact: accelerate progress."
      )
      .confidence(0.9)
      .priority("high")
      .supportedBy(
        "academic_intervention_indicated",
        "intervention_candidate",
        "expected_impact_bound"
      )
      .proposeAction({
        kind: "CreateIntervention",
        actionId: INTERVENTION_ACTION_PROPOSAL_IDS.CreateIntervention,
        rationale: "Propose academic intervention candidate",
      })
      .proposeAction({
        kind: "AssignSupportStrategy",
        actionId: INTERVENTION_ACTION_PROPOSAL_IDS.AssignSupportStrategy,
        priority: 2,
        rationale: "Propose academic support strategy assignment",
      })
      .asWarning();
  }

  if (
    byCode.has("attendance_intervention_indicated") &&
    !byCode.has("multi_domain_intervention")
  ) {
    builder
      .recommend(
        "propose_attendance_intervention",
        "Propose Attendance Intervention"
      )
      .because(
        "Attendance upstream indicates chronic or threshold risk. Expected impact: stabilize attendance."
      )
      .confidence(0.9)
      .priority("high")
      .supportedBy(
        "attendance_intervention_indicated",
        "intervention_candidate",
        "expected_impact_bound"
      )
      .proposeAction({
        kind: "CreateIntervention",
        actionId: INTERVENTION_ACTION_PROPOSAL_IDS.CreateIntervention,
        rationale: "Propose attendance intervention candidate",
      })
      .asWarning();
  }

  if (byCode.has("mtss_escalation")) {
    builder
      .recommend("escalate_mtss", "Escalate MTSS Review")
      .because(
        "Cross-domain or multi-tier support signals warrant an MTSS review. Action proposals only."
      )
      .confidence(0.88)
      .priority(a.overallPriority === "critical" ? "critical" : "high")
      .supportedBy("mtss_escalation", "intervention_candidate")
      .proposeAction({
        kind: "ScheduleMtssReview",
        actionId: INTERVENTION_ACTION_PROPOSAL_IDS.ScheduleMtssReview,
        rationale: "Propose MTSS review meeting",
      })
      .proposeAction({
        kind: "EscalateTier",
        actionId: INTERVENTION_ACTION_PROPOSAL_IDS.EscalateTier,
        priority: 2,
        rationale: "Propose tier escalation if confirmed",
      });
  }

  if (byCode.has("monitor_only")) {
    builder
      .recommend("monitor_support_need", "Monitor Support Need")
      .because(
        "Upstream contributors do not currently indicate active intervention. Continue monitoring for emerging support need."
      )
      .confidence(0.8)
      .priority("low")
      .supportedBy("monitor_only", "upstream_student_success")
      .proposeAction({
        kind: "MonitorProgress",
        actionId: INTERVENTION_ACTION_PROPOSAL_IDS.MonitorProgress,
        rationale: "Propose continued support monitoring",
      })
      .asInformational();
  }
}
