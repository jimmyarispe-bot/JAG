/**
 * Analytics Capability Pack — Universal Organizational Analytics.
 */

export {
  ANALYTICS_APPLICATION_ID,
  ANALYTICS_PACKAGE_ID,
  ANALYTICS_PACKAGE_VERSION,
  ANALYTICS_PACK_ID,
} from "@/packages/analytics/package";

export {
  buildAnalyticsCapabilityPacks,
  buildAnalyticsCorePack,
  describeAnalyticsCorePack,
  assembleAnalyticsContributionBundle,
  analyticsPackCatalogPayload,
} from "@/packages/analytics/capability-packs";

export {
  ANALYTICS_ENTITY_DEFINITIONS,
  AnalyticMetricDefinitionEntity,
  AnalyticKpiDefinitionEntity,
  AnalyticTrendDefinitionEntity,
  AnalyticBenchmarkEntity,
  AnalyticForecastDefinitionEntity,
  AnalyticDataSourceRefEntity,
  AnalyticInsightDefinitionEntity,
} from "@/packages/analytics/entities";
export {
  ANALYTICS_PERMISSION_KEYS,
  ANALYTICS_PERMISSION_PACK,
  ANALYTICS_PERMISSION_PACK_ID,
  ANALYTICS_PERMISSION_PACKS,
} from "@/packages/analytics/permissions";
export { ANALYTICS_NAVIGATION } from "@/packages/analytics/navigation";
export {
  ANALYTIC_METRIC_EXAMPLES,
  ANALYTIC_DIMENSION_EXAMPLES,
  ANALYTIC_MEASURE_KINDS,
  ANALYTIC_DATA_SOURCE_PACKS,
} from "@/packages/analytics/catalogs";

export {
  buildAnalyticsProofOrganizationBlueprint,
  compileAnalyticsProofRuntime,
  generateAnalyticsProofRuntime,
  registerAnalyticsHandwrittenBaseline,
  resetAnalyticsProofPortsForTests,
  listAnalyticsProofPermissionPacks,
} from "@/packages/analytics/proof";
