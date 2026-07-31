/**
 * JAG Innovation™ — public platform entry (P-006).
 */

export const INNOVATION_ID = "jag-innovation" as const;
export const INNOVATION_VERSION = "1.0.0" as const;

export const INNOVATION_DESCRIPTOR = Object.freeze({
  id: INNOVATION_ID,
  name: "JAG Innovation™" as const,
  version: INNOVATION_VERSION,
  type: "platform-capability" as const,
  description:
    "Strategic innovation intelligence engine that proactively discovers opportunities from platform evidence before users ask.",
});

export type {
  FinancialImpact,
  HostInnovationSignals,
  InnovationCandidate,
  InnovationDashboard,
  InnovationPattern,
  InnovationPortfolio,
  InnovationRoadmap,
  InnovationSignal,
  InnovationSignalSource,
  OpportunityScores,
  PatternKind,
  PortfolioCategory,
  RoadmapHorizon,
} from "./types";
export { PORTFOLIO_CATEGORIES, ROADMAP_HORIZONS } from "./types";
export {
  resetInnovationStoreForTests,
  listSignals,
  listPatterns,
  listOpportunities,
} from "./store";
export { collectInnovationSignals } from "./signals/collect";
export { detectInnovationPatterns } from "./patterns/detect";
export { scoreOpportunity } from "./scoring/score";
export { generateOpportunities } from "./opportunities/generate";
export { buildInnovationPortfolio } from "./portfolio/build";
export { buildInnovationRoadmap } from "./roadmaps/build";
export { buildInnovationDashboard } from "./dashboard/build";
export { formatInnovationMrJagMessage } from "./recommendations/mr-jag";
export { InnovationEngine, createInnovationEngine } from "./engine";
