/**
 * communications.core — third production Capability Pack.
 * Authored as a third-party pack: no platform privileges, no Academy logic.
 */

import type { CapabilityPack } from "@/jag/blueprints";
import { getCapabilityPackLicense } from "@/jag/capability-packs";
import {
  assembleCommunicationsContributionBundle,
  communicationsPackCatalogPayload,
} from "@/packages/communications/capability-packs/assemble";
import {
  COMMUNICATIONS_APPLICATION_ID,
  COMMUNICATIONS_PACKAGE_VERSION,
  COMMUNICATIONS_PACK_ID,
} from "@/packages/communications/package";

export function buildCommunicationsCorePack(): CapabilityPack {
  const bundle = assembleCommunicationsContributionBundle();
  return Object.freeze({
    id: COMMUNICATIONS_PACK_ID,
    name: "Communications",
    label: "Universal Organizational Communications",
    description:
      "Messages, conversations, channels, notifications, campaigns, preferences, templates, and delivery policies — intent only. Transport is integration.",
    version: COMMUNICATIONS_PACKAGE_VERSION,
    publisher: "JAG",
    status: "published" as const,
    license: getCapabilityPackLicense("jag.platform"),
    modules: Object.freeze(["communications"]),
    providesModules: Object.freeze(["communications"]),
    tags: Object.freeze([
      "communications",
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
        "communications",
        "notifications",
        "conversations",
        "campaigns",
        "channels",
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
    ]),
    upgrades: Object.freeze([]),
    ...bundle,
  });
}

export function buildCommunicationsCapabilityPacks(): readonly CapabilityPack[] {
  return Object.freeze([buildCommunicationsCorePack()]);
}

export function describeCommunicationsCorePack() {
  const pack = buildCommunicationsCorePack();
  return Object.freeze({
    packId: pack.id,
    version: pack.version,
    applicationId: COMMUNICATIONS_APPLICATION_ID,
    entityTypes: (pack.entities ?? []).map((e) => e.entityType),
    permissionPackIds: (pack.permissions ?? []).map((p) => p.id),
    catalogs: communicationsPackCatalogPayload(),
    dependencies: pack.dependencies,
  });
}
