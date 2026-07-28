/**
 * Employee portal — token-scoped workforce self-service.
 */

import {
  findEmployeeByPortalToken,
  getPosition,
  listAssignments,
  listCertifications,
  listContracts,
  listPayroll,
  listPerformance,
  listTimesheets,
} from "./store";
import { createTimekeepingService } from "./timekeeping";

export function createEmployeePortalService() {
  const timekeeping = createTimekeepingService();

  return {
    resolve(token: string) {
      const employee = findEmployeeByPortalToken(token);
      if (!employee) return { error: "Invalid employee portal token." as const };

      const position = employee.positionId
        ? getPosition(employee.organizationId, employee.positionId)
        : null;

      const payrollSummaries = listPayroll(employee.organizationId)
        .flatMap((p) =>
          p.lines
            .filter((l) => l.employeeId === employee.id)
            .map((l) => ({
              periodStart: p.periodStart,
              periodEnd: p.periodEnd,
              total: l.total,
              baseAmount: l.baseAmount,
              virtualSessionAmount: l.virtualSessionAmount,
            }))
        )
        .slice(0, 12);

      return {
        profile: employee,
        position,
        assignments: listAssignments(employee.organizationId, employee.id),
        schedule: listAssignments(employee.organizationId, employee.id).filter(
          (a) => a.endsOn == null
        ),
        timesheets: listTimesheets(employee.organizationId, employee.id),
        payrollSummaries: Object.freeze(payrollSummaries),
        certifications: listCertifications(
          employee.organizationId,
          employee.id
        ),
        contracts: listContracts(employee.organizationId, employee.id),
        professionalDevelopment: listPerformance(
          employee.organizationId,
          employee.id
        ).filter(
          (p) =>
            p.kind === "Professional Development" ||
            p.kind === "Coaching" ||
            p.kind === "Goal"
        ),
        performanceReviews: listPerformance(
          employee.organizationId,
          employee.id
        ),
      };
    },

    submitTimesheet(input: { token: string; timesheetId: string }) {
      const employee = findEmployeeByPortalToken(input.token);
      if (!employee) return { error: "Invalid employee portal token." };
      return timekeeping.submit({
        organizationId: employee.organizationId,
        timesheetId: input.timesheetId,
        actor: `employee:${employee.id}`,
      });
    },
  };
}
