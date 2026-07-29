/**
 * ScenarioEngine — composes runner + comparison — Sprint 202.
 */

import { runScenarios, type ScenarioRunSpec, type ScenarioRunnerOutput } from "./ScenarioRunner";
import type { ScenarioBaseline } from "./ScenarioTypes";

export type ScenarioEngineRequest = {
  readonly baseline: ScenarioBaseline;
  readonly specs: readonly ScenarioRunSpec[];
  readonly compare?: boolean;
};

export type ScenarioEngineRun = ScenarioRunnerOutput;

export function runScenarioEngine(request: ScenarioEngineRequest): ScenarioEngineRun {
  return runScenarios({
    baseline: request.baseline,
    specs: request.specs,
    compare: request.compare,
  });
}
