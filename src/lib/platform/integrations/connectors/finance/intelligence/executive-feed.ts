/**
 * Unified finance → executive intelligence soft feed (Sprint 077 / RC-3.03).
 * Feeds Accounting, Finance, Forecasting, Executive Brief, Portfolio, Digital Twin.
 */

import { financeStore } from "@/lib/platform/integrations/connectors/finance/services/store";
import {
  buildFinancialGraph,
  computeScores,
} from "@/lib/platform/integrations/connectors/finance/intelligence/financial-graph";
import { getQuickBooksFeed } from "@/lib/platform/integrations/connectors/quickbooks/intelligence-feed";
import { getSquareFeed } from "@/lib/platform/integrations/connectors/square/intelligence-feed";
import { getPlaidFeed } from "@/lib/platform/integrations/connectors/plaid/intelligence-feed";

export type FinanceExecutiveFeed = {
  sourceSystem: "finance";
  live: true;
  syncedAt: string;
  organizationId: string;
  providersConnected: string[];
  accounting: {
    invoices: number;
    bills: number;
    ar: number;
    ap: number;
  };
  finance: {
    cashPosition: number;
    revenue: number;
    burnRateMonthly: number;
    financialHealth: number;
    ebitda: number;
    profitability: number;
    expenseAnomalyScore: number;
  };
  forecasting: {
    cashForecast30d: number;
    revenueForecast: number;
    runwayMonths: number | null;
    subscriptionMrr: number;
  };
  portfolio: {
    financialScore: number;
    liquidityScore: number;
  };
  digitalTwin: {
    workingCapital: number;
    netCashFlow: number;
  };
  briefBullets: string[];
  softLights: {
    financial: { healthScore: { value: number }; financialScore: { value: number } };
    predictive: { healthScore: { value: number }; predictiveScore: { value: number } };
    portfolio: { healthScore: { value: number }; portfolioScore: { value: number } };
    digitalTwin: { healthScore: { value: number }; twinScore: { value: number } };
  };
};

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n * 10) / 10));
}

export function buildFinanceExecutiveFeed(
  organizationId: string
): FinanceExecutiveFeed | null {
  const records = financeStore.allRecords(organizationId);
  const graph = buildFinancialGraph(organizationId);
  const qb = getQuickBooksFeed(organizationId);
  const square = getSquareFeed(organizationId);
  const plaid = getPlaidFeed(organizationId);

  if (!records.length && !qb && !square && !plaid) return null;

  const scores = records.length
    ? computeScores(records)
    : (() => {
        const cashPosition = qb?.financial.cash ?? plaid?.cash.available ?? 0;
        const revenue = qb?.financial.revenueActual ?? 0;
        const burnRateMonthly = plaid?.cash.burnRateMonthly ?? 0;
        const ebitda = Math.round(revenue - burnRateMonthly);
        return {
          cashPosition,
          revenue,
          burnRateMonthly,
          receivables: qb?.financial.ar ?? 0,
          payables: qb?.financial.ap ?? 0,
          subscriptionMrr: 0,
          financialHealth: qb?.financialScore ?? plaid?.financialScore ?? 50,
          revenueForecast: Math.round(revenue * 1.1 + (plaid?.cash.cashForecast30d ?? 0) * 0.1),
          ebitda,
          profitability: revenue > 0 ? clamp((ebitda / revenue) * 100) : 0,
          expenseAnomalyScore: 0,
          expenseAnomalies: [],
        };
      })();

  const cashForecast30d =
    plaid?.cash.cashForecast30d ??
    Math.round(scores.cashPosition - scores.burnRateMonthly + scores.revenue * 0.08);
  const runwayMonths =
    scores.burnRateMonthly > 0
      ? Math.round((scores.cashPosition / scores.burnRateMonthly) * 10) / 10
      : null;

  const providersConnected = [
    ...(graph?.providersConnected ?? []),
    ...(qb ? (["quickbooks"] as const) : []),
    ...(square ? (["square"] as const) : []),
    ...(plaid ? (["plaid"] as const) : []),
  ];
  const uniqueProviders = [...new Set(providersConnected)];

  const invoices = records.filter((r) => r.objectType === "invoice").length;
  const bills = records.filter((r) => r.objectType === "bill").length;
  const financialScore = clamp(
    (scores.financialHealth + (qb?.financialScore ?? scores.financialHealth)) / 2
  );
  const liquidityScore = clamp(
    plaid?.liquidityScore ??
      (scores.cashPosition > scores.payables * 2 ? 85 : scores.cashPosition > scores.payables ? 65 : 40)
  );
  const predictiveScore = clamp((financialScore + liquidityScore) / 2);
  const portfolioScore = clamp(financialScore * 0.6 + liquidityScore * 0.4);
  const twinScore = clamp(
    50 +
      (scores.cashPosition > 0 ? 20 : 0) +
      (runwayMonths != null && runwayMonths >= 6 ? 15 : 0) -
      (scores.burnRateMonthly > scores.cashPosition * 0.4 ? 10 : 0)
  );

  const syncedAt =
    financeStore.listForOrganization(organizationId)[0]?.syncedAt ??
    qb?.syncedAt ??
    square?.syncedAt ??
    plaid?.syncedAt ??
    new Date().toISOString();

  const briefBullets = [
    `Cash position $${scores.cashPosition.toLocaleString()} across ${uniqueProviders.length || 1} finance system(s).`,
    `Revenue pulse $${scores.revenue.toLocaleString()} · forecast $${scores.revenueForecast.toLocaleString()} · MRR $${scores.subscriptionMrr.toLocaleString()}.`,
    `EBITDA $${scores.ebitda.toLocaleString()} · profitability ${scores.profitability}%.`,
    `AR $${scores.receivables.toLocaleString()} · AP $${scores.payables.toLocaleString()} · burn $${scores.burnRateMonthly.toLocaleString()}/mo.`,
    scores.expenseAnomalyScore > 0
      ? `Expense anomaly score ${scores.expenseAnomalyScore} (${scores.expenseAnomalies.length} flag(s)).`
      : null,
    runwayMonths != null
      ? `Runway ~${runwayMonths} months at current burn.`
      : "Runway not estimated — connect Plaid cash flow.",
    ...(qb?.briefBullets.slice(0, 1) ?? []),
    ...(plaid?.briefBullets.slice(0, 1) ?? []),
  ]
    .filter((b): b is string => Boolean(b))
    .slice(0, 6);

  return {
    sourceSystem: "finance",
    live: true,
    syncedAt,
    organizationId,
    providersConnected: uniqueProviders,
    accounting: {
      invoices: invoices || qb?.counts.invoices || 0,
      bills: bills || qb?.counts.bills || 0,
      ar: scores.receivables,
      ap: scores.payables,
    },
    finance: {
      cashPosition: scores.cashPosition,
      revenue: scores.revenue,
      burnRateMonthly: scores.burnRateMonthly,
      financialHealth: scores.financialHealth,
      ebitda: scores.ebitda,
      profitability: scores.profitability,
      expenseAnomalyScore: scores.expenseAnomalyScore,
    },
    forecasting: {
      cashForecast30d,
      revenueForecast: scores.revenueForecast,
      runwayMonths,
      subscriptionMrr: scores.subscriptionMrr,
    },
    portfolio: {
      financialScore,
      liquidityScore,
    },
    digitalTwin: {
      workingCapital: Math.round(scores.cashPosition + scores.receivables - scores.payables),
      netCashFlow: Math.round(scores.revenue - scores.burnRateMonthly),
    },
    briefBullets,
    softLights: {
      financial: {
        healthScore: { value: financialScore },
        financialScore: { value: financialScore },
      },
      predictive: {
        healthScore: { value: predictiveScore },
        predictiveScore: { value: predictiveScore },
      },
      portfolio: {
        healthScore: { value: portfolioScore },
        portfolioScore: { value: portfolioScore },
      },
      digitalTwin: {
        healthScore: { value: twinScore },
        twinScore: { value: twinScore },
      },
    },
  };
}

export function getFinanceExecutiveFeed(
  organizationId: string
): FinanceExecutiveFeed | null {
  return buildFinanceExecutiveFeed(organizationId);
}
