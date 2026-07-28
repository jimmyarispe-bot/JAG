import {
  STUDENT_LIFECYCLE_STATUSES,
  type StudentLifecycleStatus,
} from "./types";

const FORWARD: Readonly<
  Record<StudentLifecycleStatus, readonly StudentLifecycleStatus[]>
> = {
  Prospective: ["Applicant", "Archived"],
  Applicant: ["Enrolled", "Withdrawn", "Archived"],
  Enrolled: ["Active", "Withdrawn", "Transferred", "Archived"],
  Active: [
    "Leave of Absence",
    "Graduated",
    "Transferred",
    "Withdrawn",
    "Archived",
  ],
  "Leave of Absence": ["Active", "Withdrawn", "Transferred", "Archived"],
  Graduated: ["Archived"],
  Transferred: ["Archived"],
  Withdrawn: ["Archived", "Applicant"],
  Archived: [],
};

export function canTransitionStudentStatus(
  from: StudentLifecycleStatus,
  to: StudentLifecycleStatus
): boolean {
  if (from === to) return true;
  return FORWARD[from]?.includes(to) ?? false;
}

export function isStudentLifecycleStatus(
  value: string
): value is StudentLifecycleStatus {
  return (STUDENT_LIFECYCLE_STATUSES as readonly string[]).includes(value);
}
