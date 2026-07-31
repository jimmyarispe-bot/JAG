export { FounderWorkspaceService, assembleFounderWorkspace, resolveFounderWorkspace } from "@/lib/platform/founder/workspace";
export type { AssembleFounderWorkspaceInput } from "@/lib/platform/founder/workspace";

export {
  buildFounderSystemStatusItems,
} from "@/lib/platform/founder/system-status-display";
export type { FounderSystemStatusItem } from "@/lib/platform/founder/system-status-display";

export {
  applyIntelligenceToMorningBrief,
  buildFounderMorningBrief,
  buildDeterministicAiSummary,
} from "@/lib/platform/founder/briefing";

export {
  buildFounderNavigation,
  findNavNode,
  resolveFounderNavScope,
  scopeToHref,
  FOUNDER_PLATFORM_HOME,
  FOUNDER_ACADEMYOS_HOME,
} from "@/lib/platform/founder/navigation";

export {
  buildOrganizationOverview,
  filterOrganizationsForApplication,
  selectActiveOrganization,
} from "@/lib/platform/founder/organization-overview";

export {
  buildApplicationOverview,
  listFounderApplications,
  selectActiveApplication,
} from "@/lib/platform/founder/application-overview";

export {
  FOUNDER_METRIC_CATALOG,
  aggregateOverallHealth,
  buildFounderMetrics,
  metricStatusToBand,
  scoreToHealthBand,
} from "@/lib/platform/founder/health";

export {
  adaptExecutiveAlertsToFounder,
  alertsFromMetrics,
  countOpenRisks,
  deriveRiskHighlights,
  inferAlertDomain,
  pendingApprovalsFromMetrics,
  toFounderAlertCategory,
} from "@/lib/platform/founder/risk";

export type {
  FounderActor,
  FounderAlert,
  FounderAlertCategory,
  FounderAlertDomain,
  FounderApplicationSummary,
  FounderBriefingSection,
  FounderBriefingSectionId,
  FounderHealthBand,
  FounderMetric,
  FounderMetricKey,
  FounderMorningBrief,
  FounderNavNode,
  FounderNavScope,
  FounderOrganizationSummary,
  FounderWorkspaceContext,
  ResolveFounderWorkspaceInput,
} from "@/lib/platform/founder/types";
