export type EmployeeLifecycleState =
  | "applicant"
  | "interviewing"
  | "offer_extended"
  | "hired"
  | "onboarding"
  | "active"
  | "leave_of_absence"
  | "inactive"
  | "terminated"
  | "retired";

/** Legacy status aliases still present in DB */
export type EmploymentStatusDb = EmployeeLifecycleState | "on_leave";

export type LeaveType =
  | "pto"
  | "vacation"
  | "sick"
  | "personal"
  | "bereavement"
  | "jury_duty"
  | "fmla"
  | "unpaid"
  | "other";

export type ContractStatus = "draft" | "active" | "expiring" | "renewed" | "archived";

export type AssignmentEntityType = "school" | "program" | "class" | "position";

export const LIFECYCLE_STATES: EmployeeLifecycleState[] = [
  "applicant",
  "interviewing",
  "offer_extended",
  "hired",
  "onboarding",
  "active",
  "leave_of_absence",
  "inactive",
  "terminated",
  "retired",
];

export const LIFECYCLE_TRANSITIONS: Record<
  EmployeeLifecycleState,
  EmployeeLifecycleState[]
> = {
  applicant: ["interviewing", "offer_extended", "inactive", "terminated"],
  interviewing: ["offer_extended", "applicant", "inactive", "terminated"],
  offer_extended: ["hired", "onboarding", "applicant", "inactive", "terminated"],
  hired: ["onboarding", "active"],
  onboarding: ["active", "leave_of_absence", "inactive", "terminated"],
  active: ["leave_of_absence", "inactive", "terminated", "retired"],
  leave_of_absence: ["active", "inactive", "terminated"],
  inactive: ["active", "terminated", "retired"],
  terminated: [],
  retired: [],
};

export interface HcmOperationsSummary {
  workforceTotal: number;
  openPositions: number;
  activeEmployees: number;
  newHires: number;
  certificationsExpiring: number;
  timeOffPending: number;
  performanceReviewsOpen: number;
  professionalDevelopmentActive: number;
  complianceAlerts: number;
}

export interface TransitionLifecycleInput {
  employeeId: string;
  toState: EmployeeLifecycleState;
  effectiveDate?: string;
  title?: string;
  notes?: string;
  schoolId?: string | null;
  organizationId?: string | null;
}
