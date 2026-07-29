import type {
  EducationAnalysisContext,
  EducationRecommendationBuilder,
} from "../framework";
import { analyzeCapacity, type CapacityAnalysis } from "./CapacityAnalyzer";
import type { CapacityObservation } from "./CapacityObservation";
import { CAPACITY_ACTION_PROPOSAL_IDS } from "./CapacityTypes";

export function buildCapacityRecommendations(
  builder: EducationRecommendationBuilder,
  ctx: EducationAnalysisContext<CapacityObservation>,
  analysis?: CapacityAnalysis
): void {
  const a = analysis ?? analyzeCapacity(ctx.observation);
  const byCode = new Set(ctx.evidence.map((e) => e.code));

  if (byCode.has("insufficient_capacity_data")) {
    builder
      .recommend("gather_capacity_data", "Gather Capacity Data")
      .because("Capacity intelligence requires section or campus capacity inputs.")
      .confidence("medium")
      .priority("high")
      .supportedBy("insufficient_capacity_data")
      .proposeAction({
        kind: "PublishCapacityBrief",
        actionId: CAPACITY_ACTION_PROPOSAL_IDS.PublishCapacityBrief,
        rationale: "Propose capacity data brief",
      })
      .asWarning();
    return;
  }

  if (byCode.has("over_capacity")) {
    builder
      .recommend("address_over_capacity", "Address Over-Capacity Sections")
      .because(
        `${a.overCapacitySectionIds.length} section(s) exceed seat capacity.`
      )
      .confidence(0.93)
      .priority("critical")
      .supportedBy("over_capacity")
      .proposeAction({
        kind: "OpenSection",
        actionId: CAPACITY_ACTION_PROPOSAL_IDS.OpenSection,
        rationale: "Propose opening an additional section",
      })
      .proposeAction({
        kind: "ExpandSeats",
        actionId: CAPACITY_ACTION_PROPOSAL_IDS.ExpandSeats,
        priority: 2,
        rationale: "Propose expanding seats where safe",
      })
      .asWarning();

    builder
      .recommend("expand_capacity", "Expand Instructional Capacity")
      .because("Over-capacity indicates need for expansion planning.")
      .confidence(0.88)
      .priority("high")
      .supportedBy("over_capacity")
      .proposeAction({
        kind: "OpenSection",
        actionId: CAPACITY_ACTION_PROPOSAL_IDS.OpenSection,
        rationale: "Propose capacity expansion",
      });
  }

  if (byCode.has("under_utilized")) {
    builder
      .recommend("consolidate_underutilized", "Consolidate Under-Utilized Capacity")
      .because(
        `${a.underUtilizedSectionIds.length} section(s) are under-utilized.`
      )
      .confidence(0.85)
      .priority("medium")
      .supportedBy("under_utilized")
      .proposeAction({
        kind: "CloseSection",
        actionId: CAPACITY_ACTION_PROPOSAL_IDS.CloseSection,
        rationale: "Propose consolidating under-utilized sections",
      });
  }

  if (byCode.has("capacity_healthy")) {
    builder
      .recommend("maintain_capacity_health", "Maintain Capacity Health")
      .because(
        `Utilization is within healthy bounds (${(a.utilization * 100).toFixed(0)}%).`
      )
      .confidence(0.87)
      .priority("low")
      .supportedBy("capacity_healthy")
      .proposeAction({
        kind: "PublishCapacityBrief",
        actionId: CAPACITY_ACTION_PROPOSAL_IDS.PublishCapacityBrief,
        rationale: "Propose capacity health brief",
      })
      .asInformational();
  }
}
