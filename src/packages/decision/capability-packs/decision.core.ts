/**
 * decision.core — sixth production Capability Pack.
 * Authored as a third-party pack: no platform privileges, no Academy logic.
 */

import type { CapabilityPack } from "@/jag/blueprints";
import { getCapabilityPackLicense } from "@/jag/capability-packs";
import {
  assembleDecisionContributionBundle,
  decisionPackCatalogPayload,
} from "@/packages/decision/capability-packs/assemble";
import {
  DECISION_APPLICATION_ID,
  DECISION_PACKAGE_VERSION,
  DECISION_PACK_ID,
} from "@/packages/decision/package";

export function buildDecisionCorePack(): CapabilityPack {
  const bundle = assembleDecisionContributionBundle();
  return Object.freeze({
    id: DECISION_PACK_ID,
    name: "Decision",
    label: "Universal Organizational Decision",
    description:
      "Organizational choice — decisions, options, rationale, evidence, approval representations, outcomes, and traceability. Decision Engine execution, AI, voting, and policy enforcement remain separate.",
    version: DECISION_PACKAGE_VERSION,
    publisher: "JAG",
    status: "published" as const,
    license: getCapabilityPackLicense("jag.platform"),
    modules: Object.freeze(["decision"]),
    providesModules: Object.freeze(["decision"]),
    tags: Object.freeze([
      "decision",
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
        "decision",
        "options",
        "rationale",
        "evidence",
        "approvals",
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
    ]),
    upgrades: Object.freeze([]),
    ...bundle,
  });
}

export function buildDecisionCapabilityPacks(): readonly CapabilityPack[] {
  return Object.freeze([buildDecisionCorePack()]);
}

export function describeDecisionCorePack() {
  const pack = buildDecisionCorePack();
  return Object.freeze({
    packId: pack.id,
    version: pack.version,
    applicationId: DECISION_APPLICATION_ID,
    entityTypes: (pack.entities ?? []).map((e) => e.entityType),
    permissionPackIds: (pack.permissions ?? []).map((p) => p.id),
    catalogs: decisionPackCatalogPayload(),
    dependencies: pack.dependencies,
  });
}
