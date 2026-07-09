import {
  buildMetric,
  statusFromHigherIsBetter,
  statusFromLowerIsBetter,
} from "@/lib/platform/executive-metrics/metric";
import type { ExecutiveMetric } from "@/lib/platform/executive-metrics/types";
import type { ExecutiveMetricsSourceBundle } from "@/lib/platform/executive-metrics/sources";

/**
 * Finance domain — Finance ops + Financial Intelligence.
 * FI fields require schoolId; without it they stay Unknown (not 0).
 */
export function provideFinanceMetrics(sources: ExecutiveMetricsSourceBundle): ExecutiveMetric[] {
  const now = sources.loadedAt;
  const finance = sources.finance;
  const fi = sources.financialIntelligence;
  const cc = sources.commandCenter;
  const home = sources.dashboard;

  const collectionRate = finance?.collectionRate ?? null;
  // Finance dashboard returns 0 when no invoices — treat empty invoice set as Unknown.
  const collectionValue =
    finance == null
      ? null
      : finance.invoiceCount === 0
        ? null
        : collectionRate;

  const revenue =
    finance?.totalCollected ?? cc?.revenue ?? home?.revenue ?? null;
  const outstanding = finance?.outstanding ?? cc?.accountsReceivable ?? null;
  const cashPosition = fi?.cashPosition ?? cc?.cashFlow ?? null;
  const monthlyRevenue = sources.founderOps?.monthlyRevenue ?? null;

  return [
    buildMetric({
      id: "finance.collection_rate",
      name: "Collection Rate",
      domain: "finance",
      source: "finance.dashboards",
      value: collectionValue,
      unit: "percent",
      zeroIsValid: true,
      confidence: collectionValue == null ? undefined : "High",
      status: statusFromHigherIsBetter(collectionValue, 90, 80, 70),
      lastUpdated: now,
    }),
    buildMetric({
      id: "finance.monthly_revenue",
      name: "Monthly Revenue",
      domain: "finance",
      source: "founder-ops.monthly-revenue",
      value: monthlyRevenue,
      unit: "currency",
      zeroIsValid: true,
      confidence: monthlyRevenue == null ? undefined : "High",
      lastUpdated: now,
    }),
    buildMetric({
      id: "finance.total_collected",
      name: "Total Collected",
      domain: "finance",
      source: "finance.dashboards / command-center",
      value: finance || cc || home ? revenue : null,
      unit: "currency",
      zeroIsValid: true,
      confidence: finance || cc || home ? "High" : undefined,
      lastUpdated: now,
    }),
    buildMetric({
      id: "finance.accounts_receivable",
      name: "Accounts Receivable",
      domain: "finance",
      source: "finance.dashboards / command-center",
      value: finance || cc ? outstanding : null,
      unit: "currency",
      zeroIsValid: true,
      confidence: finance || cc ? "High" : undefined,
      status:
        outstanding == null
          ? "unknown"
          : outstanding === 0
            ? "healthy"
            : finance && finance.totalBilled > 0
              ? statusFromLowerIsBetter(
                  Math.round((outstanding / finance.totalBilled) * 100),
                  10,
                  20,
                  35
                )
              : "watch",
      lastUpdated: now,
    }),
    buildMetric({
      id: "finance.cash_position",
      name: "Cash Position",
      domain: "finance",
      source: "financial-intelligence.executive / command-center",
      value: cashPosition,
      unit: "currency",
      zeroIsValid: true,
      // FI cash is heuristic until GL Phase 0.
      confidence: fi ? "Low" : cc ? "Medium" : undefined,
      lastUpdated: now,
    }),
    buildMetric({
      id: "finance.operating_margin",
      name: "Operating Margin",
      domain: "finance",
      source: "financial-intelligence.executive",
      value: fi?.operatingMargin ?? null,
      unit: "percent",
      zeroIsValid: true,
      confidence: fi?.operatingMargin == null ? undefined : "Low",
      status: statusFromHigherIsBetter(fi?.operatingMargin ?? null, 15, 8, 0),
      lastUpdated: now,
    }),
    buildMetric({
      id: "finance.ebitda",
      name: "EBITDA",
      domain: "finance",
      source: "financial-intelligence.executive",
      value: fi?.ebitda ?? null,
      unit: "currency",
      zeroIsValid: true,
      confidence: fi?.ebitda == null ? undefined : "Low",
      lastUpdated: now,
    }),
    buildMetric({
      id: "finance.open_financial_risks",
      name: "Open Financial Risks",
      domain: "finance",
      source: "financial-intelligence.executive",
      value: fi ? fi.financialRisks : null,
      unit: "count",
      zeroIsValid: true,
      confidence: fi ? "High" : undefined,
      status: statusFromLowerIsBetter(fi ? fi.financialRisks : null, 0, 2, 5),
      lastUpdated: now,
    }),
    buildMetric({
      id: "finance.tuition_yield",
      name: "Tuition Yield",
      domain: "finance",
      source: "finance.dashboards",
      value:
        finance == null || finance.invoiceCount === 0 ? null : finance.tuitionYield,
      unit: "percent",
      zeroIsValid: true,
      confidence:
        finance == null || finance.invoiceCount === 0 ? undefined : "Medium",
      lastUpdated: now,
    }),
  ];
}
