import type { BlueprintContributionBundle } from "@/jag/blueprints";
import {
  REPORT_DATA_SOURCE_PACKS,
  REPORT_FILTER_DIMENSIONS,
  REPORT_LIFECYCLE_STATES,
  REPORT_OUTPUT_FORMATS,
  REPORT_TYPE_EXAMPLES,
} from "@/packages/reporting/catalogs";
import { REPORTING_ENTITY_DEFINITIONS } from "@/packages/reporting/entities";
import { REPORTING_NAVIGATION } from "@/packages/reporting/navigation";
import { REPORTING_PERMISSION_PACKS } from "@/packages/reporting/permissions";

export function assembleReportingContributionBundle(): BlueprintContributionBundle {
  return Object.freeze({
    entities: REPORTING_ENTITY_DEFINITIONS,
    permissions: REPORTING_PERMISSION_PACKS,
    navigation: Object.freeze([REPORTING_NAVIGATION]),
    processes: Object.freeze([]),
    decisions: Object.freeze([]),
    forms: Object.freeze([]),
    reports: Object.freeze([]),
    workflows: Object.freeze([]),
    terminology: Object.freeze([
      Object.freeze({
        id: "reporting.terminology.default",
        label: "Reporting default terminology",
        terms: Object.freeze({
          report: "Report",
          metric: "Metric",
          section: "Section",
          distribution: "Distribution",
        }),
      }),
    ]),
    integrations: Object.freeze([]),
  });
}

export function reportingPackCatalogPayload() {
  return Object.freeze({
    reportTypeExamples: REPORT_TYPE_EXAMPLES,
    dataSourcePacks: REPORT_DATA_SOURCE_PACKS,
    outputFormats: REPORT_OUTPUT_FORMATS,
    lifecycleStates: REPORT_LIFECYCLE_STATES,
    filterDimensions: REPORT_FILTER_DIMENSIONS,
  });
}
