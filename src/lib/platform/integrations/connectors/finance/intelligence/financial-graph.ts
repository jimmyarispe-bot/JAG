/**
 * Financial knowledge graph + cash/revenue/burn detectors (Sprint 077 / RC-3.03).
 */

import type { FinanceCanonicalEntity } from "@/lib/platform/integrations/connectors/finance/entities";
import { financeStore } from "@/lib/platform/integrations/connectors/finance/services/store";
import { buildFinanceKnowledgeGraph } from "@/lib/platform/integrations/connectors/finance/mapping";

export type FinancialGraphNode = {
  id: string;
  kind:
    | "FinancialTransaction"
    | "Customer"
    | "Vendor"
    | "Account"
    | "Payment"
    | "Invoice"
    | "Subscription";
  label: string;
  provider?: string;
  amount?: number;
};

export type FinancialGraphEdge = {
  id: string;
  type: string;
  from: string;
  to: string;
  weight: number;
};

export type ExpenseAnomaly = {
  id: string;
  label: string;
  amount: number;
  category?: string;
  provider?: string;
  severity: "low" | "medium" | "high";
};

export type FinancialScores = {
  cashPosition: number;
  revenue: number;
  burnRateMonthly: number;
  receivables: number;
  payables: number;
  subscriptionMrr: number;
  financialHealth: number;
  /** Forward 90-day revenue estimate from MRR + recent run-rate. */
  revenueForecast: number;
  /** Operating-profit proxy: revenue − burn − material outflows. */
  ebitda: number;
  /** Margin % (0–100) of ebitda / revenue. */
  profitability: number;
  /** 0–100 where higher means more anomalous spend. */
  expenseAnomalyScore: number;
  expenseAnomalies: ExpenseAnomaly[];
};

export type FinancialGraph = {
  organizationId: string;
  builtAt: string;
  nodes: FinancialGraphNode[];
  edges: FinancialGraphEdge[];
  providersConnected: string[];
  scores: FinancialScores;
};

function num(v: unknown): number {
  return Number(v ?? 0);
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n * 10) / 10));
}

export function buildFinancialGraph(organizationId: string): FinancialGraph | null {
  const snapshots = financeStore.listForOrganization(organizationId);
  const records = financeStore.allRecords(organizationId);
  if (!records.length) return null;

  const kg = buildFinanceKnowledgeGraph(records);
  const nodes: FinancialGraphNode[] = kg.nodes.map((n) => ({
    id: n.nodeId,
    kind: n.entityType as FinancialGraphNode["kind"],
    label: n.label,
    provider: typeof n.properties.provider === "string" ? n.properties.provider : undefined,
    amount: num(n.properties.totalAmt ?? n.properties.balance ?? n.properties.mrr),
  }));

  const edges: FinancialGraphEdge[] = kg.relationships.map((r) => ({
    id: r.relationshipId,
    type: r.type,
    from: r.fromNodeId,
    to: r.toNodeId,
    weight: 1,
  }));

  const scores = computeScores(records);

  return {
    organizationId,
    builtAt: new Date().toISOString(),
    nodes,
    edges,
    providersConnected: snapshots.map((s) => s.provider),
    scores,
  };
}

export function computeScores(records: FinanceCanonicalEntity[]): FinancialScores {
  const accounts = records.filter((r) => r.objectType === "account");
  const balances = records.filter((r) => r.objectType === "balance");
  const invoices = records.filter((r) => r.objectType === "invoice");
  const bills = records.filter((r) => r.objectType === "bill");
  const payments = records.filter((r) => r.objectType === "payment");
  const subscriptions = records.filter((r) => r.objectType === "subscription");
  const cashFlows = records.filter((r) => r.objectType === "cash_flow");
  const transactions = records.filter((r) => r.objectType === "transaction");

  const bankCash = accounts
    .filter((a) => {
      const t = String(a.attributes.accountType ?? "");
      return t === "Bank" || t === "depository";
    })
    .reduce((s, a) => s + num(a.attributes.balance ?? a.attributes.available), 0);

  const balanceCash = balances.reduce(
    (s, b) => s + num(b.attributes.available ?? b.attributes.current),
    0
  );

  const cashPosition = bankCash + balanceCash;

  const receivables =
    accounts
      .filter((a) => String(a.attributes.accountType) === "Accounts Receivable")
      .reduce((s, a) => s + num(a.attributes.balance), 0) ||
    invoices.reduce((s, i) => s + num(i.attributes.balance), 0);

  const payables =
    accounts
      .filter((a) => String(a.attributes.accountType) === "Accounts Payable")
      .reduce((s, a) => s + num(a.attributes.balance), 0) ||
    bills.reduce((s, b) => s + num(b.attributes.balance), 0);

  const paymentRevenue = payments
    .filter((p) => num(p.attributes.totalAmt) > 0)
    .reduce((s, p) => s + num(p.attributes.totalAmt), 0);

  const txnRevenue = transactions
    .filter((t) => num(t.attributes.totalAmt) > 0)
    .reduce((s, t) => s + num(t.attributes.totalAmt), 0);

  const subscriptionMrr = subscriptions
    .filter((s) => String(s.attributes.status) === "active")
    .reduce((s, sub) => s + num(sub.attributes.mrr), 0);

  const revenue = paymentRevenue + txnRevenue + subscriptionMrr;

  const burnFromCashFlow = cashFlows.reduce(
    (s, cf) => s + num(cf.attributes.burnRateMonthly),
    0
  );
  const negativeTxns = transactions.filter((t) => num(t.attributes.totalAmt) < 0);
  const outflowAmounts = negativeTxns.map((t) => Math.abs(num(t.attributes.totalAmt)));
  const outflowTxns = outflowAmounts.reduce((s, a) => s + a, 0);
  const burnRateMonthly = burnFromCashFlow || outflowTxns || payables * 1.2;

  const forecastFromCashFlow = cashFlows.reduce(
    (s, cf) => s + num(cf.attributes.forecast30d),
    0
  );
  const revenueForecast = Math.round(
    subscriptionMrr * 3 +
      paymentRevenue * 0.9 +
      txnRevenue * 0.6 +
      (forecastFromCashFlow > 0 ? forecastFromCashFlow * 0.15 : 0)
  );

  const operatingExpenses = burnRateMonthly + Math.max(0, payables * 0.25);
  const ebitda = Math.round(revenue - operatingExpenses);
  const profitability =
    revenue > 0 ? clamp(((revenue - operatingExpenses) / revenue) * 100) : 0;

  const meanOutflow =
    outflowAmounts.length > 0
      ? outflowAmounts.reduce((s, a) => s + a, 0) / outflowAmounts.length
      : 0;
  const expenseAnomalies: ExpenseAnomaly[] = negativeTxns
    .map((t) => {
      const amount = Math.abs(num(t.attributes.totalAmt));
      const ratio = meanOutflow > 0 ? amount / meanOutflow : amount > 10000 ? 3 : 1;
      const severity: ExpenseAnomaly["severity"] =
        ratio >= 2.5 || amount >= 40000
          ? "high"
          : ratio >= 1.5 || amount >= 10000
            ? "medium"
            : "low";
      return {
        id: t.id,
        label: String(t.attributes.name ?? t.externalId ?? t.id),
        amount: Math.round(amount),
        category:
          typeof t.attributes.category === "string" ? t.attributes.category : undefined,
        provider: t.sourceSystem,
        severity,
      };
    })
    .filter((a) => a.severity !== "low")
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  const expenseAnomalyScore = clamp(
    expenseAnomalies.reduce(
      (s, a) => s + (a.severity === "high" ? 28 : 14),
      expenseAnomalies.length ? 20 : 0
    )
  );

  const financialHealth = clamp(
    55 +
      (cashPosition > 100000 ? 20 : cashPosition > 50000 ? 12 : 4) +
      (receivables > 0 && receivables < cashPosition ? 8 : 0) -
      (payables > cashPosition * 0.4 ? 15 : 0) -
      (burnRateMonthly > cashPosition * 0.5 ? 12 : 0) +
      (subscriptionMrr > 1000 ? 10 : 0) +
      (profitability >= 20 ? 8 : profitability >= 0 ? 3 : -10) -
      (expenseAnomalyScore > 50 ? 8 : 0)
  );

  return {
    cashPosition: Math.round(cashPosition),
    revenue: Math.round(revenue),
    burnRateMonthly: Math.round(burnRateMonthly),
    receivables: Math.round(receivables),
    payables: Math.round(payables),
    subscriptionMrr: Math.round(subscriptionMrr),
    financialHealth,
    revenueForecast,
    ebitda,
    profitability,
    expenseAnomalyScore,
    expenseAnomalies,
  };
}
