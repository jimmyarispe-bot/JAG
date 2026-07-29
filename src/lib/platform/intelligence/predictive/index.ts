/**
 * Predictive Intelligence Engine — Sprint 201.
 * Advisory forecasts from contributor outputs. No Core/Runtime changes.
 */

export {
  PREDICTION_KINDS,
  PREDICTION_KIND_LABELS,
  type PredictionKind,
  type PredictionTrend,
  type PredictionRiskLevel,
  type PredictionStance,
  type PredictionSignal,
  type PredictionContext,
} from "./PredictionTypes";

export {
  STANDARD_PREDICTION_HORIZONS,
  PREDICTION_HORIZON_LABELS,
  horizonToDays,
  horizonLabel,
  isStandardHorizon,
  type PredictionHorizon,
  type StandardPredictionHorizon,
} from "./PredictionHorizon";

export type {
  PredictionEvidence,
  PredictionAssumption,
  PredictionDriver,
  PreventiveAction,
} from "./PredictionEvidence";

export type {
  PredictionStateSnapshot,
  PredictionResult,
  DecisionConsequenceForecast,
} from "./PredictionResult";

export { computeForecast, type ForecastComputeInput, type ForecastComputeOutput } from "./ForecastModel";
export { computeConfidence, type ConfidenceInputs, type ConfidenceOutput } from "./ConfidenceModel";
export { PredictionRegistry, type PredictionDefinition } from "./PredictionRegistry";
export { runPredictionEngine, type PredictionEngineRun } from "./PredictionEngine";
export {
  PredictionService,
  type PredictionServiceRequest,
  type PredictionServiceResponse,
} from "./PredictionService";
export {
  recordPredictionObservation,
  listPredictionObservations,
  clearPredictionObservationsForTests,
  type PredictionObservation,
} from "./observability";
