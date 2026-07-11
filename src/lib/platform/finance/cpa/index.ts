/**
 * Enterprise Financial Intelligence Engine — CPA Workpapers.
 *
 * Year-end workpapers: trial balance, GL listings, AR aging, AP aging,
 * bank reconciliation, depreciation schedule, payroll summaries,
 * grant schedules, scholarship schedules.
 */

import type { FinanceAccountsPayable } from "@/lib/platform/finance/ap";
import type { FinanceAccountsReceivable } from "@/lib/platform/finance/ar";
import type { FinanceAssets } from "@/lib/platform/finance/assets";
import type { FinanceBanking } from "@/lib/platform/finance/banking";
import type { FinanceDebt } from "@/lib/platform/finance/debt";
import type { FinanceGrants } from "@/lib/platform/finance/grants";
import type { FinanceGeneralLedger } from "@/lib/platform/finance/ledger";
import type { FinanceScholarships } from "@/lib/platform/finance/scholarships";
import type { FinanceTax } from "@/lib/platform/finance/tax";
import type {
  FinanceCPAWorkpaper,
  FinanceMetadata,
} from "@/lib/platform/finance/types";

export interface BuildWorkpapersInput {
  fiscalYear: number;
  organizationName?: string;
  gl?: FinanceGeneralLedger;
  ar?: FinanceAccountsReceivable;
  ap?: FinanceAccountsPayable;
  banking?: FinanceBanking;
  assets?: FinanceAssets;
  debt?: FinanceDebt;
  grants?: FinanceGrants;
  scholarships?: FinanceScholarships;
  tax?: FinanceTax;
  currency?: string;
  asOfDate?: string;
  metadata?: FinanceMetadata;
}

export interface FinanceCpaWorkpapersDependencies {
  now?: () => Date;
}

export class FinanceCpaWorkpapers {
  private readonly now: () => Date;

  constructor(deps?: FinanceCpaWorkpapersDependencies) {
    this.now = deps?.now ?? (() => new Date());
  }

  /**
   * Build a comprehensive year-end workpapers package.
   * Sections are populated from injected services; missing services yield empty sections.
   */
  buildWorkpapers(input: BuildWorkpapersInput): FinanceCPAWorkpaper {
    const asOfDate =
      input.asOfDate ?? `${input.fiscalYear}-12-31`;
    const currency = input.currency ?? "USD";

    const sections: Record<string, unknown> = {};

    // Trial balance
    if (input.gl) {
      sections["trialBalance"] = input.gl.getTrialBalance(asOfDate, currency);
    }

    // GL journal listing
    if (input.gl) {
      sections["journalEntries"] = input.gl.listJournals().map((j) => ({
        journalNumber: j.journalNumber,
        date: j.timestamp.split("T")[0],
        memo: j.memo,
        status: j.status,
        postings: j.postings.map((p) => ({
          accountId: p.accountId,
          debit: p.debit,
          credit: p.credit,
          memo: p.memo,
        })),
        amount: j.amount,
      }));
    }

    // AR aging
    if (input.ar) {
      sections["arAging"] = input.ar.getAging(asOfDate);
      sections["arInvoices"] = input.ar.listInvoices().map((inv) => ({
        invoiceNumber: inv.invoiceNumber,
        customerId: inv.customerId,
        date: inv.timestamp.split("T")[0],
        dueDate: inv.dueDate,
        amount: inv.amount,
        paidAmount: inv.paidAmount,
        status: inv.status,
      }));
    }

    // AP aging
    if (input.ap) {
      sections["apAging"] = input.ap.getAging(asOfDate);
      sections["apBills"] = input.ap.listBills().map((bill) => ({
        billNumber: bill.billNumber,
        vendorId: bill.vendorId,
        date: bill.timestamp.split("T")[0],
        dueDate: bill.dueDate,
        amount: bill.amount,
        paidAmount: bill.paidAmount,
        status: bill.status,
      }));
    }

    // Bank reconciliation
    if (input.banking) {
      sections["bankAccounts"] = input.banking.listBankAccounts().map((a) => ({
        name: a.name,
        bankName: a.bankName,
        currentBalance: a.currentBalance,
        lastReconciledDate: a.lastReconciledDate,
        currency: a.currency,
      }));
      sections["outstandingBankItems"] = input.banking
        .listBankAccounts()
        .flatMap((a) => input.banking!.getOutstandingItems(a.id))
        .map((t) => ({
          date: t.timestamp.split("T")[0],
          type: t.transactionType,
          amount: t.amount,
          memo: t.memo,
          isReconciled: t.isReconciled,
        }));
    }

    // Depreciation schedule
    if (input.assets) {
      sections["depreciationSchedule"] = input.assets.listAssets().map((a) => ({
        assetId: a.id,
        name: a.name,
        acquisitionDate: a.acquisitionDate,
        acquisitionCost: a.acquisitionCost,
        salvageValue: a.salvageValue,
        usefulLifeYears: a.usefulLifeYears,
        method: a.depreciationMethod,
        accumulatedDepreciation: a.accumulatedDepreciation,
        bookValue: a.bookValue,
        status: a.status,
        schedule: input.assets!.getDepreciationSchedule(a.id),
      }));
    }

    // Debt schedule
    if (input.debt) {
      sections["debtSchedule"] = input.debt.listLoans().map((l) => ({
        lenderName: l.lenderName,
        principalAmount: l.principalAmount,
        outstandingBalance: l.outstandingBalance,
        interestRate: l.interestRate,
        maturityDate: l.maturityDate,
        status: l.status,
        covenants: l.covenants,
      }));
    }

    // Grant schedules
    if (input.grants) {
      sections["grantSchedule"] = input.grants.listGrants().map((g) => ({
        name: g.name,
        grantorName: g.grantorName,
        restriction: g.restriction,
        totalAmount: g.totalAmount,
        utilizedAmount: g.utilizedAmount,
        remainingAmount: g.remainingAmount,
        periodStart: g.periodStart,
        periodEnd: g.periodEnd,
        status: g.status,
        utilization: input.grants!.getUtilization(g.id),
      }));
    }

    // Scholarship schedules
    if (input.scholarships) {
      sections["scholarshipSchedule"] = input.scholarships
        .listScholarships()
        .map((s) => ({
          name: s.name,
          fundingSourceId: s.fundingSourceId,
          totalFunding: s.totalFunding,
          awardedAmount: s.awardedAmount,
          remainingBalance: s.remainingBalance,
          status: s.status,
          utilization: input.scholarships!.getUtilization(s.id),
        }));
    }

    // Payroll summaries
    if (input.tax) {
      sections["payrollSummary"] = {
        totalW2Wages: input.tax.getTotalW2Wages(input.fiscalYear),
        total1099Compensation: input.tax.getTotal1099Compensation(
          input.fiscalYear
        ),
        w2Count: input.tax.listW2s(input.fiscalYear).length,
        form1099Count: input.tax.list1099s(input.fiscalYear).length,
        w2Records: input.tax.listW2s(input.fiscalYear).map((r) => ({
          employeeName: r.recipientName,
          amounts: r.amounts,
        })),
      };
    }

    return {
      title: `Year-End Workpapers — FY ${input.fiscalYear}${
        input.organizationName ? ` — ${input.organizationName}` : ""
      }`,
      generatedAt: this.now().toISOString(),
      fiscalYear: input.fiscalYear,
      sections,
      metadata: input.metadata,
    };
  }
}

export function createFinanceCpaWorkpapers(
  deps?: FinanceCpaWorkpapersDependencies
): FinanceCpaWorkpapers {
  return new FinanceCpaWorkpapers(deps);
}
