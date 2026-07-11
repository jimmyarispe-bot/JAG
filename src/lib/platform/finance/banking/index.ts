/**
 * Enterprise Financial Intelligence Engine — Banking.
 *
 * Bank accounts, deposits, withdrawals, transfers, reconciliation, bank feeds.
 */

import { createFinanceId } from "@/lib/platform/finance/ids";
import type {
  FinanceBankAccount,
  FinanceBankAccountType,
  FinanceBankTransaction,
  FinanceBankTransactionType,
  FinanceDimensionalContext,
  FinanceMetadata,
} from "@/lib/platform/finance/types";
import { emptyDimensions } from "@/lib/platform/finance/types";

// ---------------------------------------------------------------------------
// Bank feed adapter abstraction
// ---------------------------------------------------------------------------

export interface BankFeedAdapter {
  fetchTransactions(
    accountId: string,
    since: string
  ): Promise<FinanceBankTransaction[]>;
}

export class InMemoryBankFeedAdapter implements BankFeedAdapter {
  async fetchTransactions(
    _accountId: string,
    _since: string
  ): Promise<FinanceBankTransaction[]> {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Banking service
// ---------------------------------------------------------------------------

export interface CreateBankAccountInput {
  name: string;
  type: FinanceBankAccountType;
  bankName: string;
  accountNumber: string;
  routingNumber?: string | null;
  currency?: string;
  openingBalance?: number;
  glAccountId?: string | null;
  dimensions?: FinanceDimensionalContext;
  metadata?: FinanceMetadata;
}

export interface DepositInput {
  bankAccountId: string;
  amount: number;
  currency?: string;
  memo: string;
  externalRef?: string | null;
  dimensions: FinanceDimensionalContext;
  metadata?: FinanceMetadata;
}

export interface WithdrawalInput {
  bankAccountId: string;
  amount: number;
  currency?: string;
  memo: string;
  externalRef?: string | null;
  dimensions: FinanceDimensionalContext;
  metadata?: FinanceMetadata;
}

export interface TransferInput {
  fromBankAccountId: string;
  toBankAccountId: string;
  amount: number;
  currency?: string;
  memo: string;
  dimensions: FinanceDimensionalContext;
  metadata?: FinanceMetadata;
}

export interface FinanceBankingDependencies {
  feedAdapter?: BankFeedAdapter;
  createId?: (prefix: string) => string;
  now?: () => Date;
}

export class FinanceBanking {
  private readonly accounts = new Map<string, FinanceBankAccount>();
  private readonly transactions = new Map<string, FinanceBankTransaction>();
  private readonly feedAdapter: BankFeedAdapter;
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;

  constructor(deps?: FinanceBankingDependencies) {
    this.feedAdapter = deps?.feedAdapter ?? new InMemoryBankFeedAdapter();
    this.createId = deps?.createId ?? ((prefix) => createFinanceId(prefix));
    this.now = deps?.now ?? (() => new Date());
  }

  // ---------------------------------------------------------------------------
  // Accounts
  // ---------------------------------------------------------------------------

  createBankAccount(input: CreateBankAccountInput): FinanceBankAccount {
    const id = this.createId("bank");
    const account: FinanceBankAccount = {
      id,
      name: input.name,
      type: input.type,
      bankName: input.bankName,
      accountNumber: input.accountNumber,
      routingNumber: input.routingNumber ?? null,
      currency: input.currency ?? "USD",
      isActive: true,
      currentBalance: input.openingBalance ?? 0,
      lastReconciledDate: null,
      glAccountId: input.glAccountId ?? null,
      dimensions: input.dimensions ?? emptyDimensions(),
      createdAt: this.now().toISOString(),
      metadata: input.metadata,
    };
    this.accounts.set(id, account);
    return account;
  }

  getBankAccount(id: string): FinanceBankAccount | undefined {
    return this.accounts.get(id);
  }

  listBankAccounts(): FinanceBankAccount[] {
    return [...this.accounts.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  // ---------------------------------------------------------------------------
  // Transactions
  // ---------------------------------------------------------------------------

  deposit(input: DepositInput): FinanceBankTransaction {
    return this.recordTransaction({
      bankAccountId: input.bankAccountId,
      type: "deposit",
      amount: input.amount,
      currency: input.currency ?? "USD",
      memo: input.memo,
      externalRef: input.externalRef ?? null,
      dimensions: input.dimensions,
      metadata: input.metadata,
      balanceDelta: +input.amount,
    });
  }

  withdraw(input: WithdrawalInput): FinanceBankTransaction {
    return this.recordTransaction({
      bankAccountId: input.bankAccountId,
      type: "withdrawal",
      amount: input.amount,
      currency: input.currency ?? "USD",
      memo: input.memo,
      externalRef: input.externalRef ?? null,
      dimensions: input.dimensions,
      metadata: input.metadata,
      balanceDelta: -input.amount,
    });
  }

  transfer(input: TransferInput): {
    debit: FinanceBankTransaction;
    credit: FinanceBankTransaction;
  } {
    const currency = input.currency ?? "USD";
    const debit = this.recordTransaction({
      bankAccountId: input.fromBankAccountId,
      type: "transfer",
      amount: input.amount,
      currency,
      memo: `Transfer out: ${input.memo}`,
      externalRef: null,
      dimensions: input.dimensions,
      metadata: input.metadata,
      balanceDelta: -input.amount,
    });
    const credit = this.recordTransaction({
      bankAccountId: input.toBankAccountId,
      type: "transfer",
      amount: input.amount,
      currency,
      memo: `Transfer in: ${input.memo}`,
      externalRef: null,
      dimensions: input.dimensions,
      metadata: input.metadata,
      balanceDelta: +input.amount,
    });
    return { debit, credit };
  }

  reconcile(bankAccountId: string, transactionId: string): FinanceBankTransaction {
    const txn = this.transactions.get(transactionId);
    if (!txn) throw new Error(`Bank transaction not found: ${transactionId}`);
    if (txn.bankAccountId !== bankAccountId) {
      throw new Error(
        `Transaction ${transactionId} does not belong to account ${bankAccountId}`
      );
    }
    const updated: FinanceBankTransaction = {
      ...txn,
      isReconciled: true,
      reconciledAt: this.now().toISOString(),
    };
    this.transactions.set(transactionId, updated);

    // Update account's lastReconciledDate
    const acct = this.accounts.get(bankAccountId);
    if (acct) {
      this.accounts.set(bankAccountId, {
        ...acct,
        lastReconciledDate: updated.reconciledAt,
      });
    }
    return updated;
  }

  getTransaction(id: string): FinanceBankTransaction | undefined {
    return this.transactions.get(id);
  }

  listTransactions(bankAccountId?: string): FinanceBankTransaction[] {
    const all = [...this.transactions.values()].sort((a, b) =>
      a.timestamp.localeCompare(b.timestamp)
    );
    return bankAccountId
      ? all.filter((t) => t.bankAccountId === bankAccountId)
      : all;
  }

  getOutstandingItems(bankAccountId: string): FinanceBankTransaction[] {
    return this.listTransactions(bankAccountId).filter((t) => !t.isReconciled);
  }

  async fetchFeedTransactions(
    bankAccountId: string,
    since: string
  ): Promise<FinanceBankTransaction[]> {
    return this.feedAdapter.fetchTransactions(bankAccountId, since);
  }

  private recordTransaction(input: {
    bankAccountId: string;
    type: FinanceBankTransactionType;
    amount: number;
    currency: string;
    memo: string;
    externalRef: string | null;
    dimensions: FinanceDimensionalContext;
    metadata?: FinanceMetadata;
    balanceDelta: number;
  }): FinanceBankTransaction {
    const acct = this.accounts.get(input.bankAccountId);
    if (!acct) {
      throw new Error(`Bank account not found: ${input.bankAccountId}`);
    }

    const id = this.createId("btxn");
    const txn: FinanceBankTransaction = {
      id,
      bankAccountId: input.bankAccountId,
      transactionType: input.type,
      timestamp: this.now().toISOString(),
      dimensions: input.dimensions,
      amount: { amount: input.amount, currency: input.currency },
      memo: input.memo,
      reversedById: null,
      reversesId: null,
      externalRef: input.externalRef,
      isReconciled: false,
      reconciledAt: null,
      currency: input.currency,
      metadata: input.metadata,
    };
    this.transactions.set(id, txn);

    // Update running balance
    this.accounts.set(input.bankAccountId, {
      ...acct,
      currentBalance: acct.currentBalance + input.balanceDelta,
    });

    return txn;
  }
}

export function createFinanceBanking(
  deps?: FinanceBankingDependencies
): FinanceBanking {
  return new FinanceBanking(deps);
}
