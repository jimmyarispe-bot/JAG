/**
 * Enterprise Financial Intelligence Engine — Executive Intelligence.
 *
 * Calculate all executive KPIs from a FinancialSnapshot.
 * No fake DB — accepts snapshot inputs, computes derived metrics.
 */

import type {
  FinanceExecutiveKPIs,
  FinancialSnapshot,
  FinanceRiskLevel,
} from "@/lib/platform/finance/types";

export interface FinanceExecutiveIntelligenceDependencies {
  now?: () => Date;
}

function safeDiv(numerator: number, denominator: number): number {
  return denominator !== 0 ? numerator / denominator : 0;
}

function pct(numerator: number, denominator: number): number {
  return safeDiv(numerator, denominator) * 100;
}

function riskLevel(
  value: number,
  thresholds: { critical: number; high: number; medium: number }
): FinanceRiskLevel {
  if (value >= thresholds.critical) return "critical";
  if (value >= thresholds.high) return "high";
  if (value >= thresholds.medium) return "medium";
  return "low";
}

export class FinanceExecutiveIntelligence {
  private readonly now: () => Date;

  constructor(deps?: FinanceExecutiveIntelligenceDependencies) {
    this.now = deps?.now ?? (() => new Date());
  }

  /** Calculate the full suite of executive KPIs from a financial snapshot. */
  calculateKPIs(snapshot: FinancialSnapshot): FinanceExecutiveKPIs {
    // ---------------------------------------------------------------------------
    // Profitability
    // ---------------------------------------------------------------------------
    const ebitda = snapshot.ebitda;
    const operatingMargin = pct(
      snapshot.totalRevenue - snapshot.totalExpenses,
      snapshot.totalRevenue
    );

    // ---------------------------------------------------------------------------
    // Liquidity
    // ---------------------------------------------------------------------------
    const dailyBurn =
      snapshot.monthlyBurnRate > 0 ? snapshot.monthlyBurnRate / 30 : 1;
    const cashRunwayDays = Math.floor(snapshot.cash / dailyBurn);
    const dailyExpenses = snapshot.totalExpenses / 365;
    const daysCashOnHand = Math.floor(safeDiv(snapshot.cash, dailyExpenses));
    const currentRatio = safeDiv(snapshot.currentAssets, snapshot.currentLiabilities);
    const quickRatio = safeDiv(
      snapshot.currentAssets - snapshot.inventory,
      snapshot.currentLiabilities
    );

    // ---------------------------------------------------------------------------
    // Growth
    // ---------------------------------------------------------------------------
    const revenueGrowth = pct(
      snapshot.totalRevenue - snapshot.priorPeriodRevenue,
      snapshot.priorPeriodRevenue
    );
    const expenseGrowth = pct(
      snapshot.totalExpenses - snapshot.priorPeriodExpenses,
      snapshot.priorPeriodExpenses
    );

    // ---------------------------------------------------------------------------
    // Revenue composition
    // ---------------------------------------------------------------------------
    const enrollmentRevenue = snapshot.tuitionRevenue;
    const grantDependency = pct(snapshot.grantRevenue, snapshot.totalRevenue);

    // ---------------------------------------------------------------------------
    // Expense ratios
    // ---------------------------------------------------------------------------
    const payrollPercent = pct(snapshot.payrollExpense, snapshot.totalExpenses);
    const instructionPercent = pct(
      snapshot.instructionExpense,
      snapshot.totalExpenses
    );
    const administrativePercent = pct(
      snapshot.administrativeExpense,
      snapshot.totalExpenses
    );
    const facilityPercent = pct(
      snapshot.facilityExpense,
      snapshot.totalExpenses
    );
    const fundraisingPercent = pct(
      snapshot.fundraisingExpense,
      snapshot.totalExpenses
    );

    // ---------------------------------------------------------------------------
    // Budget variance (revenue: positive = above budget)
    // ---------------------------------------------------------------------------
    const budgetVariance = pct(
      snapshot.totalRevenue - snapshot.budgetedRevenue,
      snapshot.budgetedRevenue
    );

    // Forecast accuracy (100% = perfect; lower = less accurate)
    const forecastAccuracy = Math.max(
      0,
      100 - Math.abs(budgetVariance)
    );

    // ---------------------------------------------------------------------------
    // Risk assessments
    // ---------------------------------------------------------------------------
    const liquidityRisk: FinanceRiskLevel = (() => {
      if (cashRunwayDays < 30 || currentRatio < 0.5) return "critical";
      if (cashRunwayDays < 60 || currentRatio < 1.0) return "high";
      if (cashRunwayDays < 90 || currentRatio < 1.5) return "medium";
      return "low";
    })();

    const collectionsRisk: FinanceRiskLevel = (() => {
      const overduePct = pct(snapshot.overdueReceivables, snapshot.totalReceivables);
      if (overduePct >= 40) return "critical";
      if (overduePct >= 25) return "high";
      if (overduePct >= 10) return "medium";
      return "low";
    })();

    const vendorRisk: FinanceRiskLevel = (() => {
      if (snapshot.criticalVendorCount === 0) return "low";
      const ratio = snapshot.criticalVendorCount / Math.max(snapshot.activeVendorCount, 1);
      if (ratio >= 0.3) return "critical";
      if (ratio >= 0.2) return "high";
      if (ratio >= 0.1) return "medium";
      return "low";
    })();

    const grantRisk: FinanceRiskLevel = (() => {
      if (grantDependency >= 80) return "critical";
      if (grantDependency >= 60) return "high";
      if (grantDependency >= 40) return "medium";
      return "low";
    })();

    return {
      asOfDate: snapshot.asOfDate,
      currency: snapshot.currency,
      ebitda,
      operatingMargin,
      cashRunwayDays,
      daysCashOnHand,
      currentRatio,
      quickRatio,
      revenueGrowth,
      expenseGrowth,
      enrollmentRevenue,
      grantDependency,
      payrollPercent,
      instructionPercent,
      administrativePercent,
      facilityPercent,
      fundraisingPercent,
      budgetVariance,
      forecastAccuracy,
      liquidityRisk,
      collectionsRisk,
      vendorRisk,
      grantRisk,
    };
  }

  /** Quick liquidity check. */
  isLiquiditySufficient(snapshot: FinancialSnapshot, minRunwayDays = 60): boolean {
    const kpis = this.calculateKPIs(snapshot);
    return kpis.cashRunwayDays >= minRunwayDays;
  }

  /** Summarize top risks as a sorted list. */
  getRiskSummary(
    snapshot: FinancialSnapshot
  ): Array<{ area: string; level: FinanceRiskLevel }> {
    const kpis = this.calculateKPIs(snapshot);
    return [
      { area: "Liquidity", level: kpis.liquidityRisk },
      { area: "Collections", level: kpis.collectionsRisk },
      { area: "Vendor Concentration", level: kpis.vendorRisk },
      { area: "Grant Dependency", level: kpis.grantRisk },
    ].sort((a, b) => {
      const order: Record<FinanceRiskLevel, number> = {
        critical: 0,
        high: 1,
        medium: 2,
        low: 3,
      };
      return order[a.level] - order[b.level];
    });
  }
}

export function createFinanceExecutiveIntelligence(
  deps?: FinanceExecutiveIntelligenceDependencies
): FinanceExecutiveIntelligence {
  return new FinanceExecutiveIntelligence(deps);
}
