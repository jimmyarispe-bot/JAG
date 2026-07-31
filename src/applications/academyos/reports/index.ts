export type AcademyReportDefinition = {
  id: string;
  applicationId: string;
  title: string;
  domain: string;
  entityType: string | null;
  fields: string[];
  requiredPermission: string;
  version: string;
};

const registry = new Map<string, AcademyReportDefinition>();

export function resetAcademyReportsForTests(): void {
  registry.clear();
}

function report(input: {
  id: string;
  title: string;
  domain: string;
  entityType: string | null;
  fields: string[];
  requiredPermission: string;
}): AcademyReportDefinition {
  return {
    ...input,
    applicationId: "academyos",
    version: "1.1.0",
  };
}

/** Report catalog — definitions only (no reporting engine). */
export const ACADEMYOS_REPORTS: AcademyReportDefinition[] = [
  report({
    id: "academyos.report.admissions",
    title: "Admissions Pipeline",
    domain: "admissions",
    entityType: "Application",
    fields: ["displayName", "schoolId", "status", "submittedOn"],
    requiredPermission: "academyos.admissions.read",
  }),
  report({
    id: "academyos.report.enrollment",
    title: "Enrollment",
    domain: "enrollment",
    entityType: "Enrollment",
    fields: ["studentId", "sectionId", "classId", "programId", "startDate", "status"],
    requiredPermission: "academyos.reports.read",
  }),
  report({
    id: "academyos.report.attendance",
    title: "Attendance",
    domain: "attendance",
    entityType: "AttendanceRecord",
    fields: ["studentId", "sectionId", "classId", "attendanceDate", "status"],
    requiredPermission: "academyos.attendance.read",
  }),
  report({
    id: "academyos.report.teacher-utilization",
    title: "Teacher Utilization",
    domain: "staffing",
    entityType: "StaffAssignment",
    fields: ["employeeId", "schoolId", "sectionId", "role", "status"],
    requiredPermission: "academyos.hr.read",
  }),
  report({
    id: "academyos.report.scholarships",
    title: "Scholarships",
    domain: "scholarships",
    entityType: "Scholarship",
    fields: ["displayName", "studentId", "awardAmount", "status", "awardedOn"],
    requiredPermission: "academyos.scholarships.read",
  }),
  report({
    id: "academyos.report.payroll",
    title: "Payroll",
    domain: "hr",
    entityType: "PayrollBatch",
    fields: ["displayName", "schoolId", "periodStart", "periodEnd", "totalAmount", "status"],
    requiredPermission: "academyos.hr.read",
  }),
  report({
    id: "academyos.report.revenue",
    title: "Revenue",
    domain: "finance",
    entityType: "Invoice",
    fields: ["displayName", "studentId", "amount", "dueDate", "status"],
    requiredPermission: "academyos.finance.read",
  }),
  report({
    id: "academyos.report.academic-progress",
    title: "Academic Progress",
    domain: "academics",
    entityType: "Assessment",
    fields: ["displayName", "studentId", "sectionId", "score", "status"],
    requiredPermission: "academyos.learning.read",
  }),
  report({
    id: "academyos.report.graduation",
    title: "Graduation",
    domain: "students",
    entityType: "Student",
    fields: ["displayName", "schoolId", "status"],
    requiredPermission: "academyos.students.read",
  }),
  report({
    id: "academyos.report.compliance",
    title: "Compliance",
    domain: "compliance",
    entityType: "IEP",
    fields: ["studentId", "effectiveOn", "reviewOn", "status"],
    requiredPermission: "academyos.compliance.read",
  }),
  report({
    id: "academyos.report.behavior",
    title: "Behavior Incidents",
    domain: "behavior",
    entityType: "BehaviorIncident",
    fields: ["displayName", "studentId", "severity", "occurredOn", "status"],
    requiredPermission: "academyos.behavior.read",
  }),
  report({
    id: "academyos.report.staffing",
    title: "Staffing",
    domain: "hr",
    entityType: "Employee",
    fields: ["displayName", "jobTitle", "schoolId", "status", "hireDate"],
    requiredPermission: "academyos.hr.read",
  }),
];

export function registerAcademyReports(): AcademyReportDefinition[] {
  registry.clear();
  for (const item of ACADEMYOS_REPORTS) {
    registry.set(item.id, { ...item, fields: [...item.fields] });
  }
  return listAcademyReports();
}

export function listAcademyReports(): AcademyReportDefinition[] {
  return [...registry.values()].sort((a, b) => a.id.localeCompare(b.id));
}
