/**
 * Configurable billing policies (Academy business rules — not hard-coded in engine).
 * Defaults mirror existing Academy finance policy:
 * - Monthly tuition due on the 25th
 * - Reminders through month end
 * - Daily late fees from the 1st of the following month (capped)
 * - Sibling discount (one student); scholarships reduce balance before family share
 */

import type { FinanceBillingConfig } from "./types";

export const DEFAULT_BILLING_CONFIG: FinanceBillingConfig = Object.freeze({
  monthlyDueDay: 25,
  reminderUntilMonthEnd: true,
  lateFeeStartDayOfNextMonth: 1,
  lateFeeDailyAmount: 5,
  lateFeeMaxDays: 10,
  siblingDiscountPercent: 5,
  siblingDiscountOneStudentOnly: true,
  scholarshipAppliesBeforeFamilyResponsibility: true,
});

export function mergeBillingConfig(
  partial?: Partial<FinanceBillingConfig>
): FinanceBillingConfig {
  return Object.freeze({
    ...DEFAULT_BILLING_CONFIG,
    ...(partial ?? {}),
  });
}

/** Due date for a billing period month (YYYY-MM) using configured due day. */
export function dueDateForPeriod(
  periodMonth: string,
  dueDay: number
): string {
  const [y, m] = periodMonth.split("-").map(Number);
  const year = y ?? new Date().getUTCFullYear();
  const month = (m ?? 1) - 1;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const day = Math.min(Math.max(1, dueDay), lastDay);
  return new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
}

/** First day late fees may apply after unpaid month-end. */
export function lateFeeStartDate(periodMonth: string): string {
  const [y, m] = periodMonth.split("-").map(Number);
  const year = y ?? new Date().getUTCFullYear();
  const month = m ?? 1;
  // Next month day 1
  return new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
}

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}
