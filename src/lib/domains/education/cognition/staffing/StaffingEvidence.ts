import type { EducationEvidenceBuilder } from "../framework";
import type { StaffingAnalysis } from "./StaffingAnalyzer";
import type { StaffingObservation } from "./StaffingObservation";

export function collectStaffingEvidence(
  builder: EducationEvidenceBuilder,
  observation: StaffingObservation,
  analysis: StaffingAnalysis
): void {
  builder.addSupportingEvidence(
    "staffing_bound",
    "Bound staffing intelligence to teachers, assignments, and Knowledge entities",
    {
      capabilityId: analysis.knowledgeRefs.capabilityId,
      entityIds: analysis.knowledgeRefs.entityIds,
      policyIds: analysis.knowledgeRefs.policyIds,
      teacherCount: observation.teachers.length,
      assignmentCount: observation.assignments.length,
      overloadCount: analysis.overloadedTeacherIds.length,
      qualificationGapCount: analysis.qualificationGaps.length,
    }
  );

  for (const id of analysis.overloadedTeacherIds) {
    builder.addWarning("teacher_overload", `Teacher overload: ${id}`, {
      teacherId: id,
    });
  }
  for (const gap of analysis.qualificationGaps) {
    builder.addWarning("qualification_gap", gap, {});
  }
  if (analysis.signals.includes("coverage_ok")) {
    builder.addFinding("coverage_ok", "Staffing coverage is healthy", {});
  }
  if (analysis.signals.includes("load_balanced")) {
    builder.addFinding("load_balanced", "Instructional load is within limits", {});
  }
  if (analysis.signals.includes("insufficient_staffing_data")) {
    builder.addBlockingIssue(
      "insufficient_staffing_data",
      "Insufficient teachers/assignments for staffing analysis",
      {}
    );
  }
}
