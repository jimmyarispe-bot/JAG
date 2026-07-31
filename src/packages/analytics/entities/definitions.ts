/**
 * Analytics domain entities — interpretative model (not query/ML/dashboard).
 * Prefer reporting.core as the fact organization layer.
 */

import type { EntityModel } from "@/jag/modeling";
import { analyticsEntity } from "@/packages/analytics/_helpers";

/** Metric definition — no calculations. */
export const AnalyticMetricDefinitionEntity = analyticsEntity({
  entityType: "AnalyticMetricDefinition",
  label: "Analytic Metric Definition",
  metadataKeys: [
    "displayName",
    "metricKey",
    "description",
    "unit",
    "measureKind",
    "reportMetricDefinitionId",
    "status",
    "externalId",
  ],
  searchableFields: [
    {
      key: "metricKey",
      label: "Metric Key",
      type: "string",
      filterable: true,
      sortable: true,
    },
    {
      key: "displayName",
      label: "Name",
      type: "string",
      filterable: true,
      sortable: true,
    },
  ],
});

/** KPI / objective / target / threshold / tolerance — definitions only. */
export const AnalyticKpiDefinitionEntity = analyticsEntity({
  entityType: "AnalyticKpiDefinition",
  label: "Analytic KPI Definition",
  metadataKeys: [
    "displayName",
    "kpiKey",
    "metricDefinitionId",
    "objective",
    "targetValue",
    "thresholdValue",
    "toleranceValue",
    "description",
    "status",
    "externalId",
  ],
});

export const AnalyticDimensionEntity = analyticsEntity({
  entityType: "AnalyticDimension",
  label: "Analytic Dimension",
  metadataKeys: [
    "displayName",
    "dimensionKey",
    "description",
    "identityEntityTypeHint",
    "status",
    "externalId",
  ],
});

export const AnalyticMeasureEntity = analyticsEntity({
  entityType: "AnalyticMeasure",
  label: "Analytic Measure",
  metadataKeys: [
    "displayName",
    "measureKind",
    "description",
    "displayFormat",
    "status",
    "externalId",
  ],
});

/** Trend definition — no computation. */
export const AnalyticTrendDefinitionEntity = analyticsEntity({
  entityType: "AnalyticTrendDefinition",
  label: "Analytic Trend Definition",
  metadataKeys: [
    "displayName",
    "metricDefinitionId",
    "comparisonPeriod",
    "direction",
    "baselineValue",
    "description",
    "status",
    "externalId",
  ],
});

/** Benchmark definitions only. */
export const AnalyticBenchmarkEntity = analyticsEntity({
  entityType: "AnalyticBenchmark",
  label: "Analytic Benchmark",
  metadataKeys: [
    "displayName",
    "metricDefinitionId",
    "benchmarkKind",
    "benchmarkValue",
    "description",
    "status",
    "externalId",
  ],
});

/** Forecast model reference — no forecasting engine. */
export const AnalyticForecastDefinitionEntity = analyticsEntity({
  entityType: "AnalyticForecastDefinition",
  label: "Analytic Forecast Definition",
  metadataKeys: [
    "displayName",
    "metricDefinitionId",
    "forecastModelReference",
    "horizon",
    "confidenceMetadata",
    "description",
    "status",
    "externalId",
  ],
});

/** Insight templates — no AI generation. */
export const AnalyticInsightDefinitionEntity = analyticsEntity({
  entityType: "AnalyticInsightDefinition",
  label: "Analytic Insight Definition",
  metadataKeys: [
    "displayName",
    "insightCategory",
    "severity",
    "explanationTemplate",
    "recommendationTemplate",
    "metricDefinitionId",
    "status",
    "externalId",
  ],
});

/**
 * Data source refs — prefer reporting.core; optional operational packs.
 * No query execution.
 */
export const AnalyticDataSourceRefEntity = analyticsEntity({
  entityType: "AnalyticDataSourceRef",
  label: "Analytic Data Source Ref",
  metadataKeys: [
    "displayName",
    "sourcePackId",
    "sourceModule",
    "reportDefinitionId",
    "entityTypeHint",
    "description",
    "status",
    "externalId",
  ],
});

export const ANALYTICS_ENTITY_DEFINITIONS: readonly EntityModel[] =
  Object.freeze(
    [
      AnalyticBenchmarkEntity,
      AnalyticDataSourceRefEntity,
      AnalyticDimensionEntity,
      AnalyticForecastDefinitionEntity,
      AnalyticInsightDefinitionEntity,
      AnalyticKpiDefinitionEntity,
      AnalyticMeasureEntity,
      AnalyticMetricDefinitionEntity,
      AnalyticTrendDefinitionEntity,
    ].sort((a, b) => a.entityType.localeCompare(b.entityType))
  );
