/** Executive Metrics Aggregation Layer — Sprint 002 Task 1 */

export type {
  ExecutiveAggregateMetrics,
  ExecutiveMetric,
  ExecutiveMetricConfidence,
  ExecutiveMetricDomain,
  ExecutiveMetricStatus,
  ExecutiveMetricTrend,
  ExecutiveMetricTrendDirection,
  ExecutiveMetricsDomainBundle,
  ExecutiveMetricsFilters,
  ExecutiveMetricsScope,
} from "@/lib/platform/executive-metrics/types";

export { EXECUTIVE_METRIC_DOMAIN_ORDER } from "@/lib/platform/executive-metrics/types";

export {
  buildMetric,
  normalizeMetricValue,
  resolveConfidence,
  resolveStatus,
  resolveTrend,
  statusFromHigherIsBetter,
  statusFromLowerIsBetter,
  trendFromPct,
} from "@/lib/platform/executive-metrics/metric";

export {
  resolveExecutiveMetricsScope,
  resolveSchoolScopeId,
  hasExtendedHierarchyFilters,
} from "@/lib/platform/executive-metrics/scope";

export {
  loadExecutiveMetricsSources,
  type ExecutiveMetricsSourceBundle,
  type MissionControlFeedSummary,
} from "@/lib/platform/executive-metrics/sources";

export {
  loadFounderOperationalSlice,
  type FounderOperationalSlice,
  type FounderUpcomingClassSlice,
  type FounderTeacherAttendanceSlice,
  type FounderStudentAttendanceSlice,
} from "@/lib/platform/executive-metrics/founder-ops";

export {
  getExecutiveAggregateMetrics,
  assembleExecutiveAggregateMetrics,
  getMetricById,
  getMetricsByDomain,
  type GetExecutiveAggregateMetricsOptions,
} from "@/lib/platform/executive-metrics/aggregate";

export {
  EXECUTIVE_METRIC_PROVIDERS,
  provideEnrollmentMetrics,
  provideAdmissionsMetrics,
  provideFinanceMetrics,
  provideStaffingMetrics,
  provideAttendanceMetrics,
  provideComplianceMetrics,
  provideOperationsMetrics,
  provideExecutiveMetrics,
} from "@/lib/platform/executive-metrics/providers";
