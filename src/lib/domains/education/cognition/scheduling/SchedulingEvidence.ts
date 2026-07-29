import type { EducationEvidenceBuilder } from "../framework";
import type { SchedulingAnalysis } from "./SchedulingAnalyzer";
import type { SchedulingObservation } from "./SchedulingObservation";

export function collectSchedulingEvidence(
  builder: EducationEvidenceBuilder,
  observation: SchedulingObservation,
  analysis: SchedulingAnalysis
): void {
  builder.addSupportingEvidence(
    "schedule_bound",
    "Bound scheduling intelligence to sections, sessions, and Knowledge entities",
    {
      capabilityId: analysis.knowledgeRefs.capabilityId,
      entityIds: analysis.knowledgeRefs.entityIds,
      policyIds: analysis.knowledgeRefs.policyIds,
      sectionCount: observation.sections.length,
      sessionCount: observation.sessions.length,
      conflictCount: analysis.conflicts.length,
      coverageGapCount: analysis.coverageGaps.length,
    }
  );

  for (const conflict of analysis.conflicts) {
    builder.addWarning(
      "schedule_conflict",
      `${conflict.kind} on ${conflict.resourceId}: ${conflict.sessionIds.join(", ")}`,
      { ...conflict }
    );
  }
  for (const gap of analysis.coverageGaps) {
    builder.addWarning("coverage_gap", `Coverage gap for session ${gap}`, {
      sessionId: gap,
    });
  }
  for (const opp of analysis.optimizationOpportunities) {
    builder.addFinding("optimization_opportunity", opp, {});
  }
  if (analysis.signals.includes("schedule_healthy")) {
    builder.addFinding("schedule_healthy", "Schedule has no conflicts or coverage gaps", {});
  }
  if (analysis.signals.includes("insufficient_schedule_data")) {
    builder.addBlockingIssue(
      "insufficient_schedule_data",
      "Insufficient schedule sessions/sections for analysis",
      {}
    );
  }
}
