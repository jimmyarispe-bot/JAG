/** Executive Alert Orchestrator — Sprint 002 Task 3 */

export type {
  BuildExecutiveAlertsInput,
  ExecutiveAlert,
  ExecutiveAlertCategory,
  ExecutiveAlertConfidence,
  ExecutiveAlertDraft,
  ExecutiveAlertRelatedEntity,
  ExecutiveAlertSeverity,
  ExecutiveAlertSourceKind,
  ExecutiveAlertSourceRef,
  ExecutiveAlertStatus,
  ExecutiveAlertStream,
  ExecutiveAlertsFilters,
  ExecutiveAlertsScope,
  GetExecutiveAlertsOptions,
} from "@/lib/platform/executive-alerts/types";

export {
  EXECUTIVE_ALERT_CATEGORIES,
  EXECUTIVE_ALERT_SEVERITIES,
  SEVERITY_RANK,
} from "@/lib/platform/executive-alerts/types";

export {
  alertIdFromDedupeKey,
  buildDedupeKey,
  hashString,
  normalizeToken,
} from "@/lib/platform/executive-alerts/hash";

export {
  clampPriority,
  maxConfidence,
  maxSeverity,
  normalizeSeverity,
  scoreAlert,
  severityFromMetricStatus,
} from "@/lib/platform/executive-alerts/score";

export {
  buildEntityMergeKey,
  dedupeAlerts,
} from "@/lib/platform/executive-alerts/dedupe";

export { buildExecutiveAlerts } from "@/lib/platform/executive-alerts/build";

export {
  acknowledgeAlert,
  attachActivityReferences,
  dismissAlert,
  linkJagWorkReference,
  linkMissionControlReference,
  linkWorkflowReference,
  reopenAlert,
} from "@/lib/platform/executive-alerts/lifecycle";

export {
  adaptActivityEvents,
  adaptAdmissionsSignals,
  adaptComplianceSignals,
  adaptExecutiveInsights,
  adaptExecutiveMetrics,
  adaptFinancialAlerts,
  adaptHrSignals,
  adaptKpiSnapshots,
  adaptMissionControlItems,
  adaptOperationalLoopSignals,
  type ActivityAlertLike,
  type AdmissionsMetricsLike,
  type ComplianceStatsLike,
  type ExecutiveInsightLike,
  type FinancialAlertLike,
  type MissionControlItemLike,
  type OperationalLoopSummaryLike,
  type WorkforceAnalyticsLike,
} from "@/lib/platform/executive-alerts/adapters";

export {
  loadExecutiveAlertSources,
  loadLatestKpiSnapshots,
  resolveExecutiveAlertsScope,
  type ExecutiveAlertSourceBundle,
} from "@/lib/platform/executive-alerts/sources";

export {
  collectAlertDrafts,
  getExecutiveAlerts,
  type GetExecutiveAlertsExtra,
} from "@/lib/platform/executive-alerts/get";
