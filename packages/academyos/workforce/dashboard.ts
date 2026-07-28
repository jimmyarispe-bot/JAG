import { listSessions as listAoSessions } from "../academic-ops/store";
import { createCertificationService } from "./certifications";
import { createSubstituteService } from "./substitutes";
import {
  listAssignments,
  listEmployees,
  listPayroll,
  listPositions,
} from "./store";
import type { WorkforceSummary } from "./types";

export function buildWorkforceSummary(
  organizationId: string
): WorkforceSummary {
  const employees = listEmployees(organizationId).filter(
    (e) => e.status === "Active"
  );
  const staffingByCampus: Record<string, number> = {};
  for (const e of employees) {
    const campus = e.campusName ?? "Unassigned";
    staffingByCampus[campus] = (staffingByCampus[campus] ?? 0) + 1;
  }

  const openPositions = listPositions(organizationId).filter((p) => p.open)
    .length;
  const certificationExpirations = createCertificationService().expiringSoon(
    organizationId
  ).length;

  const payrollTotals = listPayroll(organizationId).reduce(
    (a, p) => a + p.totalAmount,
    0
  );

  const teachers = employees.filter(
    (e) =>
      e.employmentType === "Full-time" ||
      e.employmentType === "Part-time" ||
      e.employmentType === "Contractor (1099)"
  );
  const teachersWithAssignments = new Set(
    listAssignments(organizationId)
      .filter((a) => a.endsOn == null)
      .map((a) => a.employeeId)
  );
  const teacherUtilization =
    teachers.length === 0
      ? 0
      : Math.round(
          ([...teachersWithAssignments].filter((id) =>
            teachers.some((t) => t.id === id)
          ).length /
            teachers.length) *
            1000
        ) / 10;

  const coverage = createSubstituteService().coverageStats(organizationId);
  const sessions = listAoSessions(organizationId);
  const coveredSessions = sessions.filter(
    (s) => s.status !== "Cancelled"
  ).length;
  const sessionCoverageRate =
    sessions.length === 0
      ? 100
      : Math.round((coveredSessions / sessions.length) * 1000) / 10;

  return {
    organizationId,
    headcount: employees.length,
    staffingByCampus: Object.freeze(staffingByCampus),
    openPositions,
    certificationExpirations,
    payrollTotals: Math.round(payrollTotals * 100) / 100,
    teacherUtilization,
    sessionCoverageRate,
    substituteUsage: coverage.covered,
  };
}
