/** Human Capital & Workforce™ — employees, staffing, payroll prep. */

export const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Contractor (1099)",
  "Substitute",
  "Temporary",
  "Volunteer",
] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const EMPLOYEE_STATUSES = [
  "Active",
  "On Leave",
  "Terminated",
  "Pending",
] as const;
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

export const DEFAULT_POSITION_TITLES = [
  "Teacher",
  "Reading Specialist",
  "Structured Literacy Teacher",
  "Therapist",
  "School Leader",
  "Executive Director",
  "Admissions",
  "Finance",
  "HR",
  "Operations",
  "Support Staff",
] as const;

export const ASSIGNMENT_KINDS = [
  "Campus",
  "Program",
  "Department",
  "Class",
  "Intervention Group",
  "Therapy Group",
] as const;
export type AssignmentKind = (typeof ASSIGNMENT_KINDS)[number];

export const CERTIFICATION_KINDS = [
  "Teaching License",
  "Structured Literacy Credential",
  "CPR/First Aid",
  "Background Check",
  "Annual Training",
  "Other",
] as const;
export type CertificationKind = (typeof CERTIFICATION_KINDS)[number];

export const CONTRACT_KINDS = [
  "W-2 Salaried",
  "W-2 Hourly",
  "1099 Contractor",
  "Annual Contract",
  "Temporary Agreement",
] as const;
export type ContractKind = (typeof CONTRACT_KINDS)[number];

export const TIMESHEET_STATUSES = [
  "Draft",
  "Submitted",
  "Approved",
  "Rejected",
  "Locked",
] as const;
export type TimesheetStatus = (typeof TIMESHEET_STATUSES)[number];

export const COMPENSATION_PROGRAM_KEYS = [
  "reading",
  "writing",
  "math",
  "structured_literacy",
] as const;
export type CompensationProgramKey = (typeof COMPENSATION_PROGRAM_KEYS)[number];

export type VirtualCompensationRule = {
  readonly programKey: CompensationProgramKey;
  readonly firstStudentAmount: number;
  readonly additionalStudentAmount: number;
};

export type WorkforceTimekeepingConfig = {
  /** Timesheets due Friday 11:59 PM ET */
  readonly dueDayOfWeek: number; // 5 = Friday
  readonly dueHourEt: number; // 23
  readonly dueMinuteEt: number; // 59
  readonly timezone: string;
  readonly requireSchoolLeaderApproval: boolean;
  readonly lockAfterApproval: boolean;
};

export type WorkforceCompensationConfig = {
  readonly virtualRules: readonly VirtualCompensationRule[];
};

export type Position = {
  readonly id: string;
  readonly organizationId: string;
  readonly title: string;
  readonly department: string | null;
  readonly description: string;
  readonly open: boolean;
  readonly twinEntityId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: string;
};

export type Employee = {
  readonly id: string;
  readonly organizationId: string;
  readonly employeeNumber: string;
  readonly displayName: string;
  readonly email: string | null;
  readonly employmentType: EmploymentType;
  readonly status: EmployeeStatus;
  readonly campusId: string | null;
  readonly campusName: string | null;
  readonly department: string | null;
  readonly positionId: string | null;
  readonly supervisorId: string | null;
  readonly hireDate: string | null;
  readonly backgroundCheckClear: boolean;
  readonly trainingComplete: boolean;
  readonly annualSalary: number | null;
  readonly hourlyRate: number | null;
  readonly portalToken: string;
  readonly twinEntityId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: string;
};

export type StaffAssignment = {
  readonly id: string;
  readonly organizationId: string;
  readonly employeeId: string;
  readonly kind: AssignmentKind;
  readonly targetId: string;
  readonly targetName: string;
  readonly startsOn: string;
  readonly endsOn: string | null;
  readonly createdAt: string;
  readonly createdBy: string;
};

export type Certification = {
  readonly id: string;
  readonly organizationId: string;
  readonly employeeId: string;
  readonly kind: CertificationKind;
  readonly name: string;
  readonly issuedOn: string | null;
  readonly expiresOn: string | null;
  readonly status: "Valid" | "Expiring Soon" | "Expired" | "Pending";
  readonly twinEntityId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: string;
};

export type EmploymentContract = {
  readonly id: string;
  readonly organizationId: string;
  readonly employeeId: string;
  readonly kind: ContractKind;
  readonly startsOn: string;
  readonly endsOn: string | null;
  readonly renewalDate: string | null;
  readonly compensationAmount: number;
  readonly compensationUnit: "annual" | "hourly" | "per_session" | "flat";
  readonly benefitsEligible: boolean;
  readonly documentUrls: readonly string[];
  readonly status: "Draft" | "Active" | "Expired" | "Terminated";
  readonly twinEntityId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: string;
};

export type TimeEntry = {
  readonly id: string;
  readonly date: string;
  readonly minutes: number;
  readonly source: "Clock" | "Manual" | "Session";
  readonly sessionId: string | null;
  readonly notes: string;
};

export type Timesheet = {
  readonly id: string;
  readonly organizationId: string;
  readonly employeeId: string;
  readonly weekStarting: string;
  readonly entries: readonly TimeEntry[];
  readonly totalMinutes: number;
  readonly status: TimesheetStatus;
  readonly submittedAt: string | null;
  readonly approvedAt: string | null;
  readonly approvedBy: string | null;
  readonly locked: boolean;
  readonly twinEntityId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: string;
};

export type PayrollLine = {
  readonly employeeId: string;
  readonly employeeName: string;
  readonly employmentType: EmploymentType;
  readonly baseAmount: number;
  readonly virtualSessionAmount: number;
  readonly stipends: number;
  readonly bonuses: number;
  readonly overtime: number;
  readonly total: number;
  readonly notes: string;
};

export type PayrollPreparation = {
  readonly id: string;
  readonly organizationId: string;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly lines: readonly PayrollLine[];
  readonly totalAmount: number;
  readonly twinEntityId: string | null;
  readonly createdAt: string;
  readonly createdBy: string;
};

export type AbsenceRequest = {
  readonly id: string;
  readonly organizationId: string;
  readonly employeeId: string;
  readonly startsOn: string;
  readonly endsOn: string;
  readonly reason: string;
  readonly status: "Requested" | "Covered" | "Denied" | "Cancelled";
  readonly substituteEmployeeId: string | null;
  readonly sessionIds: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: string;
};

export type PerformanceReview = {
  readonly id: string;
  readonly organizationId: string;
  readonly employeeId: string;
  readonly kind:
    | "Annual Review"
    | "Goal"
    | "Professional Development"
    | "Coaching"
    | "Observation"
    | "Improvement Plan";
  readonly title: string;
  readonly body: string;
  readonly goals: string;
  readonly reviewedOn: string;
  readonly reviewerId: string | null;
  readonly memoryLinkId: string | null;
  readonly twinEntityId: string | null;
  readonly createdAt: string;
  readonly createdBy: string;
};

export type WorkforceSummary = {
  readonly organizationId: string;
  readonly headcount: number;
  readonly staffingByCampus: Readonly<Record<string, number>>;
  readonly openPositions: number;
  readonly certificationExpirations: number;
  readonly payrollTotals: number;
  readonly teacherUtilization: number;
  readonly sessionCoverageRate: number;
  readonly substituteUsage: number;
};
