/**
 * Academy capability packs — attached to Organization Blueprint for Runtime Generation.
 * Conforms to Capability Pack Architecture (Sprint 019).
 */

import type { CapabilityPack } from "@/jag/blueprints";
import { getCapabilityPackLicense } from "@/jag/capability-packs";
import { assembleAcademyContributionBundle } from "@/packages/academy/capability-packs/assemble-contributions";
import { ACADEMY_PACKAGE_VERSION } from "@/packages/academy/package";

/**
 * Build Academy capability packs from package seed definitions.
 * Transitional reference pack until production Identity + domain packs exist.
 */
export function buildAcademyCapabilityPacks(): readonly CapabilityPack[] {
  const bundle = assembleAcademyContributionBundle();
  return Object.freeze([
    Object.freeze({
      id: "academy.core",
      name: "Academy Core",
      label: "Academy Core",
      description:
        "Academy organization vertical pack — admissions/SIS/education-specific seeds. Foundation domains come from production packs (identity, documents, communications, scheduling, work, decision, policy, reporting, analytics).",
      version: ACADEMY_PACKAGE_VERSION,
      publisher: "JAG",
      status: "published" as const,
      license: getCapabilityPackLicense("jag.reference"),
      // Still provides transitional modules until Academy seeds migrate fully.
      modules: Object.freeze([
        "admissions",
        "sis",
        "scheduling",
        "communications",
        "documents",
        "reports",
      ]),
      providesModules: Object.freeze([
        "admissions",
        "sis",
        "scheduling",
        "communications",
        "documents",
        "reports",
      ]),
      tags: Object.freeze(["academy", "reference-package", "education"]),
      compatibility: Object.freeze({
        industryIds: Object.freeze(["education" as const]),
        jagRuntimeMin: "1.0.0",
      }),
      discovery: Object.freeze({
        category: "reference",
        keywords: Object.freeze([
          "academy",
          "education",
          "sis",
          "admissions",
        ]),
        featured: true,
      }),
      dependencies: Object.freeze([
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
      ]),
      upgrades: Object.freeze([]),
      ...bundle,
    }),
  ]);
}
