/**
 * documents.core — second production Capability Pack.
 * Authored as a third-party pack: no platform privileges, no Academy logic.
 */

import type { CapabilityPack } from "@/jag/blueprints";
import { getCapabilityPackLicense } from "@/jag/capability-packs";
import {
  assembleDocumentsContributionBundle,
  documentsPackCatalogPayload,
} from "@/packages/documents/capability-packs/assemble";
import {
  DOCUMENTS_APPLICATION_ID,
  DOCUMENTS_PACKAGE_VERSION,
  DOCUMENTS_PACK_ID,
} from "@/packages/documents/package";

export function buildDocumentsCorePack(): CapabilityPack {
  const bundle = assembleDocumentsContributionBundle();
  return Object.freeze({
    id: DOCUMENTS_PACK_ID,
    name: "Documents",
    label: "Universal Organizational Documents",
    description:
      "Business documents, templates, versions, relationships, classification, signatures, and retention — definitions only. File storage is infrastructure.",
    version: DOCUMENTS_PACKAGE_VERSION,
    publisher: "JAG",
    status: "published" as const,
    license: getCapabilityPackLicense("jag.platform"),
    modules: Object.freeze(["documents"]),
    providesModules: Object.freeze(["documents"]),
    tags: Object.freeze([
      "documents",
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
        "documents",
        "templates",
        "versioning",
        "retention",
        "classification",
      ]),
      featured: true,
    }),
    dependencies: Object.freeze([
      Object.freeze({
        packId: "identity.core",
        versionRange: "^1.0.0",
        optional: true,
      }),
    ]),
    upgrades: Object.freeze([]),
    ...bundle,
  });
}

export function buildDocumentsCapabilityPacks(): readonly CapabilityPack[] {
  return Object.freeze([buildDocumentsCorePack()]);
}

export function describeDocumentsCorePack() {
  const pack = buildDocumentsCorePack();
  return Object.freeze({
    packId: pack.id,
    version: pack.version,
    applicationId: DOCUMENTS_APPLICATION_ID,
    entityTypes: (pack.entities ?? []).map((e) => e.entityType),
    permissionPackIds: (pack.permissions ?? []).map((p) => p.id),
    catalogs: documentsPackCatalogPayload(),
  });
}
