import type { EducationEvidenceBuilder } from "../framework";
import type { CapacityAnalysis } from "./CapacityAnalyzer";
import type { CapacityObservation } from "./CapacityObservation";

export function collectCapacityEvidence(
  builder: EducationEvidenceBuilder,
  observation: CapacityObservation,
  analysis: CapacityAnalysis
): void {
  builder.addSupportingEvidence(
    "capacity_bound",
    "Bound capacity intelligence to sections/campus capacity and Knowledge entities",
    {
      capabilityId: analysis.knowledgeRefs.capabilityId,
      entityIds: analysis.knowledgeRefs.entityIds,
      policyIds: analysis.knowledgeRefs.policyIds,
      sectionCount: observation.sections.length,
      utilization: analysis.utilization,
      overCapacityCount: analysis.overCapacitySectionIds.length,
      underUtilizedCount: analysis.underUtilizedSectionIds.length,
    }
  );

  for (const id of analysis.overCapacitySectionIds) {
    builder.addWarning("over_capacity", `Section over capacity: ${id}`, {
      sectionId: id,
    });
  }
  for (const id of analysis.underUtilizedSectionIds) {
    builder.addFinding("under_utilized", `Section under-utilized: ${id}`, {
      sectionId: id,
    });
  }
  if (analysis.signals.includes("capacity_healthy")) {
    builder.addFinding(
      "capacity_healthy",
      `Capacity utilization healthy (${(analysis.utilization * 100).toFixed(0)}%)`,
      { utilization: analysis.utilization }
    );
  }
  if (analysis.signals.includes("insufficient_capacity_data")) {
    builder.addBlockingIssue(
      "insufficient_capacity_data",
      "Insufficient capacity sections/campus data for analysis",
      {}
    );
  }
}
