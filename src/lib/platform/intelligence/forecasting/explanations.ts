import type {
  DomainForecast,
  ForecastAssumption,
  ForecastExplanation,
  SupportingDatum,
} from "@/lib/platform/intelligence/forecasting/types";

export function buildExplanation(input: {
  assumptions: ForecastAssumption[];
  supportingData: SupportingDatum[];
  calculationSummary: string;
  confidenceNotes: string[];
}): ForecastExplanation {
  return {
    assumptions: input.assumptions,
    supportingData: input.supportingData,
    calculationSummary: input.calculationSummary,
    confidenceNotes: input.confidenceNotes,
  };
}

export function insufficientForecast(input: {
  domain: DomainForecast["domain"];
  label: string;
  unit: string;
  horizonLabel: string;
  reason: string;
}): DomainForecast {
  return {
    domain: input.domain,
    label: input.label,
    status: "insufficient_data",
    projectedValue: null,
    unit: input.unit,
    horizonLabel: input.horizonLabel,
    trend: "unknown",
    explanation: null,
    insufficientReason: input.reason,
    details: {},
  };
}

/** Assert explanation math text references the projected value (test helper). */
export function explanationMentionsProjection(
  forecast: DomainForecast
): boolean {
  if (forecast.status !== "ready" || forecast.projectedValue == null) {
    return false;
  }
  const summary = forecast.explanation?.calculationSummary ?? "";
  return summary.includes(String(forecast.projectedValue));
}
