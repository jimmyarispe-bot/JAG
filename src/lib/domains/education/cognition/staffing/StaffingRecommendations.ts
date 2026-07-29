import type {
  EducationAnalysisContext,
  EducationRecommendationBuilder,
} from "../framework";
import { analyzeStaffing, type StaffingAnalysis } from "./StaffingAnalyzer";
import type { StaffingObservation } from "./StaffingObservation";
import { STAFFING_ACTION_PROPOSAL_IDS } from "./StaffingTypes";

export function buildStaffingRecommendations(
  builder: EducationRecommendationBuilder,
  ctx: EducationAnalysisContext<StaffingObservation>,
  analysis?: StaffingAnalysis
): void {
  const a = analysis ?? analyzeStaffing(ctx.observation);
  const byCode = new Set(ctx.evidence.map((e) => e.code));

  if (byCode.has("insufficient_staffing_data")) {
    builder
      .recommend("gather_staffing_data", "Gather Staffing Data")
      .because("Staffing intelligence requires teachers and/or assignments.")
      .confidence("medium")
      .priority("high")
      .supportedBy("insufficient_staffing_data")
      .proposeAction({
        kind: "PublishStaffingBrief",
        actionId: STAFFING_ACTION_PROPOSAL_IDS.PublishStaffingBrief,
        rationale: "Propose staffing data brief",
      })
      .asWarning();
    return;
  }

  if (byCode.has("teacher_overload")) {
    builder
      .recommend("reduce_teacher_load", "Reduce Teacher Overload")
      .because(
        `${a.overloadedTeacherIds.length} teacher(s) exceed load limits or are unavailable.`
      )
      .confidence(0.91)
      .priority("critical")
      .supportedBy("teacher_overload")
      .proposeAction({
        kind: "ReassignTeacher",
        actionId: STAFFING_ACTION_PROPOSAL_IDS.ReassignTeacher,
        rationale: "Propose rebalancing overloaded assignments",
      })
      .asWarning();
  }

  if (byCode.has("qualification_gap")) {
    builder
      .recommend("fill_qualification_gap", "Fill Qualification Gaps")
      .because(
        `${a.qualificationGaps.length} assignment(s) lack required certification.`
      )
      .confidence(0.9)
      .priority("high")
      .supportedBy("qualification_gap")
      .proposeAction({
        kind: "RequestQualifiedCoverage",
        actionId: STAFFING_ACTION_PROPOSAL_IDS.RequestQualifiedCoverage,
        rationale: "Propose qualified coverage request",
      })
      .asWarning();
  }

  if (byCode.has("teacher_overload") || byCode.has("qualification_gap")) {
    builder
      .recommend("rebalance_assignments", "Rebalance Teaching Assignments")
      .because("Staffing risks indicate assignment rebalancing opportunities.")
      .confidence(0.86)
      .priority("high")
      .supportedBy("teacher_overload", "qualification_gap")
      .proposeAction({
        kind: "ReassignTeacher",
        actionId: STAFFING_ACTION_PROPOSAL_IDS.ReassignTeacher,
        rationale: "Propose assignment rebalance",
      });
  }

  if (byCode.has("coverage_ok") || byCode.has("load_balanced")) {
    builder
      .recommend("maintain_staffing_health", "Maintain Staffing Health")
      .because("Coverage and load are within declared limits.")
      .confidence(0.88)
      .priority("low")
      .supportedBy("coverage_ok", "load_balanced")
      .proposeAction({
        kind: "PublishStaffingBrief",
        actionId: STAFFING_ACTION_PROPOSAL_IDS.PublishStaffingBrief,
        rationale: "Propose healthy staffing brief",
      })
      .asInformational();
  }
}
