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

const DEFAULT_ACCEPTANCE_RATE = 0.62;
const DEFAULT_ENROLL_FROM_ACCEPT = 0.85;

export function forecastAdmissions(input: {
  history: ForecastingHistoryBundle;
  scenario: ScenarioDefinition;
  horizonDays: number;
}): DomainForecast {
  const horizonLabel = `${input.horizonDays}-day`;
  const apps = input.history.current.newApplications;
  const priorApps = input.history.prior.newApplications;
  const rate = growthRate(apps, priorApps);

  if (apps == null) {
    return insufficientForecast({
      domain: "admissions",
      label: "Admissions",
      unit: "applications",
      horizonLabel,
      reason:
        "Insufficient historical data: new applications are required to project admissions volume.",
    });
  }

  if (rate == null && input.history.current.enrollmentTrendPct == null) {
    return insufficientForecast({
      domain: "admissions",
      label: "Admissions",
      unit: "applications",
      horizonLabel,
      reason:
        "Insufficient historical data: need a prior applications period or enrollment trend to establish growth.",
    });
  }

  const baseGrowth =
    rate ?? (input.history.current.enrollmentTrendPct as number) / 100;
  const volumeMult = input.scenario.multipliers.admissionsVolume;
  const projectedApps = roundTo(
    projectWithGrowth(apps, baseGrowth) * volumeMult,
    0
  );

  const acceptanceRate =
    input.history.prior.acceptanceRate ?? DEFAULT_ACCEPTANCE_RATE;
  const usedDefaultAcceptance = input.history.prior.acceptanceRate == null;
  const acceptances = roundTo(projectedApps * acceptanceRate, 0);
  const enrollments = roundTo(acceptances * DEFAULT_ENROLL_FROM_ACCEPT, 0);
  const conversion = roundTo(
    apps > 0 ? (enrollments / projectedApps) * 100 : 0,
    1
  );

  return {
    domain: "admissions",
    label: "Admissions",
    status: "ready",
    projectedValue: projectedApps,
    unit: "applications",
    horizonLabel,
    trend: trendFromRate(baseGrowth),
    insufficientReason: null,
    details: {
      applicationsReceived: projectedApps,
      acceptances,
      enrollments,
      conversionRatePct: conversion,
      acceptanceRatePct: roundTo(acceptanceRate * 100, 1),
    },
    explanation: buildExplanation({
      assumptions: [
        {
          key: "base_growth",
          label: "Observed applications growth",
          value: roundTo(baseGrowth * 100, 2),
          unit: "%",
          source:
            rate != null
              ? "prior vs current new_applications"
              : "enrollment_trend proxy",
        },
        {
          key: "volume_multiplier",
          label: `${input.scenario.label} admissions volume multiplier`,
          value: volumeMult,
          unit: "x",
          source: `scenario:${input.scenario.id}`,
        },
        {
          key: "acceptance_rate",
          label: "Acceptance rate",
          value: roundTo(acceptanceRate * 100, 1),
          unit: "%",
          source: usedDefaultAcceptance
            ? "default catalog (62%) — no org acceptance history"
            : "prior acceptance rate",
        },
        {
          key: "enroll_from_accept",
          label: "Enroll-from-accept rate",
          value: roundTo(DEFAULT_ENROLL_FROM_ACCEPT * 100, 1),
          unit: "%",
          source: "assumption catalog",
        },
      ],
      supportingData: [
        {
          key: "current_applications",
          label: "Current applications",
          value: apps,
          source: "founder.metrics.new_applications",
        },
        {
          key: "prior_applications",
          label: "Prior applications",
          value: priorApps,
          source: "history.prior.newApplications",
        },
        {
          key: "open_decisions",
          label: "Open decisions (ops load)",
          value: input.history.operational.openDecisions,
          source: "platform_decisions",
        },
      ],
      calculationSummary: `projected_applications = round(current_applications × (1 + growth) × volume_multiplier) = round(${apps} × (1 + ${roundTo(baseGrowth, 4)}) × ${volumeMult}) = ${projectedApps}; acceptances = ${projectedApps} × ${roundTo(acceptanceRate, 3)} = ${acceptances}; enrollments = ${acceptances} × ${DEFAULT_ENROLL_FROM_ACCEPT} = ${enrollments}.`,
      confidenceNotes: [
        usedDefaultAcceptance
          ? "Acceptance rate uses the published default (62%) because org-specific history was not supplied."
          : "Acceptance rate taken from supplied prior history.",
        "Conversion to enrollment uses a fixed catalog rate (85% of acceptances).",
        "Automation/decision counts are contextual only and do not alter the arithmetic.",
      ],
    }),
  };
}
