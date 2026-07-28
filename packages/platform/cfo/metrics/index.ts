/**
 * Canonical CFO metric registry — the ONLY place CFO computes financial values.
 * Consumes FinanceEngine / Reporting / Treasury; no duplicate ledger logic.
 */

import {
  buildExecutiveKpis,
  computeAccountBalances,
  listBills,
  listInvoices,
  listPayments,
} from "@finance";
import { nowIso } from "../ids";
import type {
  MetricDefinition,
  MetricKey,
  MetricSnapshot,
  MetricValue,
} from "../types";

export const METRIC_REGISTRY: readonly MetricDefinition[] = Object.freeze([
  {
    key: "revenue",
    name: "Revenue",
    definition: "Total recognized revenue for the period from posted ledger.",
    formula: "SUM(revenue account balances)",
    dataLineage: ["FinanceEngine.ledger", "FinancialReportingEngine.balances"],
    version: "1.0.0",
    dimensions: ["entity", "period", "campus", "program"],
  },
  {
    key: "gross_margin",
    name: "Gross Margin",
    definition: "Revenue less direct program/COGS expenses, as percent of revenue.",
    formula: "(revenue - direct_expenses) / revenue * 100",
    dataLineage: ["FinanceEngine.ledger"],
    version: "1.0.0",
    dimensions: ["entity", "period", "program"],
  },
  {
    key: "operating_income",
    name: "Operating Income",
    definition: "Revenue minus operating expenses (excludes D&A add-backs).",
    formula: "revenue - operating_expenses",
    dataLineage: ["FinanceEngine.ledger"],
    version: "1.0.0",
    dimensions: ["entity", "period"],
  },
  {
    key: "ebitda",
    name: "EBITDA",
    definition: "Operating income plus depreciation and amortization.",
    formula: "operating_income + depreciation + amortization",
    dataLineage: ["FinanceEngine.ledger", "cfo.ebitda"],
    version: "1.0.0",
    dimensions: ["entity", "period"],
  },
  {
    key: "adjusted_ebitda",
    name: "Adjusted EBITDA",
    definition: "EBITDA plus audited normalization adjustments.",
    formula: "ebitda + SUM(adjustments)",
    dataLineage: ["cfo.ebitda", "cfo.adjustments"],
    version: "1.0.0",
    dimensions: ["entity", "period"],
  },
  {
    key: "net_income",
    name: "Net Income",
    definition: "Revenue minus all expenses for the period.",
    formula: "revenue - expenses",
    dataLineage: ["FinancialReportingEngine.income_statement"],
    version: "1.0.0",
    dimensions: ["entity", "period"],
  },
  {
    key: "cash",
    name: "Cash",
    definition: "Operational cash from TreasuryEngine cash balances.",
    formula: "SUM(treasury.cashBalances.balanceHint)",
    dataLineage: ["TreasuryEngine.cashBalances"],
    version: "1.0.0",
    dimensions: ["entity", "bank_account"],
  },
  {
    key: "working_capital",
    name: "Working Capital",
    definition: "Current assets proxy (cash + AR) minus AP.",
    formula: "cash + ar - ap",
    dataLineage: ["TreasuryEngine", "RevenueEngine", "PayablesEngine"],
    version: "1.0.0",
    dimensions: ["entity", "period"],
  },
  {
    key: "current_ratio",
    name: "Current Ratio",
    definition: "Liquidity: current assets / current liabilities (proxy).",
    formula: "(cash + ar) / ap",
    dataLineage: ["TreasuryEngine", "AR", "AP"],
    version: "1.0.0",
    dimensions: ["entity", "period"],
  },
  {
    key: "quick_ratio",
    name: "Quick Ratio",
    definition: "Cash + AR over AP (inventory excluded in foundation).",
    formula: "(cash + ar) / ap",
    dataLineage: ["TreasuryEngine", "AR", "AP"],
    version: "1.0.0",
    dimensions: ["entity", "period"],
  },
  {
    key: "debt_ratio",
    name: "Debt Ratio",
    definition: "Liabilities over assets from ledger balances.",
    formula: "total_liabilities / total_assets",
    dataLineage: ["FinanceEngine.ledger"],
    version: "1.0.0",
    dimensions: ["entity", "period"],
  },
  {
    key: "ar_days",
    name: "AR Days",
    definition: "Days sales outstanding proxy from open AR / daily revenue.",
    formula: "ar / (revenue / period_days)",
    dataLineage: ["RevenueEngine.invoices", "ledger.revenue"],
    version: "1.0.0",
    dimensions: ["entity", "period"],
  },
  {
    key: "ap_days",
    name: "AP Days",
    definition: "Days payable outstanding proxy from open AP / daily spend.",
    formula: "ap / (expenses / period_days)",
    dataLineage: ["PayablesEngine.bills", "ledger.expenses"],
    version: "1.0.0",
    dimensions: ["entity", "period"],
  },
  {
    key: "cash_conversion_cycle",
    name: "Cash Conversion Cycle",
    definition: "AR days minus AP days (inventory days = 0 in foundation).",
    formula: "ar_days - ap_days",
    dataLineage: ["cfo.metrics.ar_days", "cfo.metrics.ap_days"],
    version: "1.0.0",
    dimensions: ["entity", "period"],
  },
  {
    key: "operating_margin",
    name: "Operating Margin",
    definition: "Net income as percent of revenue.",
    formula: "net_income / revenue * 100",
    dataLineage: ["FinancialReportingEngine.kpis"],
    version: "1.0.0",
    dimensions: ["entity", "period"],
  },
]);

const byKey = new Map(METRIC_REGISTRY.map((m) => [m.key, m]));

export function getMetricDefinition(key: MetricKey): MetricDefinition {
  const d = byKey.get(key);
  if (!d) throw new Error(`Unknown metric: ${key}`);
  return d;
}

export function listMetricDefinitions(): readonly MetricDefinition[] {
  return METRIC_REGISTRY;
}

function daAmounts(
  organizationId: string,
  periodKey: string
): { depreciation: number; amortization: number; refs: MetricValue["sourceRefs"] } {
  const balances = computeAccountBalances({
    organizationId,
    periodKey,
    consolidated: true,
    accountTypes: ["expense"],
  });
  let depreciation = 0;
  let amortization = 0;
  const refs: { recordType: string; recordId: string }[] = [];
  for (const b of balances) {
    const name = b.account.name.toLowerCase();
    if (name.includes("depreciation")) {
      depreciation += b.balance;
      refs.push(...b.sourceRefs);
    } else if (name.includes("amortization")) {
      amortization += b.balance;
      refs.push(...b.sourceRefs);
    }
  }
  return { depreciation, amortization, refs: Object.freeze(refs) };
}

function ratio(n: number, d: number): number | null {
  if (d === 0) return null;
  return n / d;
}

/**
 * Evaluate all canonical metrics for an organization/period.
 * Downstream CFO modules MUST read from this snapshot (or re-call this).
 */
export function evaluateMetrics(input: {
  organizationId: string;
  periodKey: string;
  /** Optional adjustment sum for adjusted_ebitda (from ebitda module). */
  adjustmentTotal?: number;
}): MetricSnapshot {
  const kpis = buildExecutiveKpis({
    organizationId: input.organizationId,
    periodKey: input.periodKey,
  });
  const balances = computeAccountBalances({
    organizationId: input.organizationId,
    periodKey: input.periodKey,
    consolidated: true,
  });
  const assets = balances
    .filter((b) => b.account.type === "asset" || b.account.type === "contra_asset")
    .reduce((s, b) => s + b.balance, 0);
  const liabilities = balances
    .filter(
      (b) =>
        b.account.type === "liability" || b.account.type === "contra_liability"
    )
    .reduce((s, b) => s + b.balance, 0);
  const direct = balances
    .filter(
      (b) =>
        b.account.type === "expense" &&
        /cogs|cost of|program/i.test(b.account.name)
    )
    .reduce((s, b) => s + b.balance, 0);
  const { depreciation, amortization, refs: daRefs } = daAmounts(
    input.organizationId,
    input.periodKey
  );
  const operatingIncome = kpis.revenue - kpis.expenses;
  const ebitda = operatingIncome + depreciation + amortization;
  const adjusted =
    ebitda + (input.adjustmentTotal ?? 0);

  const periodDays = 30;
  const arDays =
    kpis.revenue === 0 ? null : kpis.ar / (kpis.revenue / periodDays);
  const apDays =
    kpis.expenses === 0 ? null : kpis.ap / (kpis.expenses / periodDays);

  const invoiceRefs = listInvoices(input.organizationId)
    .slice(0, 5)
    .map((i) => ({ recordType: "invoice" as const, recordId: i.id }));
  const billRefs = listBills(input.organizationId)
    .slice(0, 5)
    .map((b) => ({ recordType: "bill" as const, recordId: b.id }));
  const paymentRefs = listPayments(input.organizationId)
    .slice(0, 5)
    .map((p) => ({ recordType: "payment" as const, recordId: p.id }));

  const mk = (
    key: MetricKey,
    value: number | null,
    sourceRefs: MetricValue["sourceRefs"] = []
  ): MetricValue =>
    Object.freeze({
      key,
      value,
      currency: "USD",
      periodKey: input.periodKey,
      sourceRefs: Object.freeze([...sourceRefs]),
    });

  const metrics = Object.freeze({
    revenue: mk("revenue", kpis.revenue, daRefs),
    gross_margin: mk(
      "gross_margin",
      kpis.revenue === 0
        ? null
        : ((kpis.revenue - direct) / kpis.revenue) * 100
    ),
    operating_income: mk("operating_income", operatingIncome),
    ebitda: mk("ebitda", ebitda, daRefs),
    adjusted_ebitda: mk("adjusted_ebitda", adjusted, daRefs),
    net_income: mk("net_income", kpis.netIncome),
    cash: mk("cash", kpis.cash),
    working_capital: mk("working_capital", kpis.cash + kpis.ar - kpis.ap),
    current_ratio: mk("current_ratio", ratio(kpis.cash + kpis.ar, kpis.ap)),
    quick_ratio: mk("quick_ratio", ratio(kpis.cash + kpis.ar, kpis.ap)),
    debt_ratio: mk("debt_ratio", ratio(liabilities, assets)),
    ar_days: mk("ar_days", arDays, invoiceRefs),
    ap_days: mk("ap_days", apDays, billRefs),
    cash_conversion_cycle: mk(
      "cash_conversion_cycle",
      arDays == null || apDays == null ? null : arDays - apDays,
      [...invoiceRefs, ...billRefs]
    ),
    operating_margin: mk("operating_margin", kpis.operatingMargin),
  } satisfies Record<MetricKey, MetricValue>);

  void paymentRefs;

  return Object.freeze({
    organizationId: input.organizationId,
    periodKey: input.periodKey,
    generatedAt: nowIso(),
    metrics,
  });
}

export function metricValue(
  snapshot: MetricSnapshot,
  key: MetricKey
): number | null {
  return snapshot.metrics[key]?.value ?? null;
}
