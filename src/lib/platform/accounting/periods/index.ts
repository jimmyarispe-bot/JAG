/**
 * Accounting Intelligence — Periods & Fiscal Calendars.
 */

import { createAccountingId } from "@/lib/platform/accounting/ids";
import type {
  AccountingFiscalCalendar,
  AccountingFiscalCalendarKind,
  AccountingMetadata,
  AccountingPeriod,
  AccountingPeriodFrequency,
  AccountingPeriodStatus,
} from "@/lib/platform/accounting/types";

export interface AccountingPeriodsDependencies {
  createId?: (prefix: string) => string;
  now?: () => Date;
}

export interface CreateFiscalCalendarInput {
  name: string;
  kind: AccountingFiscalCalendarKind;
  fiscalYearStartMonth?: number;
  metadata?: AccountingMetadata;
}

export interface CreatePeriodInput {
  calendarId: string;
  name: string;
  fiscalYear: number;
  frequency: AccountingPeriodFrequency;
  periodNumber: number;
  startDate: string;
  endDate: string;
  metadata?: AccountingMetadata;
}

export class AccountingPeriods {
  private readonly calendars = new Map<string, AccountingFiscalCalendar>();
  private readonly periods = new Map<string, AccountingPeriod>();
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;

  constructor(deps?: AccountingPeriodsDependencies) {
    this.createId = deps?.createId ?? ((prefix) => createAccountingId(prefix));
    this.now = deps?.now ?? (() => new Date());
  }

  createCalendar(input: CreateFiscalCalendarInput): AccountingFiscalCalendar {
    const startMonth =
      input.kind === "calendar_year"
        ? 1
        : (input.fiscalYearStartMonth ?? 7);
    if (startMonth < 1 || startMonth > 12) {
      throw new Error(`Invalid fiscalYearStartMonth: ${startMonth}`);
    }
    const calendar: AccountingFiscalCalendar = {
      id: this.createId("cal"),
      name: input.name,
      kind: input.kind,
      fiscalYearStartMonth: startMonth,
      createdAt: this.now().toISOString(),
      metadata: input.metadata,
    };
    this.calendars.set(calendar.id, calendar);
    return calendar;
  }

  getCalendar(id: string): AccountingFiscalCalendar | undefined {
    return this.calendars.get(id);
  }

  listCalendars(): AccountingFiscalCalendar[] {
    return [...this.calendars.values()];
  }

  createPeriod(input: CreatePeriodInput): AccountingPeriod {
    if (!this.calendars.has(input.calendarId)) {
      throw new Error(`Fiscal calendar not found: ${input.calendarId}`);
    }
    if (input.startDate > input.endDate) {
      throw new Error("Period startDate must be on or before endDate");
    }
    const period: AccountingPeriod = {
      id: this.createId("period"),
      calendarId: input.calendarId,
      name: input.name,
      fiscalYear: input.fiscalYear,
      frequency: input.frequency,
      periodNumber: input.periodNumber,
      startDate: input.startDate,
      endDate: input.endDate,
      status: "open",
      reopenedApprovalId: null,
      closedAt: null,
      closedBy: null,
      createdAt: this.now().toISOString(),
      metadata: input.metadata,
    };
    this.periods.set(period.id, period);
    return period;
  }

  getPeriod(id: string): AccountingPeriod | undefined {
    return this.periods.get(id);
  }

  listPeriods(calendarId?: string): AccountingPeriod[] {
    const all = [...this.periods.values()];
    return calendarId
      ? all.filter((p) => p.calendarId === calendarId)
      : all;
  }

  listByStatus(status: AccountingPeriodStatus): AccountingPeriod[] {
    return this.listPeriods().filter((p) => p.status === status);
  }

  /** Soft close — posting still allowed with elevated controls. */
  softClose(periodId: string, actorId?: string): AccountingPeriod {
    return this.transition(periodId, "soft_close", actorId);
  }

  /** Hard close — no further posting except adjustments with approval. */
  hardClose(periodId: string, actorId?: string): AccountingPeriod {
    return this.transition(periodId, "hard_close", actorId);
  }

  /** Lock — immutable; no posting. */
  lock(periodId: string, actorId?: string): AccountingPeriod {
    return this.transition(periodId, "locked", actorId);
  }

  /** Mark year-end period. */
  markYearEnd(periodId: string, actorId?: string): AccountingPeriod {
    return this.transition(periodId, "year_end", actorId);
  }

  /**
   * Reopen a closed/locked period. Requires approval reference.
   */
  reopen(
    periodId: string,
    approvalId: string,
    actorId?: string
  ): AccountingPeriod {
    if (!approvalId) {
      throw new Error("Reopening a period requires an approvalId");
    }
    const current = this.require(periodId);
    if (current.status === "open" || current.status === "reopened") {
      throw new Error(`Period ${periodId} is already open`);
    }
    const updated: AccountingPeriod = {
      ...current,
      status: "reopened",
      reopenedApprovalId: approvalId,
      closedAt: null,
      closedBy: actorId ?? null,
    };
    this.periods.set(periodId, updated);
    return updated;
  }

  /** Whether posting is allowed into this period. */
  canPost(periodId: string, options?: { allowHardCloseAdjustment?: boolean }): boolean {
    const period = this.periods.get(periodId);
    if (!period) return false;
    switch (period.status) {
      case "open":
      case "reopened":
      case "soft_close":
        return true;
      case "hard_close":
        return options?.allowHardCloseAdjustment === true;
      case "locked":
      case "year_end":
        return false;
      default: {
        const _exhaustive: never = period.status;
        return _exhaustive;
      }
    }
  }

  private transition(
    periodId: string,
    status: AccountingPeriodStatus,
    actorId?: string
  ): AccountingPeriod {
    const current = this.require(periodId);
    const updated: AccountingPeriod = {
      ...current,
      status,
      closedAt:
        status === "open" || status === "reopened"
          ? null
          : this.now().toISOString(),
      closedBy: actorId ?? null,
    };
    this.periods.set(periodId, updated);
    return updated;
  }

  private require(periodId: string): AccountingPeriod {
    const period = this.periods.get(periodId);
    if (!period) {
      throw new Error(`Accounting period not found: ${periodId}`);
    }
    return period;
  }
}

export function createAccountingPeriods(
  deps?: AccountingPeriodsDependencies
): AccountingPeriods {
  return new AccountingPeriods(deps);
}
