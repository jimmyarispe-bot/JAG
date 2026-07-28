/**
 * Configurable workforce policies (Academy rules — not hard-coded in engines).
 * Virtual: Reading/Writing/Math $20 first +$5; Structured Literacy $35 first +$5.
 * Timesheets due Friday 11:59 PM ET; school leader approval; lock after approval.
 */

import type {
  CompensationProgramKey,
  WorkforceCompensationConfig,
  WorkforceTimekeepingConfig,
} from "./types";

export const DEFAULT_TIMEKEEPING_CONFIG: WorkforceTimekeepingConfig =
  Object.freeze({
    dueDayOfWeek: 5,
    dueHourEt: 23,
    dueMinuteEt: 59,
    timezone: "America/New_York",
    requireSchoolLeaderApproval: true,
    lockAfterApproval: true,
  });

export const DEFAULT_COMPENSATION_CONFIG: WorkforceCompensationConfig =
  Object.freeze({
    virtualRules: Object.freeze([
      {
        programKey: "reading" as const,
        firstStudentAmount: 20,
        additionalStudentAmount: 5,
      },
      {
        programKey: "writing" as const,
        firstStudentAmount: 20,
        additionalStudentAmount: 5,
      },
      {
        programKey: "math" as const,
        firstStudentAmount: 20,
        additionalStudentAmount: 5,
      },
      {
        programKey: "structured_literacy" as const,
        firstStudentAmount: 35,
        additionalStudentAmount: 5,
      },
    ]),
  });

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Virtual session pay for N students under configured rules. */
export function calculateVirtualSessionPay(
  config: WorkforceCompensationConfig,
  programKey: CompensationProgramKey,
  studentCount: number
): number {
  if (studentCount <= 0) return 0;
  const rule = config.virtualRules.find((r) => r.programKey === programKey);
  if (!rule) return 0;
  return roundMoney(
    rule.firstStudentAmount +
      Math.max(0, studentCount - 1) * rule.additionalStudentAmount
  );
}

/** Next Friday 11:59 PM ET as ISO (approx via date math; ET weekday). */
export function timesheetDueAtForWeek(
  weekStarting: string,
  config: WorkforceTimekeepingConfig = DEFAULT_TIMEKEEPING_CONFIG
): string {
  const start = new Date(`${weekStarting.slice(0, 10)}T12:00:00.000Z`);
  const day = start.getUTCDay();
  const daysUntilFriday = (config.dueDayOfWeek - day + 7) % 7 || 7;
  const friday = new Date(start);
  friday.setUTCDate(start.getUTCDate() + daysUntilFriday);
  // Represent ET deadline as Friday 23:59 in a stable ISO form
  return `${friday.toISOString().slice(0, 10)}T${String(config.dueHourEt).padStart(2, "0")}:${String(config.dueMinuteEt).padStart(2, "0")}:00.000-04:00`;
}
