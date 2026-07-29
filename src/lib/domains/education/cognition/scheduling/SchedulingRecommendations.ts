import type {
  EducationAnalysisContext,
  EducationRecommendationBuilder,
} from "../framework";
import {
  analyzeScheduling,
  type SchedulingAnalysis,
} from "./SchedulingAnalyzer";
import type { SchedulingObservation } from "./SchedulingObservation";
import { SCHEDULING_ACTION_PROPOSAL_IDS } from "./SchedulingTypes";

export function buildSchedulingRecommendations(
  builder: EducationRecommendationBuilder,
  ctx: EducationAnalysisContext<SchedulingObservation>,
  analysis?: SchedulingAnalysis
): void {
  const a = analysis ?? analyzeScheduling(ctx.observation);
  const byCode = new Set(ctx.evidence.map((e) => e.code));

  if (byCode.has("insufficient_schedule_data")) {
    builder
      .recommend("gather_schedule_data", "Gather Schedule Data")
      .because("Scheduling intelligence requires sections and/or sessions.")
      .confidence("medium")
      .priority("high")
      .supportedBy("insufficient_schedule_data")
      .proposeAction({
        kind: "PublishScheduleBrief",
        actionId: SCHEDULING_ACTION_PROPOSAL_IDS.PublishScheduleBrief,
        rationale: "Propose schedule data collection brief",
      })
      .asWarning();
    return;
  }

  if (byCode.has("schedule_conflict")) {
    builder
      .recommend("resolve_schedule_conflict", "Resolve Schedule Conflicts")
      .because(
        `Detected ${a.conflicts.length} schedule conflict(s) (teacher/room overlap). Action proposals only.`
      )
      .confidence(0.92)
      .priority("critical")
      .supportedBy("schedule_conflict")
      .proposeAction({
        kind: "RescheduleSession",
        actionId: SCHEDULING_ACTION_PROPOSAL_IDS.RescheduleSession,
        rationale: "Propose rescheduling conflicting sessions",
      })
      .proposeAction({
        kind: "ReassignRoom",
        actionId: SCHEDULING_ACTION_PROPOSAL_IDS.ReassignRoom,
        priority: 2,
        rationale: "Propose room reassignment where applicable",
      })
      .asWarning();
  }

  if (byCode.has("coverage_gap")) {
    builder
      .recommend("fill_coverage_gap", "Fill Instructional Coverage Gaps")
      .because(
        `Detected ${a.coverageGaps.length} session(s) without teacher coverage.`
      )
      .confidence(0.9)
      .priority("high")
      .supportedBy("coverage_gap")
      .proposeAction({
        kind: "FillCoverage",
        actionId: SCHEDULING_ACTION_PROPOSAL_IDS.FillCoverage,
        rationale: "Propose filling uncovered sessions",
      })
      .asWarning();
  }

  if (byCode.has("optimization_opportunity")) {
    builder
      .recommend("optimize_schedule", "Optimize Schedule Utilization")
      .because("Schedule is conflict-free but presents utilization optimization opportunities.")
      .confidence(0.8)
      .priority("medium")
      .supportedBy("optimization_opportunity")
      .proposeAction({
        kind: "PublishScheduleBrief",
        actionId: SCHEDULING_ACTION_PROPOSAL_IDS.PublishScheduleBrief,
        rationale: "Propose optimization brief",
      });
  }

  if (byCode.has("schedule_healthy")) {
    builder
      .recommend("maintain_schedule_health", "Maintain Healthy Schedule")
      .because("No conflicts or coverage gaps detected.")
      .confidence(0.88)
      .priority("low")
      .supportedBy("schedule_healthy")
      .proposeAction({
        kind: "PublishScheduleBrief",
        actionId: SCHEDULING_ACTION_PROPOSAL_IDS.PublishScheduleBrief,
        rationale: "Propose healthy operations schedule brief",
      })
      .asInformational();
  }
}
