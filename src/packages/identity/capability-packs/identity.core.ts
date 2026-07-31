/**
 * identity.core — first production Capability Pack.
 * Authored as a third-party pack would be: no platform privileges.
 */

import type { CapabilityPack } from "@/jag/blueprints";
import { getCapabilityPackLicense } from "@/jag/capability-packs";
import {
  assembleIdentityContributionBundle,
  identityPackCatalogPayload,
} from "@/packages/identity/capability-packs/assemble";
import {
  IDENTITY_APPLICATION_ID,
  IDENTITY_PACKAGE_VERSION,
  IDENTITY_PACK_ID,
} from "@/packages/identity/package";

export function buildIdentityCorePack(): CapabilityPack {
  const bundle = assembleIdentityContributionBundle();
  return Object.freeze({
    id: IDENTITY_PACK_ID,
    name: "Identity",
    label: "Universal Organizational Identity",
    description:
      "Organizations, people, membership, roles, groups, profiles, and permission bindings — definitions only. Authorization remains JAG.",
    version: IDENTITY_PACKAGE_VERSION,
    publisher: "JAG",
    status: "published" as const,
    license: getCapabilityPackLicense("jag.platform"),
    modules: Object.freeze(["identity"]),
    providesModules: Object.freeze(["identity"]),
    tags: Object.freeze([
      "identity",
      "foundation",
      "universal",
      "production-pack",
    ]),
    compatibility: Object.freeze({
      // Universal — empty industry allow-list means all industries.
      jagRuntimeMin: "1.0.0",
    }),
    discovery: Object.freeze({
      category: "foundation",
      keywords: Object.freeze([
        "identity",
        "people",
        "roles",
        "organizations",
        "groups",
        "membership",
      ]),
      featured: true,
    }),
    dependencies: Object.freeze([]),
    upgrades: Object.freeze([]),
    ...bundle,
  });
}

export function buildIdentityCapabilityPacks(): readonly CapabilityPack[] {
  return Object.freeze([buildIdentityCorePack()]);
}

/** Manifest snapshot for documentation / Studio (includes catalogs). */
export function describeIdentityCorePack() {
  const pack = buildIdentityCorePack();
  return Object.freeze({
    packId: pack.id,
    version: pack.version,
    applicationId: IDENTITY_APPLICATION_ID,
    entityTypes: (pack.entities ?? []).map((e) => e.entityType),
    permissionPackIds: (pack.permissions ?? []).map((p) => p.id),
    catalogs: identityPackCatalogPayload(),
  });
}
