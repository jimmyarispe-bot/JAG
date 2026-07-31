/**
 * policy.core — eighth production Capability Pack.
 * Authored as a third-party pack: no platform privileges, no Academy logic.
 */

import type { CapabilityPack } from "@/jag/blueprints";
import { getCapabilityPackLicense } from "@/jag/capability-packs";
import {
  assemblePolicyContributionBundle,
  policyPackCatalogPayload,
} from "@/packages/policy/capability-packs/assemble";
import {
  POLICY_APPLICATION_ID,
  POLICY_PACKAGE_VERSION,
  POLICY_PACK_ID,
} from "@/packages/policy/package";

export function buildPolicyCorePack(): CapabilityPack {
  const bundle = assemblePolicyContributionBundle();
  return Object.freeze({
    id: POLICY_PACK_ID,
    name: "Policy",
    label: "Universal Organizational Policy",
    description:
      "Governance representations — policies, standards, procedures, controls, obligations, exceptions, applicability, and acknowledgements. Rule engines, authorization, and workflow automation remain separate.",
    version: POLICY_PACKAGE_VERSION,
    publisher: "JAG",
    status: "published" as const,
    license: getCapabilityPackLicense("jag.platform"),
    modules: Object.freeze(["policy"]),
    providesModules: Object.freeze(["policy"]),
    tags: Object.freeze([
      "policy",
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
        "policy",
        "governance",
        "controls",
        "obligations",
        "exceptions",
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

export function buildPolicyCapabilityPacks(): readonly CapabilityPack[] {
  return Object.freeze([buildPolicyCorePack()]);
}

export function describePolicyCorePack() {
  const pack = buildPolicyCorePack();
  return Object.freeze({
    packId: pack.id,
    version: pack.version,
    applicationId: POLICY_APPLICATION_ID,
    entityTypes: (pack.entities ?? []).map((e) => e.entityType),
    permissionPackIds: (pack.permissions ?? []).map((p) => p.id),
    catalogs: policyPackCatalogPayload(),
    dependencies: pack.dependencies,
  });
}
