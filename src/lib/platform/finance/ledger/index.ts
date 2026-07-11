/**
 * Enterprise Financial Intelligence Engine — General Ledger.
 *
 * Chart of accounts + double-entry journal with immutable reversal.
 * Account types: asset, liability, equity, revenue, expense.
 * Debit-normal: asset, expense. Credit-normal: liability, equity, revenue.
 */

import { createFinanceId } from "@/lib/platform/finance/ids";
import type {
  FinanceAccount,
  FinanceAccountBalance,
  FinanceAccountStatus,
  FinanceAccountType,
  FinanceDimensionalContext,
  FinanceJournalEntry,
  FinanceJournalPosting,
  FinanceMetadata,
  FinanceTrialBalance,
  FinanceTrialBalanceLine,
} from "@/lib/platform/finance/types";
import { emptyDimensions } from "@/lib/platform/finance/types";

// ---------------------------------------------------------------------------
// Chart of accounts
// ---------------------------------------------------------------------------

export interface AddAccountInput {
  code: string;
  name: string;
  type: FinanceAccountType;
  status?: FinanceAccountStatus;
  parentId?: string | null;
  description?: string;
  isControl?: boolean;
  metadata?: FinanceMetadata;
}

export interface FinanceChartOfAccountsDependencies {
  createId?: (prefix: string) => string;
  now?: () => Date;
}

const DEFAULT_CHART: AddAccountInput[] = [
  { code: "1000", name: "Cash and Cash Equivalents", type: "asset", description: "Bank accounts and cash" },
  { code: "1100", name: "Accounts Receivable", type: "asset", description: "Amounts owed by customers" },
  { code: "1200", name: "Prepaid Expenses", type: "asset", description: "Prepaid items" },
  { code: "1500", name: "Fixed Assets", type: "asset", description: "Property, plant, equipment" },
  { code: "1600", name: "Accumulated Depreciation", type: "asset", description: "Contra asset for depreciation" },
  { code: "2000", name: "Accounts Payable", type: "liability", description: "Amounts owed to vendors" },
  { code: "2100", name: "Accrued Liabilities", type: "liability", description: "Accrued expenses" },
  { code: "2200", name: "Deferred Revenue", type: "liability", description: "Advance tuition payments" },
  { code: "2500", name: "Long-Term Debt", type: "liability", description: "Loans and bonds" },
  { code: "3000", name: "Retained Earnings", type: "equity", description: "Accumulated net income" },
  { code: "3100", name: "Net Assets", type: "equity", description: "Board-designated reserves" },
  { code: "4000", name: "Tuition Revenue", type: "revenue", description: "Student tuition income" },
  { code: "4100", name: "Grant Revenue", type: "revenue", description: "Government and private grants" },
  { code: "4200", name: "Donation Revenue", type: "revenue", description: "Charitable contributions" },
  { code: "4300", name: "Other Revenue", type: "revenue", description: "Miscellaneous income" },
  { code: "5000", name: "Payroll Expense", type: "expense", description: "Salaries and wages" },
  { code: "5100", name: "Benefits Expense", type: "expense", description: "Employee benefits" },
  { code: "5200", name: "Instruction Expense", type: "expense", description: "Direct instruction costs" },
  { code: "5300", name: "Administrative Expense", type: "expense", description: "General administrative" },
  { code: "5400", name: "Facility Expense", type: "expense", description: "Rent, utilities, maintenance" },
  { code: "5500", name: "Fundraising Expense", type: "expense", description: "Development costs" },
  { code: "5600", name: "Depreciation Expense", type: "expense", description: "Asset depreciation" },
  { code: "5700", name: "Interest Expense", type: "expense", description: "Loan interest" },
];

export class FinanceChartOfAccounts {
  private readonly accounts = new Map<string, FinanceAccount>();
  private readonly byCode = new Map<string, FinanceAccount>();
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;

  constructor(deps?: FinanceChartOfAccountsDependencies) {
    this.createId = deps?.createId ?? ((prefix) => createFinanceId(prefix));
    this.now = deps?.now ?? (() => new Date());
    this.seedDefaults();
  }

  private seedDefaults(): void {
    for (const input of DEFAULT_CHART) {
      this.addAccount(input);
    }
  }

  addAccount(input: AddAccountInput): FinanceAccount {
    const id = this.createId("acct");
    const account: FinanceAccount = {
      id,
      code: input.code,
      name: input.name,
      type: input.type,
      status: input.status ?? "active",
      parentId: input.parentId ?? null,
      description: input.description ?? "",
      isControl: input.isControl ?? false,
      createdAt: this.now().toISOString(),
      metadata: input.metadata,
    };
    this.accounts.set(id, account);
    this.byCode.set(input.code, account);
    return account;
  }

  getAccount(id: string): FinanceAccount | undefined {
    return this.accounts.get(id);
  }

  findByCode(code: string): FinanceAccount | undefined {
    return this.byCode.get(code);
  }

  listAccounts(): FinanceAccount[] {
    return [...this.accounts.values()].sort((a, b) =>
      a.code.localeCompare(b.code)
    );
  }

  listByType(type: FinanceAccountType): FinanceAccount[] {
    return this.listAccounts().filter((a) => a.type === type);
  }
}

// ---------------------------------------------------------------------------
// General Ledger
// ---------------------------------------------------------------------------

export interface PostJournalInput {
  memo: string;
  currency?: string;
  dimensions: FinanceDimensionalContext;
  postings: Array<{
    accountId: string;
    debit: number;
    credit: number;
    memo?: string;
    dimensions?: FinanceDimensionalContext;
  }>;
  metadata?: FinanceMetadata;
}

export interface FinanceGeneralLedgerDependencies {
  coa?: FinanceChartOfAccounts;
  createId?: (prefix: string) => string;
  now?: () => Date;
}

/** Determines which balance side is normal for an account type. */
function isDebitNormal(type: FinanceAccountType): boolean {
  return type === "asset" || type === "expense";
}

export class FinanceGeneralLedger {
  private readonly journals = new Map<string, FinanceJournalEntry>();
  private readonly coa: FinanceChartOfAccounts;
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;
  private journalSequence = 0;

  constructor(deps?: FinanceGeneralLedgerDependencies) {
    this.coa = deps?.coa ?? new FinanceChartOfAccounts();
    this.createId = deps?.createId ?? ((prefix) => createFinanceId(prefix));
    this.now = deps?.now ?? (() => new Date());
  }

  get chartOfAccounts(): FinanceChartOfAccounts {
    return this.coa;
  }

  /** Post a balanced journal entry. Throws if debits ≠ credits. */
  postJournal(input: PostJournalInput): FinanceJournalEntry {
    const totalDebit = input.postings.reduce((s, p) => s + p.debit, 0);
    const totalCredit = input.postings.reduce((s, p) => s + p.credit, 0);
    if (Math.abs(totalDebit - totalCredit) > 0.005) {
      throw new Error(
        `Journal does not balance: debits=${totalDebit} credits=${totalCredit}`
      );
    }

    this.journalSequence += 1;
    const id = this.createId("je");
    const journalNumber = `JE-${String(this.journalSequence).padStart(6, "0")}`;
    const timestamp = this.now().toISOString();

    const postings: FinanceJournalPosting[] = input.postings.map((p, i) => ({
      id: this.createId("jp"),
      journalEntryId: id,
      accountId: p.accountId,
      debit: p.debit,
      credit: p.credit,
      dimensions: p.dimensions ?? input.dimensions,
      memo: p.memo ?? `${input.memo} (line ${i + 1})`,
    }));

    const entry: FinanceJournalEntry = {
      id,
      journalNumber,
      timestamp,
      dimensions: input.dimensions,
      amount: {
        amount: totalDebit,
        currency: input.currency ?? "USD",
      },
      memo: input.memo,
      reversedById: null,
      reversesId: null,
      status: "posted",
      postings,
      currency: input.currency ?? "USD",
      metadata: input.metadata,
    };

    this.journals.set(id, entry);
    return entry;
  }

  /**
   * Reverse a posted journal entry by creating a new entry with swapped debits/credits.
   * Marks both entries as reversed. Immutable — original is never deleted.
   */
  reverseJournal(
    journalId: string,
    memo: string,
    dimensions?: FinanceDimensionalContext
  ): FinanceJournalEntry {
    const original = this.journals.get(journalId);
    if (!original) {
      throw new Error(`Journal entry not found: ${journalId}`);
    }
    if (original.status === "reversed") {
      throw new Error(`Journal entry ${journalId} is already reversed`);
    }

    this.journalSequence += 1;
    const reversalId = this.createId("je");
    const journalNumber = `JE-${String(this.journalSequence).padStart(6, "0")}-REV`;
    const timestamp = this.now().toISOString();
    const dims = dimensions ?? original.dimensions;

    const reversedPostings: FinanceJournalPosting[] = original.postings.map((p) => ({
      id: this.createId("jp"),
      journalEntryId: reversalId,
      accountId: p.accountId,
      debit: p.credit,
      credit: p.debit,
      dimensions: dims,
      memo: `Reversal: ${p.memo}`,
    }));

    const reversal: FinanceJournalEntry = {
      id: reversalId,
      journalNumber,
      timestamp,
      dimensions: dims,
      amount: original.amount,
      memo,
      reversedById: null,
      reversesId: journalId,
      status: "posted",
      postings: reversedPostings,
      currency: original.currency,
    };

    this.journals.set(reversalId, reversal);

    // Mark original as reversed (immutable update — replace, not mutate)
    const updated: FinanceJournalEntry = {
      ...original,
      status: "reversed",
      reversedById: reversalId,
    };
    this.journals.set(journalId, updated);

    return reversal;
  }

  getJournal(id: string): FinanceJournalEntry | undefined {
    return this.journals.get(id);
  }

  listJournals(): FinanceJournalEntry[] {
    return [...this.journals.values()].sort((a, b) =>
      a.timestamp.localeCompare(b.timestamp)
    );
  }

  /**
   * Compute the running balance for an account from all posted journal entries.
   */
  getBalance(accountId: string): FinanceAccountBalance {
    const account = this.coa.getAccount(accountId);
    let totalDebit = 0;
    let totalCredit = 0;

    for (const journal of this.journals.values()) {
      for (const posting of journal.postings) {
        if (posting.accountId === accountId) {
          totalDebit += posting.debit;
          totalCredit += posting.credit;
        }
      }
    }

    const debitNormal = account ? isDebitNormal(account.type) : true;
    const normalBalance = debitNormal
      ? totalDebit - totalCredit
      : totalCredit - totalDebit;

    return {
      accountId,
      accountCode: account?.code ?? "",
      accountName: account?.name ?? accountId,
      accountType: account?.type ?? "asset",
      debitBalance: totalDebit,
      creditBalance: totalCredit,
      normalBalance,
    };
  }

  /** Generate a trial balance across all accounts. */
  getTrialBalance(asOfDate?: string, currency = "USD"): FinanceTrialBalance {
    const accounts = this.coa.listAccounts();

    // Aggregate postings per account
    const debitTotals = new Map<string, number>();
    const creditTotals = new Map<string, number>();

    for (const journal of this.journals.values()) {
      for (const posting of journal.postings) {
        debitTotals.set(
          posting.accountId,
          (debitTotals.get(posting.accountId) ?? 0) + posting.debit
        );
        creditTotals.set(
          posting.accountId,
          (creditTotals.get(posting.accountId) ?? 0) + posting.credit
        );
      }
    }

    const lines: FinanceTrialBalanceLine[] = accounts
      .filter((a) => {
        const d = debitTotals.get(a.id) ?? 0;
        const c = creditTotals.get(a.id) ?? 0;
        return d > 0 || c > 0;
      })
      .map((a) => {
        const d = debitTotals.get(a.id) ?? 0;
        const c = creditTotals.get(a.id) ?? 0;
        const debitNormal = isDebitNormal(a.type);
        return {
          accountId: a.id,
          accountCode: a.code,
          accountName: a.name,
          accountType: a.type,
          debitBalance: debitNormal ? Math.max(d - c, 0) : 0,
          creditBalance: !debitNormal ? Math.max(c - d, 0) : 0,
        };
      });

    const totalDebits = lines.reduce((s, l) => s + l.debitBalance, 0);
    const totalCredits = lines.reduce((s, l) => s + l.creditBalance, 0);

    return {
      asOfDate: asOfDate ?? new Date().toISOString().split("T")[0],
      currency,
      lines,
      totalDebits,
      totalCredits,
      isBalanced: Math.abs(totalDebits - totalCredits) < 0.01,
    };
  }
}

export function createFinanceGeneralLedger(
  deps?: FinanceGeneralLedgerDependencies
): FinanceGeneralLedger {
  return new FinanceGeneralLedger(deps);
}

export function createFinanceChartOfAccounts(
  deps?: FinanceChartOfAccountsDependencies
): FinanceChartOfAccounts {
  return new FinanceChartOfAccounts(deps);
}

/** Helper: construct an empty dimensional context. */
export { emptyDimensions };
