/**
 * Academy SIS — report definitions only (no rendering).
 */

export type AcademySisReportDefinition = {
  readonly id: string;
  readonly applicationId: "academyos";
  readonly title: string;
  readonly domain: "sis";
  readonly entityType: string;
  readonly fields: readonly string[];
  readonly requiredPermission: string;
  readonly version: string;
};

function report(input: {
  id: string;
  title: string;
  entityType: string;
  fields: readonly string[];
  requiredPermission: string;
}): AcademySisReportDefinition {
  return Object.freeze({
    ...input,
    applicationId: "academyos" as const,
    domain: "sis" as const,
    version: "1.0.0",
    fields: Object.freeze([...input.fields]),
  });
}

export const ACADEMY_SIS_REPORTS: readonly AcademySisReportDefinition[] =
  Object.freeze([
    report({
      id: "academy.sis.report.student_roster",
      title: "Student Roster",
      entityType: "Student",
      fields: Object.freeze([
        "legalName",
        "preferredName",
        "studentId",
        "grade",
        "program",
        "campus",
        "status",
      ]),
      requiredPermission: "academyos.sis.reports.view",
    }),
    report({
      id: "academy.sis.report.enrollment",
      title: "Enrollment Report",
      entityType: "Enrollment",
      fields: Object.freeze([
        "studentId",
        "programId",
        "campusId",
        "grade",
        "startDate",
        "enrollmentKind",
        "status",
      ]),
      requiredPermission: "academyos.sis.reports.view",
    }),
    report({
      id: "academy.sis.report.active_students",
      title: "Active Students",
      entityType: "Student",
      fields: Object.freeze([
        "legalName",
        "studentId",
        "grade",
        "campus",
        "status",
      ]),
      requiredPermission: "academyos.sis.reports.view",
    }),
    report({
      id: "academy.sis.report.withdrawals",
      title: "Withdrawals",
      entityType: "Enrollment",
      fields: Object.freeze([
        "studentId",
        "endDate",
        "withdrawalReason",
        "status",
      ]),
      requiredPermission: "academyos.sis.reports.view",
    }),
    report({
      id: "academy.sis.report.grade_distribution",
      title: "Grade Distribution",
      entityType: "Student",
      fields: Object.freeze(["grade", "campus", "program", "status"]),
      requiredPermission: "academyos.sis.reports.view",
    }),
  ]);

export const ACADEMY_SIS_REPORT_IDS = Object.freeze(
  ACADEMY_SIS_REPORTS.map((r) => r.id)
);

const reportRegistry = new Map<string, AcademySisReportDefinition>();
const permissionPackRegistry = new Map<string, unknown>();

export function resetAcademySisReportsForTests(): void {
  reportRegistry.clear();
}

export function registerAcademySisReports(): readonly AcademySisReportDefinition[] {
  reportRegistry.clear();
  for (const item of ACADEMY_SIS_REPORTS) {
    reportRegistry.set(item.id, item);
  }
  return listAcademySisReports();
}

export function listAcademySisReports(): AcademySisReportDefinition[] {
  return [...reportRegistry.values()].sort((a, b) => a.id.localeCompare(b.id));
}

export function getAcademySisReport(
  id: string
): AcademySisReportDefinition | null {
  return reportRegistry.get(id) ?? null;
}

export function resetAcademySisPermissionPackForTests(): void {
  permissionPackRegistry.clear();
}

export function registerAcademySisPermissionPack(pack: {
  id: string;
  label: string;
  description: string;
  permissions: readonly string[];
}): void {
  permissionPackRegistry.set(pack.id, Object.freeze({ ...pack }));
}

export function getAcademySisPermissionPack(id: string): unknown {
  return permissionPackRegistry.get(id) ?? null;
}
