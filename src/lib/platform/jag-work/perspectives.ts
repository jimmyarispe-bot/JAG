/** Work perspective catalogs per workspace — shared model, workspace-specific labels. */
export interface JagWorkPerspectiveDef {
  id: string;
  label: string;
}

export type EnterpriseWorkspaceKey =
  | "teacher"
  | "admissions"
  | "students"
  | "scheduling"
  | "finance"
  | "hr"
  | "executive";

export const TEACHER_WORK_PERSPECTIVES: JagWorkPerspectiveDef[] = [
  { id: "today", label: "Today's Work" },
  { id: "highest_priorities", label: "My Highest Priorities" },
  { id: "awaiting_review", label: "Awaiting My Review" },
  { id: "needs_human_decision", label: "Needs Human Decision" },
  { id: "ready_to_teach", label: "Ready To Teach" },
  { id: "ready_for_family_communication", label: "Ready For Family Communication" },
  { id: "ready_for_completion", label: "Ready For Completion" },
];

export const ADMISSIONS_WORK_PERSPECTIVES: JagWorkPerspectiveDef[] = [
  { id: "today", label: "Today's Work" },
  { id: "highest_priorities", label: "Highest Priorities" },
  { id: "awaiting_review", label: "Awaiting My Review" },
  { id: "needs_human_decision", label: "Needs Human Decision" },
  { id: "documents_pending", label: "Documents Pending" },
  { id: "ready_for_enrollment", label: "Ready For Enrollment" },
];

export const STUDENTS_WORK_PERSPECTIVES: JagWorkPerspectiveDef[] = [
  { id: "today", label: "Today's Work" },
  { id: "highest_priorities", label: "Highest Priorities" },
  { id: "awaiting_review", label: "Awaiting My Review" },
  { id: "needs_human_decision", label: "Needs Human Decision" },
  { id: "records_incomplete", label: "Records Incomplete" },
  { id: "enrollment_pending", label: "Enrollment Pending" },
];

export const FINANCE_WORK_PERSPECTIVES: JagWorkPerspectiveDef[] = [
  { id: "today", label: "Today's Work" },
  { id: "highest_priorities", label: "Highest Priorities" },
  { id: "awaiting_review", label: "Awaiting My Review" },
  { id: "needs_human_decision", label: "Needs Human Decision" },
  { id: "collections_due", label: "Collections Due" },
  { id: "ready_to_post", label: "Ready To Post" },
];

export const HR_WORK_PERSPECTIVES: JagWorkPerspectiveDef[] = [
  { id: "today", label: "Today's Work" },
  { id: "highest_priorities", label: "Highest Priorities" },
  { id: "awaiting_review", label: "Awaiting My Review" },
  { id: "needs_human_decision", label: "Needs Human Decision" },
  { id: "compliance_due", label: "Compliance Due" },
  { id: "ready_to_onboard", label: "Ready To Onboard" },
];

export const EXECUTIVE_WORK_PERSPECTIVES: JagWorkPerspectiveDef[] = [
  { id: "today", label: "Today's Work" },
  { id: "highest_priorities", label: "Highest Priorities" },
  { id: "awaiting_review", label: "Awaiting My Review" },
  { id: "needs_human_decision", label: "Needs Human Decision" },
  { id: "strategic_decisions", label: "Strategic Decisions" },
  { id: "board_ready", label: "Board Ready" },
];

export const SCHEDULING_WORK_PERSPECTIVES: JagWorkPerspectiveDef[] = [
  { id: "today", label: "Today's Work" },
  { id: "highest_priorities", label: "Highest Priorities" },
  { id: "awaiting_review", label: "Awaiting My Review" },
  { id: "needs_human_decision", label: "Needs Human Decision" },
  { id: "conflicts_due", label: "Conflicts Due" },
  { id: "placement_gaps", label: "Placement Gaps" },
  { id: "coverage_needed", label: "Coverage Needed" },
  { id: "capacity_optimization", label: "Capacity Optimization" },
];

export const WORKSPACE_WORK_PERSPECTIVES: Record<EnterpriseWorkspaceKey, JagWorkPerspectiveDef[]> = {
  teacher: TEACHER_WORK_PERSPECTIVES,
  admissions: ADMISSIONS_WORK_PERSPECTIVES,
  students: STUDENTS_WORK_PERSPECTIVES,
  scheduling: SCHEDULING_WORK_PERSPECTIVES,
  finance: FINANCE_WORK_PERSPECTIVES,
  hr: HR_WORK_PERSPECTIVES,
  executive: EXECUTIVE_WORK_PERSPECTIVES,
};
