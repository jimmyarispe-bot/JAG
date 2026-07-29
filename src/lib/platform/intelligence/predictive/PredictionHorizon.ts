/**
 * Forecast horizons — Sprint 201.
 * Standard set plus future-ready custom days.
 */

export const STANDARD_PREDICTION_HORIZONS = [
  "7_days",
  "30_days",
  "90_days",
  "6_months",
  "1_year",
] as const;

export type StandardPredictionHorizon = (typeof STANDARD_PREDICTION_HORIZONS)[number];

export type PredictionHorizon =
  | StandardPredictionHorizon
  | { readonly kind: "custom"; readonly days: number; readonly label: string };

export const PREDICTION_HORIZON_LABELS: Record<StandardPredictionHorizon, string> = {
  "7_days": "7 Days",
  "30_days": "30 Days",
  "90_days": "90 Days",
  "6_months": "6 Months",
  "1_year": "1 Year",
};

export function horizonToDays(horizon: PredictionHorizon): number {
  if (typeof horizon === "object") return Math.max(1, Math.floor(horizon.days));
  switch (horizon) {
    case "7_days":
      return 7;
    case "30_days":
      return 30;
    case "90_days":
      return 90;
    case "6_months":
      return 183;
    case "1_year":
      return 365;
  }
}

export function horizonLabel(horizon: PredictionHorizon): string {
  if (typeof horizon === "object") return horizon.label;
  return PREDICTION_HORIZON_LABELS[horizon];
}

export function isStandardHorizon(value: string): value is StandardPredictionHorizon {
  return (STANDARD_PREDICTION_HORIZONS as readonly string[]).includes(value);
}
