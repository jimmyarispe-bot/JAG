/**
 * Enterprise Financial Intelligence Engine — QuickBooks Export Layer.
 *
 * EXPORT ONLY — no SDK dependency. Generates QB-compatible POJOs from
 * finance domain objects. No mutations or side effects.
 */

import type {
  FinanceAccount,
  FinanceBill,
  FinanceInvoice,
  FinanceJournalEntry,
  FinancePayment,
  FinanceVendor,
  QBAccount,
  QBBill,
  QBCustomer,
  QBExportPackage,
  QBInvoice,
  QBJournalEntry,
  QBJournalLine,
  QBPayment,
  QBVendor,
} from "@/lib/platform/finance/types";
import type { FinanceChartOfAccounts } from "@/lib/platform/finance/ledger";

export interface ExportCustomerInput {
  id: string;
  displayName: string;
  email?: string | null;
  currency?: string;
}

export interface FinanceQuickBooksExportDependencies {
  now?: () => Date;
}

export class FinanceQuickBooksExport {
  private readonly now: () => Date;

  constructor(deps?: FinanceQuickBooksExportDependencies) {
    this.now = deps?.now ?? (() => new Date());
  }

  // ---------------------------------------------------------------------------
  // Individual exporters
  // ---------------------------------------------------------------------------

  exportAccount(account: FinanceAccount, currency = "USD"): QBAccount {
    return {
      id: account.id,
      code: account.code,
      name: account.name,
      type: this.mapAccountType(account.type),
      currency,
    };
  }

  exportCustomer(input: ExportCustomerInput): QBCustomer {
    return {
      id: input.id,
      displayName: input.displayName,
      email: input.email ?? null,
      currency: input.currency ?? "USD",
    };
  }

  exportVendor(vendor: FinanceVendor): QBVendor {
    return {
      id: vendor.id,
      displayName: vendor.name,
      email: vendor.email,
      taxId: vendor.taxId,
      currency: vendor.dimensions.fundingSourceId ?? "USD",
    };
  }

  exportInvoice(invoice: FinanceInvoice, customerId?: string): QBInvoice {
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: customerId ?? invoice.customerId,
      date: invoice.timestamp.split("T")[0],
      dueDate: invoice.dueDate,
      lines: invoice.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount,
      })),
      totalAmount: invoice.amount.amount,
      balance: invoice.amount.amount - invoice.paidAmount,
      currency: invoice.currency,
    };
  }

  exportBill(bill: FinanceBill): QBBill {
    return {
      id: bill.id,
      billNumber: bill.billNumber,
      vendorId: bill.vendorId,
      date: bill.timestamp.split("T")[0],
      dueDate: bill.dueDate,
      lines: bill.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount,
      })),
      totalAmount: bill.amount.amount,
      balance: bill.amount.amount - bill.paidAmount,
      currency: bill.currency,
    };
  }

  exportPayment(
    payment: FinancePayment,
    opts?: { customerId?: string; vendorId?: string }
  ): QBPayment {
    return {
      id: payment.id,
      paymentNumber: payment.paymentNumber,
      date: payment.timestamp.split("T")[0],
      amount: payment.amount.amount,
      currency: payment.currency,
      customerId: opts?.customerId ?? null,
      vendorId: opts?.vendorId ?? null,
      method: payment.method,
    };
  }

  exportJournalEntry(
    journal: FinanceJournalEntry,
    coa?: FinanceChartOfAccounts
  ): QBJournalEntry {
    const lines: QBJournalLine[] = journal.postings.map((posting) => {
      const account = coa?.getAccount(posting.accountId);
      return {
        accountId: posting.accountId,
        accountName: account?.name ?? posting.accountId,
        debit: posting.debit,
        credit: posting.credit,
        description: posting.memo,
      };
    });
    return {
      id: journal.id,
      date: journal.timestamp.split("T")[0],
      journalNumber: journal.journalNumber,
      lines,
      currency: journal.currency,
    };
  }

  // ---------------------------------------------------------------------------
  // Full export package
  // ---------------------------------------------------------------------------

  /**
   * Build a complete QB export package from the provided data.
   * All parameters are optional — pass what you have.
   */
  exportPackage(input: {
    accounts?: FinanceAccount[];
    customers?: ExportCustomerInput[];
    vendors?: FinanceVendor[];
    invoices?: FinanceInvoice[];
    bills?: FinanceBill[];
    payments?: FinancePayment[];
    journalEntries?: FinanceJournalEntry[];
    coa?: FinanceChartOfAccounts;
    currency?: string;
  }): QBExportPackage {
    const currency = input.currency ?? "USD";
    return {
      exportedAt: this.now().toISOString(),
      accounts: (input.accounts ?? []).map((a) =>
        this.exportAccount(a, currency)
      ),
      customers: (input.customers ?? []).map((c) => this.exportCustomer(c)),
      vendors: (input.vendors ?? []).map((v) => this.exportVendor(v)),
      invoices: (input.invoices ?? []).map((i) => this.exportInvoice(i)),
      bills: (input.bills ?? []).map((b) => this.exportBill(b)),
      payments: (input.payments ?? []).map((p) => this.exportPayment(p)),
      journalEntries: (input.journalEntries ?? []).map((j) =>
        this.exportJournalEntry(j, input.coa)
      ),
    };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private mapAccountType(type: string): string {
    const map: Record<string, string> = {
      asset: "Bank",
      liability: "AccountsPayable",
      equity: "Equity",
      revenue: "Income",
      expense: "Expense",
    };
    return map[type] ?? "OtherCurrentAsset";
  }
}

export function createFinanceQuickBooksExport(
  deps?: FinanceQuickBooksExportDependencies
): FinanceQuickBooksExport {
  return new FinanceQuickBooksExport(deps);
}
