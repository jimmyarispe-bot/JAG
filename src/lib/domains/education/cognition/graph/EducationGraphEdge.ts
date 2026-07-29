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
    id: "edge.scheduling.attendance",
    from: "scheduling",
    to: "attendance",
    kind: "influences",
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
