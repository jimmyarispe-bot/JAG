/**
 * Financial Health Engine
 *
 * Soft-read scoring for organization health. Metric sources are wired via
 * https://github.com/jimmyarispe-bot/JAG/issues/4 (Accounting Intelligence).
 */

export interface FinancialHealthMetrics {
  revenue: number;
  expenses: number;
  cash: number;
  ebitda: number;
  collectionRate: number;
}

export interface FinancialHealthResult extends FinancialHealthMetrics {
  score: number;
  status: "excellent" | "healthy" | "warning" | "critical";
}

/** Pure scoring — unit-testable; independent of data source. */
export function scoreFinancialHealth(
  metrics: FinancialHealthMetrics
): FinancialHealthResult {
  let score = 100;

  if (metrics.collectionRate < 95) score -= 10;
  if (metrics.collectionRate < 90) score -= 10;
  if (metrics.collectionRate < 80) score -= 20;
  if (metrics.cash < 0) score -= 30;
  if (score < 0) score = 0;

  let status: FinancialHealthResult["status"] = "excellent";
  if (score < 95) status = "healthy";
  if (score < 80) status = "warning";
  if (score < 60) status = "critical";

  return { ...metrics, score, status };
}

/**
 * Evaluate financial health for the organization-health module.
 * Until Accounting Intelligence soft-reads land (issue #4), baselines are zeroed.
 */
export async function evaluateFinancialHealth(): Promise<FinancialHealthResult> {
  return scoreFinancialHealth({
    revenue: 0,
    expenses: 0,
    cash: 0,
    ebitda: 0,
    collectionRate: 100,
  });
}
