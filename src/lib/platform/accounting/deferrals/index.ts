/**
 * Accounting Intelligence — Deferrals.
 *
 * Revenue/expense deferrals with recognition schedules and remaining balances.
 */

import { createAccountingId } from "@/lib/platform/accounting/ids";
import type { AccountingAudit } from "@/lib/platform/accounting/audit";
import type { AccountingPosting } from "@/lib/platform/accounting/posting";
import type {
  AccountingDeferral,
  AccountingDeferralKind,
  AccountingDeferralScheduleEntry,
  AccountingDimensionalContext,
  AccountingMetadata,
} from "@/lib/platform/accounting/types";
import { emptyDimensions } from "@/lib/platform/finance/types";

export interface AccountingDeferralsDependencies {
  posting: AccountingPosting;
  audit: AccountingAudit;
  createId?: (prefix: string) => string;
  now?: () => Date;
}

export interface CreateDeferralInput {
  kind: AccountingDeferralKind;
  description: string;
  totalAmount: number;
  currency?: string;
  deferralAccountId: string;
  recognitionAccountId: string;
  /** Period IDs in recognition order; amount split evenly unless amounts provided. */
  schedulePeriodIds: readonly string[];
  scheduleAmounts?: readonly number[];
  /** Initial cash/expense account for the deferral setup entry. */
  offsetAccountId: string;
  setupPeriodId: string;
  dimensions?: AccountingDimensionalContext;
  actorId?: string | null;
  metadata?: AccountingMetadata;
}

export class AccountingDeferrals {
  private readonly deferrals = new Map<string, AccountingDeferral>();
  private readonly posting: AccountingPosting;
  private readonly audit: AccountingAudit;
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;

  constructor(deps: AccountingDeferralsDependencies) {
    this.posting = deps.posting;
    this.audit = deps.audit;
    this.createId = deps.createId ?? ((prefix) => createAccountingId(prefix));
    this.now = deps.now ?? (() => new Date());
  }

  create(input: CreateDeferralInput): AccountingDeferral {
    if (input.totalAmount <= 0) {
      throw new Error("Deferral totalAmount must be positive");
    }
    if (input.schedulePeriodIds.length === 0) {
      throw new Error("Deferral requires at least one schedule period");
    }

    const amounts =
      input.scheduleAmounts ??
      this.splitEvenly(input.totalAmount, input.schedulePeriodIds.length);

    if (amounts.length !== input.schedulePeriodIds.length) {
      throw new Error("scheduleAmounts length must match schedulePeriodIds");
    }
    const sum = amounts.reduce((s, a) => s + a, 0);
    if (Math.abs(sum - input.totalAmount) > 0.01) {
      throw new Error(
        `Schedule amounts (${sum}) must equal totalAmount (${input.totalAmount})`
      );
    }

    const dimensions = input.dimensions ?? emptyDimensions();

    // Setup entry: move cash/expense into deferral balance sheet account
    const setupLines =
      input.kind === "revenue"
        ? [
            {
              accountId: input.offsetAccountId,
              debit: input.totalAmount,
              credit: 0,
            },
            {
              accountId: input.deferralAccountId,
              debit: 0,
              credit: input.totalAmount,
            },
          ]
        : [
            {
              accountId: input.deferralAccountId,
              debit: input.totalAmount,
              credit: 0,
            },
            {
              accountId: input.offsetAccountId,
              debit: 0,
              credit: input.totalAmount,
            },
          ];

    const setup = this.posting.draftJournal({
      journalType: "adjustment",
      periodId: input.setupPeriodId,
      memo: `Deferral setup (${input.kind}): ${input.description}`,
      currency: input.currency ?? "USD",
      dimensions,
      createdBy: input.actorId,
      lines: setupLines,
    });
    this.posting.postJournal(setup.id, {
      actorId: input.actorId,
      skipDuplicateCheck: true,
    });

    const schedule: AccountingDeferralScheduleEntry[] =
      input.schedulePeriodIds.map((periodId, i) => ({
        periodId,
        amount: amounts[i],
        recognized: false,
        recognizedAt: null,
        journalId: null,
      }));

    const deferral: AccountingDeferral = {
      id: this.createId("deferral"),
      kind: input.kind,
      description: input.description,
      totalAmount: input.totalAmount,
      remainingBalance: input.totalAmount,
      currency: input.currency ?? "USD",
      deferralAccountId: input.deferralAccountId,
      recognitionAccountId: input.recognitionAccountId,
      schedule,
      dimensions,
      createdAt: this.now().toISOString(),
      metadata: input.metadata,
    };
    this.deferrals.set(deferral.id, deferral);

    this.audit.record({
      kind: "deferral",
      entityId: deferral.id,
      entityType: "AccountingDeferral",
      action: "create",
      actorId: input.actorId,
      dimensions,
      details: { kind: input.kind, setupJournalId: setup.id },
    });

    return deferral;
  }

  /** Recognize the next unrecognized schedule entry for a period. */
  recognize(
    deferralId: string,
    periodId: string,
    actorId?: string | null
  ): AccountingDeferral {
    const deferral = this.require(deferralId);
    const idx = deferral.schedule.findIndex(
      (s) => s.periodId === periodId && !s.recognized
    );
    if (idx < 0) {
      throw new Error(
        `No unrecognized schedule entry for deferral ${deferralId} in period ${periodId}`
      );
    }
    const entry = deferral.schedule[idx];

    const lines =
      deferral.kind === "revenue"
        ? [
            {
              accountId: deferral.deferralAccountId,
              debit: entry.amount,
              credit: 0,
            },
            {
              accountId: deferral.recognitionAccountId,
              debit: 0,
              credit: entry.amount,
            },
          ]
        : [
            {
              accountId: deferral.recognitionAccountId,
              debit: entry.amount,
              credit: 0,
            },
            {
              accountId: deferral.deferralAccountId,
              debit: 0,
              credit: entry.amount,
            },
          ];

    const draft = this.posting.draftJournal({
      journalType: "adjustment",
      periodId,
      memo: `Deferral recognition: ${deferral.description}`,
      currency: deferral.currency,
      dimensions: deferral.dimensions,
      createdBy: actorId,
      lines,
    });
    const posted = this.posting.postJournal(draft.id, {
      actorId,
      skipDuplicateCheck: true,
    });

    const schedule = deferral.schedule.map((s, i) =>
      i === idx
        ? {
            ...s,
            recognized: true,
            recognizedAt: this.now().toISOString(),
            journalId: posted.id,
          }
        : s
    );

    const updated: AccountingDeferral = {
      ...deferral,
      schedule,
      remainingBalance: Math.max(0, deferral.remainingBalance - entry.amount),
    };
    this.deferrals.set(deferralId, updated);

    this.audit.record({
      kind: "deferral",
      entityId: deferralId,
      entityType: "AccountingDeferral",
      action: "recognize",
      actorId,
      dimensions: deferral.dimensions,
      details: { periodId, journalId: posted.id, amount: entry.amount },
    });

    return updated;
  }

  get(id: string): AccountingDeferral | undefined {
    return this.deferrals.get(id);
  }

  list(kind?: AccountingDeferralKind): AccountingDeferral[] {
    const all = [...this.deferrals.values()];
    return kind ? all.filter((d) => d.kind === kind) : all;
  }

  private splitEvenly(total: number, n: number): number[] {
    const base = Math.floor((total / n) * 100) / 100;
    const amounts = Array.from({ length: n }, () => base);
    const remainder = Math.round((total - base * n) * 100) / 100;
    amounts[n - 1] = Math.round((amounts[n - 1] + remainder) * 100) / 100;
    return amounts;
  }

  private require(id: string): AccountingDeferral {
    const d = this.deferrals.get(id);
    if (!d) throw new Error(`Deferral not found: ${id}`);
    return d;
  }
}

export function createAccountingDeferrals(
  deps: AccountingDeferralsDependencies
): AccountingDeferrals {
  return new AccountingDeferrals(deps);
}
