/**
 * Digital Twin registry helpers.
 */

import type { TwinResult } from "@/lib/platform/intelligence/digital-twin/types";
import {
  DIGITAL_TWIN_MODULE_ID,
  DIGITAL_TWIN_VERSION,
} from "@/lib/platform/intelligence/digital-twin/types";

export function toDigitalTwinRegistryRecord(result: TwinResult) {
  return {
    moduleId: DIGITAL_TWIN_MODULE_ID,
    version: DIGITAL_TWIN_VERSION,
    requestId: result.requestId,
    scenarioCount: result.scenarios.length,
    simulationCount: result.simulations.length,
    preferredScenarioId: result.recommendation.preferredScenarioId,
    confidence: result.explainability.confidence,
    generatedAt: result.generatedAt,
  };
}
