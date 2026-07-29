import type {
  EducationAnalysisContext,
  EducationRecommendationBuilder,
} from "../framework";
import {
  analyzeCompliance,
  type ComplianceAnalysis,
} from "./ComplianceAnalyzer";
import type { ComplianceObservation } from "./ComplianceObservation";
import { COMPLIANCE_ACTION_PROPOSAL_IDS } from "./ComplianceTypes";

export function buildComplianceRecommendations(
  builder: EducationRecommendationBuilder,
  ctx: EducationAnalysisContext<ComplianceObservation>,
  analysis?: ComplianceAnalysis
): void {
  const a = analysis ?? analyzeCompliance(ctx.observation);
  const byCode = new Set(ctx.evidence.map((e) => e.code));

  if (byCode.has("insufficient_compliance_data")) {
    builder
      .recommend("gather_compliance_data", "Gather Compliance Data")
      .because("Compliance intelligence requires obligations or posture flags.")
      .confidence("medium")
      .priority("high")
      .supportedBy("insufficient_compliance_data")
      .proposeAction({
        kind: "PublishComplianceBrief",
        actionId: COMPLIANCE_ACTION_PROPOSAL_IDS.PublishComplianceBrief,
        rationale: "Propose compliance data brief",
      })
      .asWarning();
    return;
  }

  if (byCode.has("compliance_violation")) {
    builder
      .recommend("resolve_compliance_violation", "Resolve Compliance Violations")
      .because(
        `${a.violatedObligationIds.length} compliance violation(s) detected.`
      )
      .confidence(0.93)
      .priority("critical")
      .supportedBy("compliance_violation", "compliance_risk")
      .proposeAction({
        kind: "CompleteObligation",
        actionId: COMPLIANCE_ACTION_PROPOSAL_IDS.CompleteObligation,
        rationale: "Propose resolving violated obligations",
      })
      .asWarning();
  }

  if (byCode.has("outstanding_obligation")) {
    builder
      .recommend(
        "complete_outstanding_obligations",
        "Complete Outstanding Obligations"
      )
      .because(
        `${a.outstandingObligationIds.length} outstanding obligation(s) remain.`
      )
      .confidence(0.9)
      .priority("high")
      .supportedBy("outstanding_obligation")
      .proposeAction({
        kind: "CompleteObligation",
        actionId: COMPLIANCE_ACTION_PROPOSAL_IDS.CompleteObligation,
        rationale: "Propose completing outstanding obligations",
      })
      .proposeAction({
        kind: "ScheduleComplianceReview",
        actionId: COMPLIANCE_ACTION_PROPOSAL_IDS.ScheduleComplianceReview,
        priority: 2,
        rationale: "Propose compliance review",
      })
      .asWarning();
  }

  if (byCode.has("compliance_risk") || byCode.has("outstanding_obligation")) {
    builder
      .recommend("schedule_required_review", "Schedule Required Compliance Review")
      .because("Risk indicators or outstanding obligations warrant a required review.")
      .confidence(0.86)
      .priority("high")
      .supportedBy("compliance_risk", "outstanding_obligation")
      .proposeAction({
        kind: "ScheduleComplianceReview",
        actionId: COMPLIANCE_ACTION_PROPOSAL_IDS.ScheduleComplianceReview,
        rationale: "Propose required compliance review",
      });
  }

  if (byCode.has("compliance_satisfied")) {
    builder
      .recommend("maintain_compliance_posture", "Maintain Compliance Posture")
      .because("No outstanding or violated compliance obligations.")
      .confidence(0.88)
      .priority("low")
      .supportedBy("compliance_satisfied")
      .proposeAction({
        kind: "PublishComplianceBrief",
        actionId: COMPLIANCE_ACTION_PROPOSAL_IDS.PublishComplianceBrief,
        rationale: "Propose compliance health brief",
      })
      .asInformational();
  }
}
