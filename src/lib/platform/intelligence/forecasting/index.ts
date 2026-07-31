export { ForecastingService } from "@/lib/platform/intelligence/forecasting/service";
export type { ForecastingServiceApi } from "@/lib/platform/intelligence/forecasting/service";

export { runForecastEngine } from "@/lib/platform/intelligence/forecasting/engine";
export { buildForecastingHistory } from "@/lib/platform/intelligence/forecasting/history";
export {
  getScenario,
  listScenarios,
  SCENARIO_CATALOG,
} from "@/lib/platform/intelligence/forecasting/scenarios";
export {
  buildExplanation,
  explanationMentionsProjection,
  insufficientForecast,
} from "@/lib/platform/intelligence/forecasting/explanations";
export {
  clampNonNegative,
  growthRate,
  isFiniteNumber,
  projectWithGrowth,
  roundTo,
  trendFromRate,
} from "@/lib/platform/intelligence/forecasting/models";

export { forecastAdmissions } from "@/lib/platform/intelligence/forecasting/admissions";
export { forecastEnrollment } from "@/lib/platform/intelligence/forecasting/enrollment";
export { forecastStaffing } from "@/lib/platform/intelligence/forecasting/staffing";
export { forecastFinance } from "@/lib/platform/intelligence/forecasting/finance";
export { forecastCapacity } from "@/lib/platform/intelligence/forecasting/capacity";

export type {
  DomainForecast,
  ForecastAssumption,
  ForecastDomain,
  ForecastExplanation,
  ForecastTrend,
  ForecastingHistoryBundle,
  ForecastingResult,
  RunForecastInput,
  ScenarioDefinition,
  ScenarioForecastBundle,
  ScenarioId,
  SupportingDatum,
} from "@/lib/platform/intelligence/forecasting/types";
