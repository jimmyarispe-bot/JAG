/**
 * analytics.core — ninth production Capability Pack.
 * Authored as a third-party pack: no platform privileges, no Academy logic.
 *
 * Lean dependency: requires reporting.core; other foundation packs are optional refs.
 */

import type { CapabilityPack } from "@/jag/blueprints";
import { getCapabilityPackLicense } from "@/jag/capability-packs";
import {
  assembleAnalyticsContributionBundle,
  analyticsPackCatalogPayload,
} from "@/packages/analytics/capability-packs/assemble";
import {
  ANALYTICS_APPLICATION_ID,
  ANALYTICS_PACKAGE_VERSION,
  ANALYTICS_PACK_ID,
} from "@/packages/analytics/package";

export function buildAnalyticsCorePack(): CapabilityPack {
  const bundle = assembleAnalyticsContributionBundle();
  return Object.freeze({
    id: ANALYTICS_PACK_ID,
    name: "Analytics",
    label: "Universal Organizational Analytics",
    description:
      "Analytical model — metrics, KPIs, dimensions, measures, trends, benchmarks, forecasts, and insight templates. Query engines, ML, and dashboards remain separate.",
    version: ANALYTICS_PACKAGE_VERSION,
    publisher: "JAG",
    status: "published" as const,
    license: getCapabilityPackLicense("jag.platform"),
    modules: Object.freeze(["analytics"]),
    providesModules: Object.freeze(["analytics"]),
    tags: Object.freeze([
      "analytics",
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
        "analytics",
        "metrics",
        "kpis",
        "trends",
        "forecasts",
      ]),
      featured: true,
    }),
    dependencies: Object.freeze([
      Object.freeze({
        packId: "reporting.core",
        versionRange: "^1.0.0",
        optional: false,
      }),
      Object.freeze({
        packId: "identity.core",
        versionRange: "^1.0.0",
        optional: true,
      }),
      Object.freeze({
        packId: "documents.core",
        versionRange: "^1.0.0",
        optional: true,
      }),
      Object.freeze({
        packId: "communications.core",
        versionRange: "^1.0.0",
        optional: true,
      }),
      Object.freeze({
        packId: "scheduling.core",
        versionRange: "^1.0.0",
        optional: true,
      }),
      Object.freeze({
        packId: "work.core",
        versionRange: "^1.0.0",
        optional: true,
      }),
      Object.freeze({
        packId: "decision.core",
        versionRange: "^1.0.0",
        optional: true,
      }),
      Object.freeze({
        packId: "policy.core",
        versionRange: "^1.0.0",
        optional: true,
      }),
    ]),
    upgrades: Object.freeze([]),
    ...bundle,
  });
}

export function buildAnalyticsCapabilityPacks(): readonly CapabilityPack[] {
  return Object.freeze([buildAnalyticsCorePack()]);
}

export function describeAnalyticsCorePack() {
  const pack = buildAnalyticsCorePack();
  return Object.freeze({
    packId: pack.id,
    version: pack.version,
    applicationId: ANALYTICS_APPLICATION_ID,
    entityTypes: (pack.entities ?? []).map((e) => e.entityType),
    permissionPackIds: (pack.permissions ?? []).map((p) => p.id),
    catalogs: analyticsPackCatalogPayload(),
    dependencies: pack.dependencies,
  });
}
