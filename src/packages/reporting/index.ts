/**
 * Reporting Capability Pack — Universal Organizational Reporting.
 */

export {
  REPORTING_APPLICATION_ID,
  REPORTING_PACKAGE_ID,
  REPORTING_PACKAGE_VERSION,
  REPORTING_PACK_ID,
} from "@/packages/reporting/package";

export {
  buildReportingCapabilityPacks,
  buildReportingCorePack,
  describeReportingCorePack,
  assembleReportingContributionBundle,
  reportingPackCatalogPayload,
} from "@/packages/reporting/capability-packs";

export {
  REPORTING_ENTITY_DEFINITIONS,
  ReportDefinitionEntity,
  ReportDataSourceRefEntity,
  ReportDistributionEntity,
  ReportFilterDefinitionEntity,
  ReportMetricDefinitionEntity,
  ReportSectionEntity,
} from "@/packages/reporting/entities";
export {
  REPORTING_PERMISSION_KEYS,
  REPORTING_PERMISSION_PACK,
  REPORTING_PERMISSION_PACK_ID,
  REPORTING_PERMISSION_PACKS,
} from "@/packages/reporting/permissions";
export { REPORTING_NAVIGATION } from "@/packages/reporting/navigation";
export {
  REPORT_TYPE_EXAMPLES,
  REPORT_DATA_SOURCE_PACKS,
  REPORT_OUTPUT_FORMATS,
  REPORT_LIFECYCLE_STATES,
  REPORT_FILTER_DIMENSIONS,
} from "@/packages/reporting/catalogs";

export {
  buildReportingProofOrganizationBlueprint,
  compileReportingProofRuntime,
  generateReportingProofRuntime,
  registerReportingHandwrittenBaseline,
  resetReportingProofPortsForTests,
  listReportingProofPermissionPacks,
} from "@/packages/reporting/proof";
