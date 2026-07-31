import {
  buildExplanation,
  insufficientForecast,
} from "@/lib/platform/intelligence/forecasting/explanations";
import {
  growthRate,
  projectWithGrowth,
  roundTo,
  trendFromRate,
} from "@/lib/platform/intelligence/forecasting/models";
import type {
  DomainForecast,
  ForecastingHistoryBundle,
  ScenarioDefinition,
} from "@/lib/platform/intelligence/forecasting/types";

export function forecastFinance(input: {
  history: ForecastingHistoryBundle;
  scenario: ScenarioDefinition;
  horizonDays: number;
}): DomainForecast {
  const horizonLabel = `${input.horizonDays}-day`;
  const collected = input.history.current.tuitionCollected;
  const outstanding = input.history.current.outstandingBalances;
  const priorCollected = input.history.prior.tuitionCollected;
  const rate = growthRate(collected, priorCollected);

  if (collected == null || outstanding == null) {
    return insufficientForecast({
      domain: "finance",
      label: "Revenue",
      unit: "USD",
      horizonLabel,
      reason:
        "Insufficient historical data: tuition collected and outstanding balances are required for revenue forecasts.",
    });
  }

  if (rate == null && collected + outstanding <= 0) {
    return insufficientForecast({
      domain: "finance",
      label: "Revenue",
      unit: "USD",
      horizonLabel,
      reason:
        "Insufficient historical data: cannot establish a revenue trajectory from zero totals without prior periods.",
    });
  }

  const baseGrowth = rate ?? 0;
  const growth = baseGrowth * input.scenario.multipliers.tuitionRevenue;
  const collectionRate =
    collected + outstanding > 0
      ? collected / (collected + outstanding)
      : 0;
  const adjustedCollection = Math.min(
    0.99,
    collectionRate * input.scenario.multipliers.collectionRate
  );

  const projectedRevenue = roundTo(
    projectWithGrowth(collected, growth),
    0
  );
  const projectedOutstanding = roundTo(
    Math.max(0, (collected + outstanding) * (1 - adjustedCollection) *
      input.scenario.multipliers.tuitionRevenue),
    0
  );
  const monthlyCash = roundTo(projectedRevenue / 3, 0); // horizon treated as quarter → monthly avg

  return {
    domain: "finance",
    label: "Revenue",
    status: "ready",
    projectedValue: projectedRevenue,
    unit: "USD",
    horizonLabel,
    trend: trendFromRate(growth),
    insufficientReason: null,
    details: {
      tuitionRevenue: projectedRevenue,
      outstandingBalances: projectedOutstanding,
      monthlyCashCollections: monthlyCash,
      collectionRatePct: roundTo(adjustedCollection * 100, 1),
    },
    explanation: buildExplanation({
      assumptions: [
        {
          key: "revenue_growth",
          label: "Tuition revenue growth",
          value: roundTo(growth * 100, 2),
          unit: "%",
          source:
            rate != null
              ? "prior vs current tuition_collected × scenario"
              : "flat (0%) — no prior tuition history; scenario still scales level via outstanding math",
        },
        {
          key: "collection_rate",
          label: "Collection rate",
          value: roundTo(adjustedCollection * 100, 1),
          unit: "%",
          source: "collected ÷ (collected + outstanding) × scenario collectionRate",
        },
      ],
      supportingData: [
        {
          key: "tuition_collected",
          label: "Current tuition collected",
          value: collected,
          source: "founder.metrics.tuition_collected",
        },
        {
          key: "outstanding",
          label: "Current outstanding balances",
          value: outstanding,
          source: "founder.metrics.outstanding_balances",
        },
        {
          key: "prior_collected",
          label: "Prior tuition collected",
          value: priorCollected,
          source: "history.prior.tuitionCollected",
        },
      ],
      calculationSummary: `projected_tuition_revenue = round(collected × (1 + growth)) = round(${collected} × (1 + ${roundTo(growth, 4)})) = ${projectedRevenue}; monthly_cash ≈ revenue ÷ 3 = ${monthlyCash}; projected_outstanding = round((collected + outstanding) × (1 − collection_rate) × revenue_mult) = ${projectedOutstanding}.`,
      confidenceNotes: [
        "Monthly cash is revenue ÷ 3 for a 90-day horizon (equal-month split), not a seasonality model.",
        "No credit-risk ML is applied; outstanding follows the observed collection rate and scenario multipliers only.",
      ],
    }),
  };
}
