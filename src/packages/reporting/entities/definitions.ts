/**
 * Reporting domain entities — report definitions (not analytics / query / render).
 * Cross-pack refs are string metadata only.
 */

import type { EntityModel } from "@/jag/modeling";
import { reportingEntity } from "@/packages/reporting/_helpers";

export const ReportTypeEntity = reportingEntity({
  entityType: "ReportType",
  label: "Report Type",
  metadataKeys: [
    "displayName",
    "typeKey",
    "category",
    "description",
    "status",
    "externalId",
  ],
});

/** Reusable report definition — structure only. */
export const ReportDefinitionEntity = reportingEntity({
  entityType: "ReportDefinition",
  label: "Report Definition",
  metadataKeys: [
    "displayName",
    "title",
    "description",
    "reportTypeId",
    "lifecycleState",
    "ownerPersonId",
    "organizationId",
    "status",
    "externalId",
  ],
  searchableFields: [
    {
      key: "title",
      label: "Title",
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

export const ReportSectionEntity = reportingEntity({
  entityType: "ReportSection",
  label: "Report Section",
  metadataKeys: [
    "displayName",
    "reportDefinitionId",
    "title",
    "description",
    "ordering",
    "grouping",
    "visibility",
    "status",
    "externalId",
  ],
});

/** Data source — capability pack reference; no query execution. */
export const ReportDataSourceRefEntity = reportingEntity({
  entityType: "ReportDataSourceRef",
  label: "Report Data Source Ref",
  metadataKeys: [
    "displayName",
    "reportDefinitionId",
    "sourcePackId",
    "sourceModule",
    "entityTypeHint",
    "description",
    "status",
    "externalId",
  ],
});

/** Metric definition — no calculations. */
export const ReportMetricDefinitionEntity = reportingEntity({
  entityType: "ReportMetricDefinition",
  label: "Report Metric Definition",
  metadataKeys: [
    "displayName",
    "reportDefinitionId",
    "metricName",
    "description",
    "unit",
    "aggregation",
    "displayFormat",
    "status",
    "externalId",
  ],
});

/** Filter definition — definitions only. */
export const ReportFilterDefinitionEntity = reportingEntity({
  entityType: "ReportFilterDefinition",
  label: "Report Filter Definition",
  metadataKeys: [
    "displayName",
    "reportDefinitionId",
    "filterDimension",
    "description",
    "defaultValue",
    "required",
    "status",
    "externalId",
  ],
});

export const ReportParameterEntity = reportingEntity({
  entityType: "ReportParameter",
  label: "Report Parameter",
  metadataKeys: [
    "displayName",
    "reportDefinitionId",
    "parameterKey",
    "parameterKind",
    "description",
    "defaultValue",
    "required",
    "status",
    "externalId",
  ],
});

/** Output format binding — no rendering. */
export const ReportOutputFormatBindingEntity = reportingEntity({
  entityType: "ReportOutputFormatBinding",
  label: "Report Output Format Binding",
  metadataKeys: [
    "displayName",
    "reportDefinitionId",
    "outputFormat",
    "isDefault",
    "status",
    "externalId",
  ],
});

/**
 * Distribution — communications.core recipients / delivery policy;
 * scheduling.core schedule reference. No transport.
 */
export const ReportDistributionEntity = reportingEntity({
  entityType: "ReportDistribution",
  label: "Report Distribution",
  metadataKeys: [
    "displayName",
    "reportDefinitionId",
    "recipientPersonId",
    "recipientGroupId",
    "communicationNotificationId",
    "deliveryPolicyId",
    "scheduleItemId",
    "status",
    "externalId",
  ],
});

export const REPORTING_ENTITY_DEFINITIONS: readonly EntityModel[] =
  Object.freeze(
    [
      ReportDataSourceRefEntity,
      ReportDefinitionEntity,
      ReportDistributionEntity,
      ReportFilterDefinitionEntity,
      ReportMetricDefinitionEntity,
      ReportOutputFormatBindingEntity,
      ReportParameterEntity,
      ReportSectionEntity,
      ReportTypeEntity,
    ].sort((a, b) => a.entityType.localeCompare(b.entityType))
  );
