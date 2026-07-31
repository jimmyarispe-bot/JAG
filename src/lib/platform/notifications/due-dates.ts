import { dueDateFrom } from "@/lib/platform/decisions/decision";
import type { DecisionPriority } from "@/lib/platform/decisions/types";

/** Default due-in-days by priority (no reminders). */
export const DEFAULT_DUE_IN_DAYS_BY_PRIORITY: Record<DecisionPriority, number> = {
  critical: 2,
  high: 3,
  medium: 7,
  low: 14,
};

export function defaultDueDateForPriority(
  priority: DecisionPriority,
  nowIso: string
): string {
  return dueDateFrom(nowIso, DEFAULT_DUE_IN_DAYS_BY_PRIORITY[priority]);
}

export function overrideDueDate(isoDueDate: string): string {
  const parsed = new Date(isoDueDate);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid due date: ${isoDueDate}`);
  }
  return parsed.toISOString();
}
