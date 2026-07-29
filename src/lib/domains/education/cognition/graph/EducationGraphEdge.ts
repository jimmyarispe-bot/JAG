/**
 * Intelligence Graph edges — influence relationships only.
 * Edges do not execute contributors or imply data flow into Core.
 */

import type { EducationGraphNodeKind } from "./EducationGraphNode";

export type EducationGraphEdgeKind =
  | "influences"
  | "reinforces"
  | "may_block"
  | "escalates_to";

export interface EducationGraphEdge {
  id: string;
  from: EducationGraphNodeKind;
  to: EducationGraphNodeKind;
  kind: EducationGraphEdgeKind;
  /** Optional human rationale for the influence. */
  rationale?: string;
}

/** Canonical Education influence topology (static; not runtime wiring). */
export const EDUCATION_DEFAULT_GRAPH_EDGES: readonly EducationGraphEdge[] = [
  {
    id: "edge.enrollment.scholarship",
    from: "enrollment",
    to: "scholarship",
    kind: "influences",
    rationale: "Enrollment readiness influences scholarship decisions",
  },
  {
    id: "edge.enrollment.compliance",
    from: "enrollment",
    to: "compliance",
    kind: "may_block",
    rationale: "Enrollment blockers may surface compliance holds",
  },
  {
    id: "edge.attendance.intervention",
    from: "attendance",
    to: "intervention",
    kind: "escalates_to",
    rationale: "Attendance risk escalates to intervention",
  },
  {
    id: "edge.attendance.family_engagement",
    from: "attendance",
    to: "family_engagement",
    kind: "influences",
    rationale: "Attendance concerns drive family engagement",
  },
  {
    id: "edge.progress.intervention",
    from: "progress",
    to: "intervention",
    kind: "escalates_to",
  },
  {
    id: "edge.enrollment.student_success",
    from: "enrollment",
    to: "student_success",
    kind: "influences",
    rationale: "Enrollment outcomes feed student success synthesis",
  },
  {
    id: "edge.attendance.student_success",
    from: "attendance",
    to: "student_success",
    kind: "influences",
    rationale: "Attendance outcomes feed student success synthesis",
  },
  {
    id: "edge.progress.student_success",
    from: "progress",
    to: "student_success",
    kind: "influences",
    rationale: "Academic progress outcomes feed student success synthesis",
  },
  {
    id: "edge.student_success.intervention",
    from: "student_success",
    to: "intervention",
    kind: "escalates_to",
    rationale: "Synthesized risk escalates to intervention",
  },
  {
    id: "edge.student_success.family_engagement",
    from: "student_success",
    to: "family_engagement",
    kind: "influences",
    rationale: "Student success synthesis informs family partnership",
  },
  {
    id: "edge.student_success.support_planning",
    from: "student_success",
    to: "support_planning",
    kind: "influences",
    rationale: "Student success feeds unified support planning",
  },
  {
    id: "edge.enrollment.family_engagement",
    from: "enrollment",
    to: "family_engagement",
    kind: "influences",
    rationale: "Enrollment partnership opportunities drive family engagement",
  },
  {
    id: "edge.intervention.support_planning",
    from: "intervention",
    to: "support_planning",
    kind: "escalates_to",
    rationale: "Intervention candidates feed support planning synthesis",
  },
  {
    id: "edge.family_engagement.support_planning",
    from: "family_engagement",
    to: "support_planning",
    kind: "influences",
    rationale: "Family engagement opportunities feed support planning synthesis",
  },

  {
    id: "edge.scheduling.attendance",
    from: "scheduling",
    to: "attendance",
    kind: "influences",
  },
  {
    id: "edge.scheduling.operational_readiness",
    from: "scheduling",
    to: "operational_readiness",
    kind: "influences",
    rationale: "Schedule health feeds operational readiness",
  },
  {
    id: "edge.staffing.operational_readiness",
    from: "staffing",
    to: "operational_readiness",
    kind: "influences",
    rationale: "Staffing health feeds operational readiness",
  },
  {
    id: "edge.capacity.operational_readiness",
    from: "capacity",
    to: "operational_readiness",
    kind: "influences",
    rationale: "Capacity utilization feeds operational readiness",
  },
  {
    id: "edge.scheduling.staffing",
    from: "scheduling",
    to: "staffing",
    kind: "influences",
    rationale: "Schedule assignments influence staffing analysis",
  },
  {
    id: "edge.staffing.capacity",
    from: "staffing",
    to: "capacity",
    kind: "influences",
    rationale: "Staffing capacity constraints influence seat capacity",
  },
  {
    id: "edge.scholarship.enrollment",
    from: "scholarship",
    to: "enrollment",
    kind: "may_block",
  },
  {
    id: "edge.family_engagement.attendance",
    from: "family_engagement",
    to: "attendance",
    kind: "reinforces",
  },
] as const;

export function createEducationGraphEdge(input: {
  from: EducationGraphNodeKind;
  to: EducationGraphNodeKind;
  kind: EducationGraphEdgeKind;
  rationale?: string;
}): EducationGraphEdge {
  return {
    id: `edge.${input.from}.${input.to}.${input.kind}`,
    from: input.from,
    to: input.to,
    kind: input.kind,
    rationale: input.rationale,
  };
}
