/**
 * Enterprise Financial Intelligence Engine — Budgeting.
 *
 * Departmental/program/grant budgets, actuals tracking, variance analysis.
 */

import { createFinanceId } from "@/lib/platform/finance/ids";
import type {
  FinanceBudget,
  FinanceBudgetLine,
  FinanceBudgetStatus,
  FinanceDimensionalContext,
  FinanceMetadata,
} from "@/lib/platform/finance/types";
import { emptyDimensions } from "@/lib/platform/finance/types";

export interface CreateBudgetLineInput {
  accountId: string;
  description: string;
  budgetedAmount: number;
  currency?: string;
  dimensions?: FinanceDimensionalContext;
}

export interface CreateBudgetInput {
  name: string;
  fiscalYear: number;
  periodStart: string;
  periodEnd: string;
  currency?: string;
  dimensions?: FinanceDimensionalContext;
  lines: CreateBudgetLineInput[];
  metadata?: FinanceMetadata;
}

export interface FinanceBudgetingDependencies {
  createId?: (prefix: string) => string;
  now?: () => Date;
}

function calcVariance(budgeted: number, actual: number): { variance: number; variancePercent: number } {
  const variance = budgeted - actual;
  const variancePercent = budgeted !== 0 ? (variance / budgeted) * 100 : 0;
  return { variance, variancePercent };
}

export class FinanceBudgeting {
  private readonly budgets = new Map<string, FinanceBudget>();
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;

  constructor(deps?: FinanceBudgetingDependencies) {
    this.createId = deps?.createId ?? ((prefix) => createFinanceId(prefix));
    this.now = deps?.now ?? (() => new Date());
  }

  createBudget(input: CreateBudgetInput): FinanceBudget {
    const id = this.createId("budget");
    const currency = input.currency ?? "USD";
    const dimensions = input.dimensions ?? emptyDimensions();

    const lines: FinanceBudgetLine[] = input.lines.map((l) => {
      const { variance, variancePercent } = calcVariance(l.budgetedAmount, 0);
      return {
        id: this.createId("bline"),
        budgetId: id,
        accountId: l.accountId,
        description: l.description,
        budgetedAmount: l.budgetedAmount,
        actualAmount: 0,
        variance,
        variancePercent,
        currency: l.currency ?? currency,
        dimensions: l.dimensions ?? dimensions,
      };
    });

    const totalBudgeted = lines.reduce((s, l) => s + l.budgetedAmount, 0);

    const budget: FinanceBudget = {
      id,
      name: input.name,
      fiscalYear: input.fiscalYear,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      status: "draft",
      totalBudgeted,
      totalActual: 0,
      totalVariance: totalBudgeted,
      currency,
      lines,
      dimensions,
      createdAt: this.now().toISOString(),
      metadata: input.metadata,
    };
    this.budgets.set(id, budget);
    return budget;
  }

  getBudget(id: string): FinanceBudget | undefined {
    return this.budgets.get(id);
  }

  listBudgets(): FinanceBudget[] {
    return [...this.budgets.values()].sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt)
    );
  }

  approveBudget(budgetId: string): FinanceBudget {
    return this.updateStatus(budgetId, "approved");
  }

  activateBudget(budgetId: string): FinanceBudget {
    return this.updateStatus(budgetId, "active");
  }

  closeBudget(budgetId: string): FinanceBudget {
    return this.updateStatus(budgetId, "closed");
  }

  /** Update the actual spend for a specific account line in a budget. */
  updateActuals(
    budgetId: string,
    accountId: string,
    actualAmount: number
  ): FinanceBudget {
    const budget = this.getBudgetOrThrow(budgetId);

    const updatedLines: FinanceBudgetLine[] = budget.lines.map((line) => {
      if (line.accountId !== accountId) return line;
      const { variance, variancePercent } = calcVariance(
        line.budgetedAmount,
        actualAmount
      );
      return {
        ...line,
        actualAmount,
        variance,
        variancePercent,
      };
    });

    const totalActual = updatedLines.reduce((s, l) => s + l.actualAmount, 0);
    const totalVariance = budget.totalBudgeted - totalActual;

    const updated: FinanceBudget = {
      ...budget,
      lines: updatedLines,
      totalActual,
      totalVariance,
    };
    this.budgets.set(budgetId, updated);
    return updated;
  }

  /** Get variance report (returns the budget with full line variances). */
  getVarianceReport(budgetId: string): FinanceBudget {
    return this.getBudgetOrThrow(budgetId);
  }

  /** Return lines that are over budget (actual > budgeted). */
  getOverBudgetLines(budgetId: string): FinanceBudgetLine[] {
    const budget = this.getBudgetOrThrow(budgetId);
    return budget.lines.filter((l) => l.actualAmount > l.budgetedAmount);
  }

  private getBudgetOrThrow(id: string): FinanceBudget {
    const b = this.budgets.get(id);
    if (!b) throw new Error(`Budget not found: ${id}`);
    return b;
  }

  private updateStatus(id: string, status: FinanceBudgetStatus): FinanceBudget {
    const budget = this.getBudgetOrThrow(id);
    const updated: FinanceBudget = { ...budget, status };
    this.budgets.set(id, updated);
    return updated;
  }
}

export function createFinanceBudgeting(
  deps?: FinanceBudgetingDependencies
): FinanceBudgeting {
  return new FinanceBudgeting(deps);
}
