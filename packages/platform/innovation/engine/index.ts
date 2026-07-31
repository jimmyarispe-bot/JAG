/**
 * InnovationEngine — proactive strategic opportunity discovery (P-006).
 *
 * Discovers what should exist before users ask. Does not implement changes
 * and does not alter Evolution proposal behavior.
 */

import { getInnovationAnalytics } from "../analytics/service";
import { buildInnovationDashboard } from "../dashboard/build";
import { generateOpportunities } from "../opportunities/generate";
import { detectInnovationPatterns } from "../patterns/detect";
import { buildInnovationPortfolio } from "../portfolio/build";
import { buildInnovationRoadmap } from "../roadmaps/build";
import { scoreOpportunity } from "../scoring/score";
import { collectInnovationSignals } from "../signals/collect";
import {
  getOpportunity,
  listOpportunities,
  listPatterns,
  listSignals,
} from "../store";
import type { HostInnovationSignals } from "../types";
import { PORTFOLIO_CATEGORIES, ROADMAP_HORIZONS } from "../types";

export class InnovationEngine {
  readonly portfolioCategories = PORTFOLIO_CATEGORIES;
  readonly roadmapHorizons = ROADMAP_HORIZONS;
  readonly implementsChanges = false as const;

  /** Collect signals → detect patterns → generate scored opportunities */
  scan(input: {
    organizationId: string;
    userId?: string;
    host?: HostInnovationSignals;
    limit?: number;
  }) {
    const signals = collectInnovationSignals({
      organizationId: input.organizationId,
      userId: input.userId,
      host: input.host,
    });
    const patterns = detectInnovationPatterns({
      organizationId: input.organizationId,
    });
    const opportunities = generateOpportunities({
      organizationId: input.organizationId,
      limit: input.limit ?? 20,
    });
    return {
      signals,
      patterns,
      opportunities,
      dashboard: this.dashboard(input.organizationId),
    };
  }

  collectSignals = collectInnovationSignals;
  detectPatterns = detectInnovationPatterns;
  generateOpportunities = generateOpportunities;

  listSignals = listSignals;
  listPatterns = listPatterns;
  listOpportunities = listOpportunities;
  getOpportunity = getOpportunity;

  score = scoreOpportunity;
  portfolio = buildInnovationPortfolio;
  roadmap = buildInnovationRoadmap;
  dashboard = buildInnovationDashboard;
  analytics = getInnovationAnalytics;
}

export function createInnovationEngine(): InnovationEngine {
  return new InnovationEngine();
}
