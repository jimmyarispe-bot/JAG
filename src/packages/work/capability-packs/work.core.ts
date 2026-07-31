/**
 * work.core — fifth production Capability Pack.
 * Authored as a third-party pack: no platform privileges, no Academy logic.
 */

import type { CapabilityPack } from "@/jag/blueprints";
import { getCapabilityPackLicense } from "@/jag/capability-packs";
import {
  assembleWorkContributionBundle,
  workPackCatalogPayload,
} from "@/packages/work/capability-packs/assemble";
import {
  WORK_APPLICATION_ID,
  WORK_PACKAGE_VERSION,
  WORK_PACK_ID,
} from "@/packages/work/package";

export function buildWorkCorePack(): CapabilityPack {
  const bundle = assembleWorkContributionBundle();
  return Object.freeze({
    id: WORK_PACK_ID,
    name: "Work",
    label: "Universal Organizational Work",
    description:
      "Organizational effort — work items, assignments, objectives, milestones, dependencies, and completion. BPM, project management, and payroll remain separate.",
    version: WORK_PACKAGE_VERSION,
    publisher: "JAG",
    status: "published" as const,
    license: getCapabilityPackLicense("jag.platform"),
    modules: Object.freeze(["work"]),
    providesModules: Object.freeze(["work"]),
    tags: Object.freeze([
      "work",
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
        "work",
        "tasks",
        "assignments",
        "objectives",
        "milestones",
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
    ]),
    upgrades: Object.freeze([]),
    ...bundle,
  });
}

export function buildWorkCapabilityPacks(): readonly CapabilityPack[] {
  return Object.freeze([buildWorkCorePack()]);
}

export function describeWorkCorePack() {
  const pack = buildWorkCorePack();
  return Object.freeze({
    packId: pack.id,
    version: pack.version,
    applicationId: WORK_APPLICATION_ID,
    entityTypes: (pack.entities ?? []).map((e) => e.entityType),
    permissionPackIds: (pack.permissions ?? []).map((p) => p.id),
    catalogs: workPackCatalogPayload(),
    dependencies: pack.dependencies,
  });
}
