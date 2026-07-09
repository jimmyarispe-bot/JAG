/** Executive Intelligence workspace — Sprint 002 Task 6 / Milestone 1 Phase A */

export {
  loadExecutiveIntelligenceWorkspace,
  topOpenDecisions,
  alertsToFounderCards,
  type ExecutiveIntelligenceWorkspace,
  type LoadExecutiveIntelligenceWorkspaceOptions,
} from "@/lib/platform/executive-intelligence/workspace";

export {
  mapWorkspaceToFounderDashboard,
  type MapWorkspaceToFounderDashboardOptions,
} from "@/lib/platform/executive-intelligence/map-founder-dashboard";

export { aggregateToCommandCenterMetrics } from "@/lib/platform/executive-metrics/adapters/command-center";
