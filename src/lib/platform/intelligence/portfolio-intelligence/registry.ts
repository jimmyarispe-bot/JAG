/**
 * Portfolio Intelligence registry helpers.
 */

import type { PortfolioResult } from "@/lib/platform/intelligence/portfolio-intelligence/types";
import {
  PORTFOLIO_INTELLIGENCE_MODULE_ID,
  PORTFOLIO_INTELLIGENCE_VERSION,
} from "@/lib/platform/intelligence/portfolio-intelligence/types";

export function toPortfolioRegistryRecord(result: PortfolioResult) {
  return {
    moduleId: PORTFOLIO_INTELLIGENCE_MODULE_ID,
    version: PORTFOLIO_INTELLIGENCE_VERSION,
    requestId: result.requestId,
    health: result.health,
    initiativeCount: result.registry.initiativeIds.length,
    generatedAt: result.generatedAt,
  };
}
