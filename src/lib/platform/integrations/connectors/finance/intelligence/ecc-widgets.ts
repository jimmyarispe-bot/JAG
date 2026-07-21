/**
 * Finance ECC widget data (Sprint 077 / RC-3.03).
 */

import {
  buildFinancialGraph,
  type ExpenseAnomaly,
  type FinancialGraph,
} from "@/lib/platform/integrations/connectors/finance/intelligence/financial-graph";

export type CashPositionWidget = {
  kind: "cash_position";
  title: string;
  cashPosition: number;
  financialHealth: number;
  providersConnected: string[];
};

export type RevenueWidget = {
  kind: "revenue";
  title: string;
  revenue: number;
  subscriptionMrr: number;
};

export type BurnRateWidget = {
  kind: "burn_rate";
  title: string;
  burnRateMonthly: number;
  runwayMonths: number | null;
  severity: "low" | "medium" | "high";
};

export type ReceivablesWidget = {
  kind: "receivables";
  title: string;
  receivables: number;
};

export type PayablesWidget = {
  kind: "payables";
  title: string;
  payables: number;
};

export type SubscriptionsWidget = {
  kind: "subscriptions";
  title: string;
  subscriptionMrr: number;
  activeCount: number;
};

export type RevenueForecastWidget = {
  kind: "revenue_forecast";
  title: string;
  revenueForecast: number;
  subscriptionMrr: number;
  currentRevenue: number;
};

export type ExpenseAnomaliesWidget = {
  kind: "expense_anomalies";
  title: string;
  expenseAnomalyScore: number;
  anomalies: ExpenseAnomaly[];
};

export type ProfitabilityWidget = {
  kind: "profitability";
  title: string;
  profitability: number;
  ebitda: number;
  revenue: number;
};

export type EbitdaWidget = {
  kind: "ebitda";
  title: string;
  ebitda: number;
  revenue: number;
  burnRateMonthly: number;
};

export type FinanceEccWidgets = {
  cashPosition: CashPositionWidget;
  revenue: RevenueWidget;
  burnRate: BurnRateWidget;
  receivables: ReceivablesWidget;
  payables: PayablesWidget;
  subscriptions: SubscriptionsWidget;
  revenueForecast: RevenueForecastWidget;
  expenseAnomalies: ExpenseAnomaliesWidget;
  profitability: ProfitabilityWidget;
  ebitda: EbitdaWidget;
  graph: FinancialGraph;
};

export function buildFinanceEccWidgets(organizationId: string): FinanceEccWidgets | null {
  const graph = buildFinancialGraph(organizationId);
  if (!graph) return null;

  const { scores } = graph;
  const runwayMonths =
    scores.burnRateMonthly > 0
      ? Math.round((scores.cashPosition / scores.burnRateMonthly) * 10) / 10
      : null;
  const severity: BurnRateWidget["severity"] =
    runwayMonths != null && runwayMonths < 3
      ? "high"
      : runwayMonths != null && runwayMonths < 6
        ? "medium"
        : "low";

  const activeSubscriptions = graph.nodes.filter((n) => n.kind === "Subscription").length;

  return {
    graph,
    cashPosition: {
      kind: "cash_position",
      title: "Cash Position",
      cashPosition: scores.cashPosition,
      financialHealth: scores.financialHealth,
      providersConnected: graph.providersConnected,
    },
    revenue: {
      kind: "revenue",
      title: "Revenue",
      revenue: scores.revenue,
      subscriptionMrr: scores.subscriptionMrr,
    },
    burnRate: {
      kind: "burn_rate",
      title: "Burn Rate",
      burnRateMonthly: scores.burnRateMonthly,
      runwayMonths,
      severity,
    },
    receivables: {
      kind: "receivables",
      title: "Receivables",
      receivables: scores.receivables,
    },
    payables: {
      kind: "payables",
      title: "Payables",
      payables: scores.payables,
    },
    subscriptions: {
      kind: "subscriptions",
      title: "Subscriptions",
      subscriptionMrr: scores.subscriptionMrr,
      activeCount: activeSubscriptions,
    },
    revenueForecast: {
      kind: "revenue_forecast",
      title: "Revenue Forecast",
      revenueForecast: scores.revenueForecast,
      subscriptionMrr: scores.subscriptionMrr,
      currentRevenue: scores.revenue,
    },
    expenseAnomalies: {
      kind: "expense_anomalies",
      title: "Expense Anomalies",
      expenseAnomalyScore: scores.expenseAnomalyScore,
      anomalies: scores.expenseAnomalies,
    },
    profitability: {
      kind: "profitability",
      title: "Profitability",
      profitability: scores.profitability,
      ebitda: scores.ebitda,
      revenue: scores.revenue,
    },
    ebitda: {
      kind: "ebitda",
      title: "EBITDA",
      ebitda: scores.ebitda,
      revenue: scores.revenue,
      burnRateMonthly: scores.burnRateMonthly,
    },
  };
}
