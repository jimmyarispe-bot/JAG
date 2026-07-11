/**
 * Enterprise Financial Intelligence Engine — Debt Management.
 *
 * Loans, amortization schedules, payment tracking, covenant monitoring.
 */

import { createFinanceId } from "@/lib/platform/finance/ids";
import type {
  FinanceDimensionalContext,
  FinanceLoan,
  FinanceLoanCovenant,
  FinanceLoanScheduleEntry,
  FinanceLoanStatus,
  FinanceMetadata,
} from "@/lib/platform/finance/types";
import { emptyDimensions } from "@/lib/platform/finance/types";

export interface AddLoanInput {
  lenderName: string;
  principalAmount: number;
  interestRate: number;
  termMonths: number;
  startDate: string;
  currency?: string;
  dimensions?: FinanceDimensionalContext;
  covenants?: Array<{
    name: string;
    description: string;
    threshold: number;
  }>;
  metadata?: FinanceMetadata;
}

export interface FinanceDebtDependencies {
  createId?: (prefix: string) => string;
  now?: () => Date;
}

/** Calculate monthly payment using standard annuity formula. */
function calcMonthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number
): number {
  if (annualRate === 0) return principal / termMonths;
  const r = annualRate / 12;
  return (principal * r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
}

/** Generate amortization schedule. */
function buildSchedule(
  principal: number,
  annualRate: number,
  termMonths: number,
  startDate: string
): FinanceLoanScheduleEntry[] {
  const monthlyPayment = calcMonthlyPayment(principal, annualRate, termMonths);
  const monthlyRate = annualRate / 12;
  const schedule: FinanceLoanScheduleEntry[] = [];
  let balance = principal;
  const start = new Date(startDate);

  for (let n = 1; n <= termMonths; n++) {
    const interest = balance * monthlyRate;
    const principalPortion = Math.min(monthlyPayment - interest, balance);
    balance = Math.max(balance - principalPortion, 0);

    const dueDate = new Date(start);
    dueDate.setMonth(dueDate.getMonth() + n);

    schedule.push({
      paymentNumber: n,
      dueDate: dueDate.toISOString().split("T")[0],
      principalAmount: principalPortion,
      interestAmount: interest,
      totalPayment: principalPortion + interest,
      remainingBalance: balance,
      isPaid: false,
      paidDate: null,
    });
  }
  return schedule;
}

/** Add months to a date string and return ISO date string. */
function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
}

export class FinanceDebt {
  private readonly loans = new Map<string, FinanceLoan>();
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;

  constructor(deps?: FinanceDebtDependencies) {
    this.createId = deps?.createId ?? ((prefix) => createFinanceId(prefix));
    this.now = deps?.now ?? (() => new Date());
  }

  addLoan(input: AddLoanInput): FinanceLoan {
    const id = this.createId("loan");
    const schedule = buildSchedule(
      input.principalAmount,
      input.interestRate,
      input.termMonths,
      input.startDate
    );

    const covenants: FinanceLoanCovenant[] = (input.covenants ?? []).map((c) => ({
      id: this.createId("cov"),
      loanId: id,
      name: c.name,
      description: c.description,
      threshold: c.threshold,
      currentValue: null,
      isBreached: false,
      checkedAt: null,
    }));

    const maturityDate = addMonths(input.startDate, input.termMonths);

    const loan: FinanceLoan = {
      id,
      lenderName: input.lenderName,
      principalAmount: input.principalAmount,
      outstandingBalance: input.principalAmount,
      interestRate: input.interestRate,
      termMonths: input.termMonths,
      startDate: input.startDate,
      maturityDate,
      status: "active",
      schedule,
      covenants,
      currency: input.currency ?? "USD",
      dimensions: input.dimensions ?? emptyDimensions(),
      createdAt: this.now().toISOString(),
      metadata: input.metadata,
    };
    this.loans.set(id, loan);
    return loan;
  }

  getLoan(id: string): FinanceLoan | undefined {
    return this.loans.get(id);
  }

  listLoans(): FinanceLoan[] {
    return [...this.loans.values()].sort((a, b) =>
      a.startDate.localeCompare(b.startDate)
    );
  }

  /** Mark a scheduled payment as paid. Updates outstanding balance. */
  recordLoanPayment(loanId: string, paymentNumber: number): FinanceLoan {
    const loan = this.getLoanOrThrow(loanId);
    const updatedSchedule = loan.schedule.map((entry) => {
      if (entry.paymentNumber !== paymentNumber) return entry;
      return {
        ...entry,
        isPaid: true,
        paidDate: this.now().toISOString().split("T")[0],
      };
    });

    const paidEntry = loan.schedule.find(
      (e) => e.paymentNumber === paymentNumber
    );
    const newBalance = paidEntry
      ? paidEntry.remainingBalance
      : loan.outstandingBalance;

    const allPaid = updatedSchedule.every((e) => e.isPaid);
    const status: FinanceLoanStatus = allPaid ? "paid_off" : loan.status;

    const updated: FinanceLoan = {
      ...loan,
      schedule: updatedSchedule,
      outstandingBalance: newBalance,
      status,
    };
    this.loans.set(loanId, updated);
    return updated;
  }

  getPaymentSchedule(loanId: string): FinanceLoanScheduleEntry[] {
    return this.getLoanOrThrow(loanId).schedule;
  }

  getNextPayment(loanId: string): FinanceLoanScheduleEntry | undefined {
    return this.getLoanOrThrow(loanId).schedule.find((e) => !e.isPaid);
  }

  /** Check covenants against provided metric values. Updates breach status. */
  checkCovenants(
    loanId: string,
    values: Record<string, number>
  ): FinanceLoan {
    const loan = this.getLoanOrThrow(loanId);
    const updatedCovenants = loan.covenants.map((cov) => {
      const currentValue = values[cov.name] ?? cov.currentValue;
      const isBreached =
        currentValue !== null && currentValue !== undefined
          ? currentValue < cov.threshold
          : cov.isBreached;
      return {
        ...cov,
        currentValue: currentValue ?? cov.currentValue,
        isBreached,
        checkedAt: this.now().toISOString(),
      };
    });

    const updated: FinanceLoan = { ...loan, covenants: updatedCovenants };
    this.loans.set(loanId, updated);
    return updated;
  }

  /** Total outstanding debt across all active loans. */
  getTotalOutstandingDebt(): number {
    return this.listLoans()
      .filter((l) => l.status === "active")
      .reduce((s, l) => s + l.outstandingBalance, 0);
  }

  /** List breached covenants across all loans. */
  getBreachedCovenants(): Array<{ loan: FinanceLoan; covenant: FinanceLoanCovenant }> {
    const result: Array<{ loan: FinanceLoan; covenant: FinanceLoanCovenant }> = [];
    for (const loan of this.loans.values()) {
      for (const cov of loan.covenants) {
        if (cov.isBreached) result.push({ loan, covenant: cov });
      }
    }
    return result;
  }

  private getLoanOrThrow(id: string): FinanceLoan {
    const l = this.loans.get(id);
    if (!l) throw new Error(`Loan not found: ${id}`);
    return l;
  }
}

export function createFinanceDebt(
  deps?: FinanceDebtDependencies
): FinanceDebt {
  return new FinanceDebt(deps);
}
