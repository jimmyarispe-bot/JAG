import type { BlueprintContributionBundle } from "@/jag/blueprints";
import {
  ANALYTIC_DATA_SOURCE_PACKS,
  ANALYTIC_DIMENSION_EXAMPLES,
  ANALYTIC_MEASURE_KINDS,
  ANALYTIC_METRIC_EXAMPLES,
} from "@/packages/analytics/catalogs";
import { ANALYTICS_ENTITY_DEFINITIONS } from "@/packages/analytics/entities";
import { ANALYTICS_NAVIGATION } from "@/packages/analytics/navigation";
import { ANALYTICS_PERMISSION_PACKS } from "@/packages/analytics/permissions";

export function assembleAnalyticsContributionBundle(): BlueprintContributionBundle {
  return Object.freeze({
    entities: ANALYTICS_ENTITY_DEFINITIONS,
    permissions: ANALYTICS_PERMISSION_PACKS,
    navigation: Object.freeze([ANALYTICS_NAVIGATION]),
    processes: Object.freeze([]),
    decisions: Object.freeze([]),
    forms: Object.freeze([]),
    reports: Object.freeze([]),
    workflows: Object.freeze([]),
    terminology: Object.freeze([
      Object.freeze({
        id: "analytics.terminology.default",
        label: "Analytics default terminology",
        terms: Object.freeze({
          metric: "Metric",
          kpi: "KPI",
          trend: "Trend",
          forecast: "Forecast",
        }),
      }),
    ]),
    integrations: Object.freeze([]),
  });
}

export function analyticsPackCatalogPayload() {
  return Object.freeze({
    metricExamples: ANALYTIC_METRIC_EXAMPLES,
    dimensionExamples: ANALYTIC_DIMENSION_EXAMPLES,
    measureKinds: ANALYTIC_MEASURE_KINDS,
    dataSourcePacks: ANALYTIC_DATA_SOURCE_PACKS,
  });
}
