/**
 * Accounting Intelligence — Retained Earnings / Year-End Close Entries.
 *
 * Closes revenue and expense into retained earnings via posting engine.
 */

import { createAccountingId } from "@/lib/platform/accounting/ids";
import type { AccountingAudit } from "@/lib/platform/accounting/audit";
import type { AccountingPosting } from "@/lib/platform/accounting/posting";
import type {
  AccountingMetadata,
  AccountingRetainedEarningsEntry,
} from "@/lib/platform/accounting/types";
import type { FinanceGeneralLedger } from "@/lib/platform/finance/ledger";
import { emptyDimensions } from "@/lib/platform/finance/types";

export interface AccountingRetainedEarningsDependencies {
  posting: AccountingPosting;
  gl: FinanceGeneralLedger;
  audit: AccountingAudit;
  createId?: (prefix: string) => string;
  now?: () => Date;
}

export interface CloseToRetainedEarningsInput {
  fiscalYear: number;
  periodId: string;
  retainedEarningsAccountId: string;
  currency?: string;
  organizationId?: string | null;
  actorId?: string | null;
  metadata?: AccountingMetadata;
}

export class AccountingRetainedEarnings {
  private readonly entries = new Map<string, AccountingRetainedEarningsEntry>();
  private readonly posting: AccountingPosting;
  private readonly gl: FinanceGeneralLedger;
  private readonly audit: AccountingAudit;
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;

  constructor(deps: AccountingRetainedEarningsDependencies) {
    this.posting = deps.posting;
    this.gl = deps.gl;
    this.audit = deps.audit;
    this.createId = deps.createId ?? ((prefix) => createAccountingId(prefix));
    this.now = deps.now ?? (() => new Date());
  }

  /**
   * Close revenue (debit) and expense (credit) into retained earnings.
   * Net income = revenue − expense credited (or debited if loss) to RE.
   */
  closeYear(input: CloseToRetainedEarningsInput): AccountingRetainedEarningsEntry {
    const coa = this.gl.chartOfAccounts;
    const revenueAccounts = coa.listByType("revenue");
    const expenseAccounts = coa.listByType("expense");

    let totalRevenue = 0;
    let totalExpense = 0;
    const lines: Array<{
      accountId: string;
      debit: number;
      credit: number;
      memo: string;
    }> = [];

    for (const acct of revenueAccounts) {
      const bal = this.gl.getBalance(acct.id);
      if (bal.normalBalance === 0) continue;
      totalRevenue += bal.normalBalance;
      lines.push({
        accountId: acct.id,
        debit: bal.normalBalance,
        credit: 0,
        memo: `Close revenue ${acct.code}`,
      });
    }

    for (const acct of expenseAccounts) {
      const bal = this.gl.getBalance(acct.id);
      if (bal.normalBalance === 0) continue;
      totalExpense += bal.normalBalance;
      lines.push({
        accountId: acct.id,
        debit: 0,
        credit: bal.normalBalance,
        memo: `Close expense ${acct.code}`,
      });
    }

    const netIncome = totalRevenue - totalExpense;
    if (netIncome >= 0) {
      lines.push({
        accountId: input.retainedEarningsAccountId,
        debit: 0,
        credit: netIncome,
        memo: "Close net income to retained earnings",
      });
    } else {
      lines.push({
        accountId: input.retainedEarningsAccountId,
        debit: Math.abs(netIncome),
        credit: 0,
        memo: "Close net loss to retained earnings",
      });
    }

    if (lines.length < 2) {
      throw new Error("Nothing to close — no revenue or expense balances");
    }

    const dimensions = emptyDimensions({
      organizationId: input.organizationId ?? null,
    });

    const draft = this.posting.draftJournal({
      journalType: "closing",
      periodId: input.periodId,
      memo: `Year-end close FY${input.fiscalYear}`,
      currency: input.currency ?? "USD",
      dimensions,
      createdBy: input.actorId,
      lines,
    });
    const posted = this.posting.postJournal(draft.id, {
      actorId: input.actorId,
      skipDuplicateCheck: true,
    });

    const entry: AccountingRetainedEarningsEntry = {
      id: this.createId("re"),
      fiscalYear: input.fiscalYear,
      periodId: input.periodId,
      netIncome,
      closingJournalId: posted.id,
      currency: input.currency ?? "USD",
      createdAt: this.now().toISOString(),
    };
    this.entries.set(entry.id, entry);

    this.audit.record({
      kind: "close",
      entityId: entry.id,
      entityType: "AccountingRetainedEarningsEntry",
      action: "year_end_close",
      actorId: input.actorId,
      dimensions,
      details: {
        fiscalYear: input.fiscalYear,
        netIncome,
        journalId: posted.id,
      },
      metadata: input.metadata,
    });

    return entry;
  }

  list(): AccountingRetainedEarningsEntry[] {
    return [...this.entries.values()];
  }

  get(id: string): AccountingRetainedEarningsEntry | undefined {
    return this.entries.get(id);
  }
}

export function createAccountingRetainedEarnings(
  deps: AccountingRetainedEarningsDependencies
): AccountingRetainedEarnings {
  return new AccountingRetainedEarnings(deps);
}
