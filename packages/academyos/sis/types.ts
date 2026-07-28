/** SIS Production™ — student operational model. */

export const STUDENT_LIFECYCLE_STATUSES = [
  "Prospective",
  "Applicant",
  "Enrolled",
  "Active",
  "Leave of Absence",
  "Graduated",
  "Transferred",
  "Withdrawn",
  "Archived",
] as const;
export type StudentLifecycleStatus =
  (typeof STUDENT_LIFECYCLE_STATUSES)[number];

export const FAMILY_RELATIONSHIP_KINDS = [
  "Parent",
  "Guardian",
  "Emergency Contact",
  "Authorized Pickup",
  "Other",
] as const;
export type FamilyRelationshipKind =
  (typeof FAMILY_RELATIONSHIP_KINDS)[number];

export const ATTENDANCE_STATUSES = [
  "Present",
  "Absent",
  "Excused",
  "Unexcused",
  "Late",
  "Early Dismissal",
  "Remote Present",
] as const;
export type SisAttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const CLASS_ASSIGNMENT_KINDS = [
  "Class",
  "Homeroom",
  "Intervention",
  "Virtual Session",
  "Therapy Group",
] as const;
export type ClassAssignmentKind = (typeof CLASS_ASSIGNMENT_KINDS)[number];

export const SUPPORT_PLAN_KINDS = [
  "IEP",
  "504 Plan",
  "Accommodation Plan",
  "Behavior Support Plan",
  "Therapy Services",
] as const;
export type SupportPlanKind = (typeof SUPPORT_PLAN_KINDS)[number];

export type StudentIdentity = {
  readonly preferredName: string;
  readonly legalFirstName: string;
  readonly legalLastName: string;
  readonly dateOfBirth: string;
  readonly stateStudentId: string | null;
  readonly internalAcademyId: string;
};

export type StudentMedical = {
  readonly allergies: string;
  readonly medications: string;
  readonly physician: string;
  readonly insurance: string;
  readonly emergencyProcedures: string;
  readonly medicalAlerts: string;
};

export type StudentAcademic = {
  readonly currentCourseIds: readonly string[];
  readonly historicalCourseIds: readonly string[];
  readonly readingLevel: string | null;
  readonly writingLevel: string | null;
  readonly mathLevel: string | null;
  readonly structuredLiteracyLevel: string | null;
  readonly credits: number;
  readonly graduationRequirementsMet: number;
  readonly graduationRequirementsTotal: number;
};

export type SisStudent = {
  readonly id: string;
  readonly organizationId: string;
  readonly identity: StudentIdentity;
  readonly status: StudentLifecycleStatus;
  readonly gradeLevel: string;
  readonly campusId: string | null;
  readonly campusName: string | null;
  readonly program: string;
  readonly enrollmentDate: string | null;
  readonly graduationTarget: string | null;
  readonly applicantId: string | null;
  readonly medical: StudentMedical;
  readonly academic: StudentAcademic;
  readonly parentAccessToken: string;
  readonly twinEntityId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: string;
};

export type FamilyMember = {
  readonly id: string;
  readonly organizationId: string;
  readonly studentId: string;
  readonly kind: FamilyRelationshipKind;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string | null;
  readonly phone: string | null;
  readonly relationship: string;
  readonly custodyFlag: boolean;
  readonly communicationPreference: "email" | "phone" | "portal" | "any";
  readonly financialResponsibility: boolean;
  readonly twinEntityId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type SisAttendanceRecord = {
  readonly id: string;
  readonly organizationId: string;
  readonly studentId: string;
  readonly date: string;
  readonly status: SisAttendanceStatus;
  readonly classId: string | null;
  readonly teacherId: string | null;
  readonly campusId: string | null;
  readonly notes: string;
  readonly twinEntityId: string | null;
  readonly createdAt: string;
  readonly createdBy: string;
};

export type ClassAssignment = {
  readonly id: string;
  readonly organizationId: string;
  readonly studentId: string;
  readonly classId: string;
  readonly className: string;
  readonly kind: ClassAssignmentKind;
  readonly teacherId: string | null;
  readonly campusId: string | null;
  readonly startsOn: string;
  readonly endsOn: string | null;
  readonly createdAt: string;
  readonly createdBy: string;
};

export type SupportPlan = {
  readonly id: string;
  readonly organizationId: string;
  readonly studentId: string;
  readonly kind: SupportPlanKind;
  readonly title: string;
  readonly effectiveFrom: string;
  readonly effectiveTo: string | null;
  readonly assignedStaffIds: readonly string[];
  readonly reviewDate: string | null;
  readonly requiredDocumentation: string;
  readonly status: "Draft" | "Active" | "Review Due" | "Archived";
  readonly twinEntityId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: string;
};

export type StudentTimelineEntry = {
  readonly id: string;
  readonly organizationId: string;
  readonly studentId: string;
  readonly kind: string;
  readonly message: string;
  readonly actor: string;
  readonly at: string;
  readonly metadata: Readonly<Record<string, string>>;
};

export type StudentAuditEntry = {
  readonly id: string;
  readonly organizationId: string;
  readonly studentId: string;
  readonly action: string;
  readonly actor: string;
  readonly at: string;
  readonly details: Readonly<Record<string, string>>;
};

export type StudentSuccessSummary = {
  readonly activeStudents: number;
  readonly attendanceTrends: {
    readonly presentRate: number;
    readonly records: number;
    readonly chronicAbsenteeismCount: number;
  };
  readonly enrollmentByCampus: Readonly<Record<string, number>>;
  readonly supportPlanReviewsDue: number;
  readonly graduationProgress: {
    readonly averagePercent: number;
    readonly onTrack: number;
  };
  readonly academicLevelDistribution: Readonly<Record<string, number>>;
};

export type AttendanceDashboard = {
  readonly dailyPresentRate: number;
  readonly monthlyPresentRate: number;
  readonly chronicAbsenteeism: number;
  readonly byCampus: Readonly<Record<string, number>>;
  readonly byTeacher: Readonly<Record<string, number>>;
  readonly byStatus: Readonly<Record<SisAttendanceStatus, number>>;
};
