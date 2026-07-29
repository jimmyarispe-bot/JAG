/**
 * Intelligence Graph nodes — one per Education cognitive contributor kind.
 */

export const EDUCATION_GRAPH_NODE_KINDS = [
  "enrollment",
  "attendance",
  "progress",
  "student_success",
  "scheduling",
  "intervention",
  "scholarship",
  "compliance",
  "family_engagement",
  "support_planning",
  "staffing",
  "capacity",
  "operational_readiness",
] as const;

export type EducationGraphNodeKind =
  (typeof EDUCATION_GRAPH_NODE_KINDS)[number];

export interface EducationGraphNode {
  id: string;
  kind: EducationGraphNodeKind;
  /** Runtime / domain contributor id when bound. */
  contributorId?: string;
  label: string;
  /** True when this node supplied a result in the current run. */
  active: boolean;
}

export const EDUCATION_GRAPH_NODE_LABELS: Record<
  EducationGraphNodeKind,
  string
> = {
  enrollment: "Enrollment",
  attendance: "Attendance",
  progress: "Progress",
  student_success: "Student Success",
  scheduling: "Scheduling",
  intervention: "Intervention",
  scholarship: "Scholarship",
  compliance: "Compliance",
  family_engagement: "Family Engagement",
  support_planning: "Support Planning",
  staffing: "Staffing",
  capacity: "Capacity",
  operational_readiness: "Operational Readiness",
};

/** Map known contributor ids to graph node kinds. */
export function nodeKindFromContributorId(
  contributorId: string
): EducationGraphNodeKind | null {
  if (contributorId.includes("enrollment")) return "enrollment";
  if (contributorId.includes("attendance")) return "attendance";
  if (
    contributorId.includes("operational_readiness") ||
    contributorId.includes("operational-readiness")
  ) {
    return "operational_readiness";
  }
  if (
    contributorId.includes("support_planning") ||
    contributorId.includes("support-planning")
  ) {
    return "support_planning";
  }
  if (
    contributorId.includes("student_success") ||
    contributorId.includes("student-success")
  ) {
    return "student_success";
  }
  if (contributorId.includes("progress")) return "progress";
  if (contributorId.includes("staffing")) return "staffing";
  if (contributorId.includes("capacity")) return "capacity";
  if (contributorId.includes("scheduling") || contributorId.includes("schedule"))
    return "scheduling";
  if (contributorId.includes("intervention")) return "intervention";
  if (contributorId.includes("scholarship")) return "scholarship";
  if (contributorId.includes("compliance")) return "compliance";
  if (
    contributorId.includes("family") ||
    contributorId.includes("family_engagement")
  ) {
    return "family_engagement";
  }
  return null;
}

export function createEducationGraphNode(input: {
  kind: EducationGraphNodeKind;
  contributorId?: string;
  active?: boolean;
}): EducationGraphNode {
  return {
    id: `node.${input.kind}`,
    kind: input.kind,
    contributorId: input.contributorId,
    label: EDUCATION_GRAPH_NODE_LABELS[input.kind],
    active: input.active ?? false,
  };
}
