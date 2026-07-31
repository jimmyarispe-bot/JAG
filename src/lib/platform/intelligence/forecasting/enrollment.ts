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

const BASE_ATTRITION = 0.03;

export function forecastEnrollment(input: {
  history: ForecastingHistoryBundle;
  scenario: ScenarioDefinition;
  horizonDays: number;
}): DomainForecast {
  const horizonLabel = `${input.horizonDays}-day`;
  const current = input.history.current.activeStudents;
  const prior = input.history.prior.activeStudents;
  const trendPct = input.history.current.enrollmentTrendPct;
  const rate = growthRate(current, prior);

  if (current == null) {
    return insufficientForecast({
      domain: "enrollment",
      label: "Enrollment",
      unit: "students",
      horizonLabel,
      reason:
        "Insufficient historical data: active student count is required for enrollment projections.",
    });
  }

  if (rate == null && trendPct == null) {
    return insufficientForecast({
      domain: "enrollment",
      label: "Enrollment",
      unit: "students",
      horizonLabel,
      reason:
        "Insufficient historical data: need prior enrollment or enrollment_trend to project growth.",
    });
  }

  const baseGrowth = rate ?? (trendPct as number) / 100;
  const growth =
    baseGrowth * input.scenario.multipliers.enrollmentGrowth;
  const attrition =
    BASE_ATTRITION * input.scenario.multipliers.attrition;
  const afterGrowth = projectWithGrowth(current, growth);
  const projected = roundTo(afterGrowth * (1 - attrition), 0);
  const netGrowthPct = roundTo(((projected - current) / current) * 100, 2);

  return {
    domain: "enrollment",
    label: "Enrollment",
    status: "ready",
    projectedValue: projected,
    unit: "students",
    horizonLabel,
    trend: trendFromRate(netGrowthPct / 100),
    insufficientReason: null,
    details: {
      totalEnrollment: projected,
      attritionPct: roundTo(attrition * 100, 2),
      growthPct: roundTo(growth * 100, 2),
      netGrowthPct,
    },
    explanation: buildExplanation({
      assumptions: [
        {
          key: "base_growth",
          label: "Observed enrollment growth",
          value: roundTo(baseGrowth * 100, 2),
          unit: "%",
          source:
            rate != null
              ? "prior vs current active_students"
              : "founder.metrics.enrollment_trend",
        },
        {
          key: "scenario_growth_mult",
          label: `${input.scenario.label} growth multiplier`,
          value: input.scenario.multipliers.enrollmentGrowth,
          unit: "x",
          source: `scenario:${input.scenario.id}`,
        },
        {
          key: "attrition",
          label: "Attrition rate",
          value: roundTo(attrition * 100, 2),
          unit: "%",
          source: `base 3% × scenario attrition ${input.scenario.multipliers.attrition}`,
        },
      ],
      supportingData: [
        {
          key: "current_students",
          label: "Current active students",
          value: current,
          source: "founder.metrics.active_students",
        },
        {
          key: "prior_students",
          label: "Prior active students",
          value: prior,
          source: "history.prior.activeStudents",
        },
        {
          key: "attendance",
          label: "Attendance rate",
          value: input.history.current.attendance,
          source: "founder.metrics.attendance",
        },
      ],
      calculationSummary: `projected_enrollment = round(current × (1 + growth) × (1 − attrition)) = round(${current} × (1 + ${roundTo(growth, 4)}) × (1 − ${roundTo(attrition, 4)})) = ${projected}.`,
      confidenceNotes: [
        "Attrition is a published catalog rate (3%) adjusted only by the selected scenario multiplier.",
        "Attendance is supporting context and is not multiplied into the enrollment total.",
      ],
    }),
  };
}
