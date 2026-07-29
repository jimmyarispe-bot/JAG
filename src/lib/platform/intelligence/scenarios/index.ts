/**
 * Scenario Planning Engine — Sprint 202.
 * Advisory hypothetical projections. No Core/Runtime changes.
 */

export {
  SCENARIO_KINDS,
  SCENARIO_KIND_LABELS,
  type ScenarioKind,
  type ScenarioInputs,
  type ScenarioBaseline,
  type ScenarioBaselineSignal,
  type ScenarioStance,
  type ScenarioImpactDimension,
} from "./ScenarioTypes";

export {
  buildScenarioAssumptions,
  type ScenarioAssumption,
} from "./ScenarioAssumptions";

export type {
  ScenarioStateSnapshot,
  ScenarioDriver,
  ScenarioEvidence,
  ScenarioTradeOff,
  ScenarioRecommendedDecision,
  ScenarioDimensionImpact,
  ScenarioResult,
  DecisionWhatIfBranch,
  DecisionWhatIfResult,
} from "./ScenarioResult";

export {
  compareScenarios,
  type ScenarioComparison,
  type ScenarioComparisonRow,
} from "./ScenarioComparison";

export {
  SCENARIO_TEMPLATES,
  getScenarioTemplate,
  type ScenarioTemplate,
} from "./ScenarioTemplates";

export { computeScenarioModel, type ScenarioModelComputeInput } from "./ScenarioModel";
export { ScenarioRegistry, type ScenarioDefinition } from "./ScenarioRegistry";
export {
  runScenarios,
  type ScenarioRunSpec,
  type ScenarioRunnerOutput,
} from "./ScenarioRunner";
export {
  runScenarioEngine,
  type ScenarioEngineRequest,
  type ScenarioEngineRun,
} from "./ScenarioEngine";
export {
  ScenarioService,
  type ScenarioServiceRequest,
  type ScenarioServiceResponse,
} from "./ScenarioService";
export {
  recordScenarioObservation,
  listScenarioObservations,
  clearScenarioObservationsForTests,
  type ScenarioObservation,
} from "./observability";
