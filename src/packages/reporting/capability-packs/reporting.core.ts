/**
 * reporting.core — seventh production Capability Pack.
 * Authored as a third-party pack: no platform privileges, no Academy logic.
 */

import type { CapabilityPack } from "@/jag/blueprints";
import { getCapabilityPackLicense } from "@/jag/capability-packs";
import {
  assembleReportingContributionBundle,
  reportingPackCatalogPayload,
} from "@/packages/reporting/capability-packs/assemble";
import {
  REPORTING_APPLICATION_ID,
  REPORTING_PACKAGE_VERSION,
  REPORTING_PACK_ID,
} from "@/packages/reporting/package";

export function buildReportingCorePack(): CapabilityPack {
  const bundle = assembleReportingContributionBundle();
  return Object.freeze({
    id: REPORTING_PACK_ID,
    name: "Reporting",
    label: "Universal Organizational Reporting",
    description:
      "Report definitions, sections, data-source references, metrics, filters, parameters, output formats, and distribution — structure only. Analytics, query execution, and rendering remain separate.",
    version: REPORTING_PACKAGE_VERSION,
    publisher: "JAG",
    status: "published" as const,
    license: getCapabilityPackLicense("jag.platform"),
    modules: Object.freeze(["reporting"]),
    providesModules: Object.freeze(["reporting"]),
    tags: Object.freeze([
      "reporting",
      "foundation",
      "universal",
      "production-pack",
    ]),
    compatibility: Object.freeze({
      jagRuntimeMin: "1.0.0",
    }),
    discovery: Object.freeze({
      category: "foundation",
      keywords: Object.freeze([
        "reporting",
        "reports",
        "metrics",
        "filters",
        "distribution",
      ]),
      featured: true,
    }),
    dependencies: Object.freeze([
      Object.freeze({
        packId: "identity.core",
        versionRange: "^1.0.0",
        optional: false,
      }),
      Object.freeze({
        packId: "documents.core",
        versionRange: "^1.0.0",
        optional: false,
      }),
      Object.freeze({
        packId: "communications.core",
        versionRange: "^1.0.0",
        optional: false,
      }),
      Object.freeze({
        packId: "scheduling.core",
        versionRange: "^1.0.0",
        optional: false,
      }),
      Object.freeze({
        packId: "work.core",
        versionRange: "^1.0.0",
        optional: false,
      }),
      Object.freeze({
        packId: "decision.core",
        versionRange: "^1.0.0",
        optional: false,
      }),
    ]),
    upgrades: Object.freeze([]),
    ...bundle,
  });
}

export function buildReportingCapabilityPacks(): readonly CapabilityPack[] {
  return Object.freeze([buildReportingCorePack()]);
}

export function describeReportingCorePack() {
  const pack = buildReportingCorePack();
  return Object.freeze({
    packId: pack.id,
    version: pack.version,
    applicationId: REPORTING_APPLICATION_ID,
    entityTypes: (pack.entities ?? []).map((e) => e.entityType),
    permissionPackIds: (pack.permissions ?? []).map((p) => p.id),
    catalogs: reportingPackCatalogPayload(),
    dependencies: pack.dependencies,
  });
}
