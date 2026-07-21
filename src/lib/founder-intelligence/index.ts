export {
  canManageFounderIntelligence,
  canViewFounderIntelligence,
  canDecideFounderIntelligence,
  assertCanViewFounderIntelligence,
  assertCanDecideFounderIntelligence,
  requireFounderIntelligenceView,
  requireFounderIntelligenceDecide,
} from "./access";

export { recordFounderActivity } from "./activity";
export { loadEiSignals, domainForEvent, countByDomain } from "./events";
export {
  scoreDomainHealth,
  scoreAllDomains,
  scoreOverallHealth,
} from "./health";
export { detectRisks } from "./risks";
export { detectOpportunities } from "./opportunities";
export { generatePredictions } from "./predictions";
export { generateRecommendations } from "./recommendations";
export { analyzeCrossDomain } from "./correlations";
export { buildExecutiveBrief, buildTodaysPriorities } from "./brief";
export { buildExecutiveTimeline } from "./timeline";
export { buildFounderKpis } from "./kpis";
export {
  listFounderDecisions,
  createDecisionFromRecommendation,
  applyDecisionAction,
} from "./decisions";
export { listFounderMemory, upsertFounderMemory, archiveFounderMemory } from "./memory";
export { composeFounderDashboard } from "./compose";
export { FOUNDER_DOMAINS, DOMAIN_EVENT_HINTS } from "./types";
export type * from "./types";
