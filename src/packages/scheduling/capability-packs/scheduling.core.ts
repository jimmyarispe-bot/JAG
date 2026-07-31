/**
 * scheduling.core — fourth production Capability Pack.
 * Authored as a third-party pack: no platform privileges, no Academy logic.
 */

import type { CapabilityPack } from "@/jag/blueprints";
import { getCapabilityPackLicense } from "@/jag/capability-packs";
import {
  assembleSchedulingContributionBundle,
  schedulingPackCatalogPayload,
} from "@/packages/scheduling/capability-packs/assemble";
import {
  SCHEDULING_APPLICATION_ID,
  SCHEDULING_PACKAGE_VERSION,
  SCHEDULING_PACK_ID,
} from "@/packages/scheduling/package";

export function buildSchedulingCorePack(): CapabilityPack {
  const bundle = assembleSchedulingContributionBundle();
  return Object.freeze({
    id: SCHEDULING_PACK_ID,
    name: "Scheduling",
    label: "Universal Organizational Scheduling",
    description:
      "Time coordination — schedule items, participants, resources, availability, recurrence, conflicts, and invitations. Calendars, meetings, and attendance remain separate.",
    version: SCHEDULING_PACKAGE_VERSION,
    publisher: "JAG",
    status: "published" as const,
    license: getCapabilityPackLicense("jag.platform"),
    modules: Object.freeze(["scheduling"]),
    providesModules: Object.freeze(["scheduling"]),
    tags: Object.freeze([
      "scheduling",
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
        "scheduling",
        "availability",
        "resources",
        "recurrence",
        "appointments",
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
    ]),
    upgrades: Object.freeze([]),
    ...bundle,
  });
}

export function buildSchedulingCapabilityPacks(): readonly CapabilityPack[] {
  return Object.freeze([buildSchedulingCorePack()]);
}

export function describeSchedulingCorePack() {
  const pack = buildSchedulingCorePack();
  return Object.freeze({
    packId: pack.id,
    version: pack.version,
    applicationId: SCHEDULING_APPLICATION_ID,
    entityTypes: (pack.entities ?? []).map((e) => e.entityType),
    permissionPackIds: (pack.permissions ?? []).map((p) => p.id),
    catalogs: schedulingPackCatalogPayload(),
    dependencies: pack.dependencies,
  });
}
