import { randomUUID } from "node:crypto";
import { projectAcademyEntityToTwin } from "../twin/project";
import {
  calculateVirtualSessionPay,
  DEFAULT_COMPENSATION_CONFIG,
  roundMoney,
} from "./config";
import { emitWorkforceEvent } from "./events";
import {
  getCompensationConfig,
  listEmployees,
  listPayroll,
  listTimesheets,
  setCompensationConfig,
  upsertPayroll,
} from "./store";
import type {
  CompensationProgramKey,
  PayrollLine,
  PayrollPreparation,
  WorkforceCompensationConfig,
} from "./types";

export type VirtualSessionInput = {
  readonly employeeId: string;
  readonly programKey: CompensationProgramKey;
  readonly studentCount: number;
  readonly stipend?: number;
  readonly bonus?: number;
};

export function createPayrollPreparationService() {
  return {
    getCompensationConfig,
    configureCompensation(
      organizationId: string,
      config: WorkforceCompensationConfig
    ) {
      return setCompensationConfig(organizationId, Object.freeze(config));
    },

    /** Export-ready payroll prep — does not replace external payroll provider. */
    prepare(input: {
      organizationId: string;
      periodStart: string;
      periodEnd: string;
      virtualSessions?: readonly VirtualSessionInput[];
      overtimeByEmployee?: Readonly<Record<string, number>>;
      createdBy: string;
    }): PayrollPreparation {
      const config =
        getCompensationConfig(input.organizationId) ??
        DEFAULT_COMPENSATION_CONFIG;
      const employees = listEmployees(input.organizationId).filter(
        (e) => e.status === "Active"
      );
      const sessions = input.virtualSessions ?? [];
      const overtime = input.overtimeByEmployee ?? {};

      const lines: PayrollLine[] = employees.map((e) => {
        const empSessions = sessions.filter((s) => s.employeeId === e.id);
        const virtualSessionAmount = roundMoney(
          empSessions.reduce(
            (a, s) =>
              a +
              calculateVirtualSessionPay(
                config,
                s.programKey,
                s.studentCount
              ),
            0
          )
        );
        const stipends = roundMoney(
          empSessions.reduce((a, s) => a + (s.stipend ?? 0), 0)
        );
        const bonuses = roundMoney(
          empSessions.reduce((a, s) => a + (s.bonus ?? 0), 0)
        );
        const ot = roundMoney(overtime[e.id] ?? 0);

        let baseAmount = 0;
        if (e.annualSalary != null) {
          // Prorate annual to period as monthly-ish: / 26 biweekly approximation when span ~14d
          const days =
            (new Date(input.periodEnd).getTime() -
              new Date(input.periodStart).getTime()) /
              86_400_000 +
            1;
          baseAmount = roundMoney((e.annualSalary / 365) * days);
        } else if (e.hourlyRate != null) {
          const minutes = listTimesheets(input.organizationId, e.id)
            .filter(
              (t) =>
                (t.status === "Approved" || t.status === "Locked") &&
                t.weekStarting >= input.periodStart &&
                t.weekStarting <= input.periodEnd
            )
            .reduce((a, t) => a + t.totalMinutes, 0);
          baseAmount = roundMoney((minutes / 60) * e.hourlyRate);
        }

        const total = roundMoney(
          baseAmount + virtualSessionAmount + stipends + bonuses + ot
        );
        return {
          employeeId: e.id,
          employeeName: e.displayName,
          employmentType: e.employmentType,
          baseAmount,
          virtualSessionAmount,
          stipends,
          bonuses,
          overtime: ot,
          total,
          notes: empSessions.length
            ? `${empSessions.length} virtual session(s)`
            : "",
        };
      });

      const totalAmount = roundMoney(lines.reduce((a, l) => a + l.total, 0));
      const now = new Date().toISOString();
      const id = randomUUID();
      const twinId = projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "Payroll Summary",
        twinEntityType: "Document",
        id,
        label: `Payroll ${input.periodStart}–${input.periodEnd}`,
        kind: "payroll_summary",
        actor: input.createdBy,
      });

      const prep = upsertPayroll({
        id,
        organizationId: input.organizationId,
        periodStart: input.periodStart.slice(0, 10),
        periodEnd: input.periodEnd.slice(0, 10),
        lines: Object.freeze(lines),
        totalAmount,
        twinEntityId: twinId,
        createdAt: now,
        createdBy: input.createdBy,
      });

      emitWorkforceEvent({
        organizationId: input.organizationId,
        entityType: "PayrollPreparation",
        entityId: id,
        eventType: "payroll_prepared",
        actor: input.createdBy,
        metadata: { totalAmount: String(totalAmount) },
      });
      return prep;
    },

    calculateVirtualPay(
      organizationId: string,
      programKey: CompensationProgramKey,
      studentCount: number
    ) {
      return calculateVirtualSessionPay(
        getCompensationConfig(organizationId),
        programKey,
        studentCount
      );
    },

    list: listPayroll,
  };
}
