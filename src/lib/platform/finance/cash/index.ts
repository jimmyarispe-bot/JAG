/**
 * Enterprise Financial Intelligence Engine — Cash Management.
 *
 * Cash flow items, forecasting, runway, reserves, liquidity metrics.
 */

import { createFinanceId } from "@/lib/platform/finance/ids";
import type {
  FinanceCashFlowCategory,
  FinanceCashFlowItem,
  FinanceCashForecast,
  FinanceDimensionalContext,
  FinanceMetadata,
} from "@/lib/platform/finance/types";
import { emptyDimensions } from "@/lib/platform/finance/types";

export interface RecordCashFlowInput {
  category: FinanceCashFlowCategory;
  description: string;
  amount: number;
  currency?: string;
  date: string;
  dimensions?: FinanceDimensionalContext;
  metadata?: FinanceMetadata;
}

export interface FinanceCashManagementDependencies {
  createId?: (prefix: string) => string;
  now?: () => Date;
}

export class FinanceCashManagement {
  private readonly cashFlowItems = new Map<string, FinanceCashFlowItem>();
  private readonly forecasts = new Map<string, FinanceCashForecast>();
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;

  constructor(deps?: FinanceCashManagementDependencies) {
    this.createId = deps?.createId ?? ((prefix) => createFinanceId(prefix));
    this.now = deps?.now ?? (() => new Date());
  }

  recordCashFlow(input: RecordCashFlowInput): FinanceCashFlowItem {
    const id = this.createId("cf");
    const item: FinanceCashFlowItem = {
      id,
      category: input.category,
      description: input.description,
      amount: input.amount,
      currency: input.currency ?? "USD",
      date: input.date,
      dimensions: input.dimensions ?? emptyDimensions(),
    };
    this.cashFlowItems.set(id, item);
    return item;
  }

  listCashFlowItems(): FinanceCashFlowItem[] {
    return [...this.cashFlowItems.values()].sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }

  listByCategory(category: FinanceCashFlowCategory): FinanceCashFlowItem[] {
    return this.listCashFlowItems().filter((i) => i.category === category);
  }

  /**
   * Generate a cash forecast from provided starting balance and recorded items.
   * Items with positive amount = inflow; negative = outflow.
   */
  generateForecast(
    startingBalance: number,
    horizonDays: number,
    currency = "USD"
  ): FinanceCashForecast {
    const now = this.now();
    const endDate = new Date(now.getTime() + horizonDays * 24 * 60 * 60 * 1000);

    const futureItems = this.listCashFlowItems().filter((i) => {
      const d = new Date(i.date);
      return d >= now && d <= endDate;
    });

    const projectedInflows = futureItems
      .filter((i) => i.amount > 0)
      .reduce((s, i) => s + i.amount, 0);
    const projectedOutflows = futureItems
      .filter((i) => i.amount < 0)
      .reduce((s, i) => s + Math.abs(i.amount), 0);

    const projectedEndBalance =
      startingBalance + projectedInflows - projectedOutflows;
    const dailyBurnRate = horizonDays > 0 ? projectedOutflows / horizonDays : 0;
    const runwayDays =
      dailyBurnRate > 0 ? Math.floor(startingBalance / dailyBurnRate) : 99999;

    const id = this.createId("forecast");
    const forecast: FinanceCashForecast = {
      id,
      generatedAt: now.toISOString(),
      horizonDays,
      startingBalance,
      projectedInflows,
      projectedOutflows,
      projectedEndBalance,
      currency,
      runwayDays,
      dailyBurnRate,
    };
    this.forecasts.set(id, forecast);
    return forecast;
  }

  /**
   * Cash runway in days = currentCash / dailyBurnRate.
   * Returns 99999 if burn rate is zero.
   */
  getCashRunway(currentCash: number, monthlyBurn: number): number {
    if (monthlyBurn <= 0) return 99999;
    const dailyBurn = monthlyBurn / 30;
    return Math.floor(currentCash / dailyBurn);
  }

  /**
   * Days Cash On Hand = cash / (annualExpenses / 365).
   * Returns 99999 if expenses are zero.
   */
  getDaysCashOnHand(currentCash: number, dailyExpenses: number): number {
    if (dailyExpenses <= 0) return 99999;
    return Math.floor(currentCash / dailyExpenses);
  }

  /** Minimum recommended cash reserve (3 months of expenses). */
  getReserveTarget(monthlyExpenses: number): number {
    return monthlyExpenses * 3;
  }

  /** Liquidity surplus/deficit vs. reserve target. */
  getLiquidityPosition(
    currentCash: number,
    monthlyExpenses: number
  ): { surplus: number; adequate: boolean } {
    const target = this.getReserveTarget(monthlyExpenses);
    const surplus = currentCash - target;
    return { surplus, adequate: surplus >= 0 };
  }

  listForecasts(): FinanceCashForecast[] {
    return [...this.forecasts.values()].sort((a, b) =>
      a.generatedAt.localeCompare(b.generatedAt)
    );
  }
}

export function createFinanceCashManagement(
  deps?: FinanceCashManagementDependencies
): FinanceCashManagement {
  return new FinanceCashManagement(deps);
}
