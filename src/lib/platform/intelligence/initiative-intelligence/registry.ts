/**
 * Initiative Intelligence registry helpers.
 */

import type { InitiativeResult } from "@/lib/platform/intelligence/initiative-intelligence/types";
import {
  INITIATIVE_INTELLIGENCE_MODULE_ID,
  INITIATIVE_INTELLIGENCE_VERSION,
} from "@/lib/platform/intelligence/initiative-intelligence/types";

export function toInitiativeRegistryRecord(result: InitiativeResult) {
  return {
    moduleId: INITIATIVE_INTELLIGENCE_MODULE_ID,
    version: INITIATIVE_INTELLIGENCE_VERSION,
    requestId: result.requestId,
    activeCount: result.activeCount,
    atRiskCount: result.atRiskCount,
    completedCount: result.completedCount,
    portfolioHealth: result.portfolioHealth,
    generatedAt: result.generatedAt,
  };
}
