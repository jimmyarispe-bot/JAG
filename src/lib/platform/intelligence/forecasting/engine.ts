import { forecastAdmissions } from "@/lib/platform/intelligence/forecasting/admissions";
import { forecastCapacity } from "@/lib/platform/intelligence/forecasting/capacity";
import { forecastEnrollment } from "@/lib/platform/intelligence/forecasting/enrollment";
import { forecastFinance } from "@/lib/platform/intelligence/forecasting/finance";
import {
  getScenario,
  listScenarios,
} from "@/lib/platform/intelligence/forecasting/scenarios";
import { forecastStaffing } from "@/lib/platform/intelligence/forecasting/staffing";
import type {
  DomainForecast,
  ForecastingResult,
  RunForecastInput,
  ScenarioDefinition,
  ScenarioForecastBundle,
  ScenarioId,
} from "@/lib/platform/intelligence/forecasting/types";

function runScenario(
  scenario: ScenarioDefinition,
  input: RunForecastInput
): ScenarioForecastBundle {
  const horizonDays = input.horizonDays ?? 90;
  const admissions = forecastAdmissions({
    history: input.history,
    scenario,
    horizonDays,
  });
  const enrollment = forecastEnrollment({
    history: input.history,
    scenario,
    horizonDays,
  });
  const projectedEnrollment =
    enrollment.status === "ready" ? enrollment.projectedValue : null;
  const staffing = forecastStaffing({
    history: input.history,
    scenario,
    horizonDays,
    projectedEnrollment,
  });
  const finance = forecastFinance({
    history: input.history,
    scenario,
    horizonDays,
  });
  const capacity = forecastCapacity({
    history: input.history,
    scenario,
    horizonDays,
    projectedEnrollment,
  });

  const forecasts: DomainForecast[] = [
    enrollment,
    finance,
    staffing,
    capacity,
    admissions,
  ];

  return {
    scenarioId: scenario.id,
    scenarioLabel: scenario.label,
    description: scenario.description,
    forecasts,
  };
}

/** Deterministic forecast engine — same inputs always yield the same outputs. */
export function runForecastEngine(input: RunForecastInput): ForecastingResult {
  const activeScenario: ScenarioId = input.scenarioId ?? "baseline";
  const horizonDays = input.horizonDays ?? 90;
  const includeAll = input.includeAllScenarios !== false;

  const scenarios = (includeAll ? listScenarios() : [getScenario(activeScenario)]).map(
    (scenario) => runScenario(scenario, { ...input, horizonDays })
  );

  const active =
    scenarios.find((s) => s.scenarioId === activeScenario) ?? scenarios[0]!;

  return {
    generatedAt: input.history.observedAt,
    organizationId: input.history.organizationId,
    activeScenario: active.scenarioId,
    horizonDays,
    scenarios,
    forecasts: active.forecasts,
  };
}
