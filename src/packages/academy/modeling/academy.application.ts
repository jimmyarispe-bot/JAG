/**
 * Academy ApplicationModel — legacy Sprint 014 shape.
 * Built from capability-pack contribution assembly (same seeds).
 * Prefer Runtime Generation from Organization Blueprint capability packs.
 */

import type { ApplicationModel } from "@/jag/modeling";
import { assembleAcademyContributionBundle } from "@/packages/academy/capability-packs/assemble-contributions";
import {
  ACADEMY_APPLICATION_ID,
  ACADEMY_PACKAGE_ID,
  ACADEMY_PACKAGE_VERSION,
} from "@/packages/academy/package";

/**
 * Canonical Academy application model (Sprint 014 compatibility).
 * Runtime Generation path does not use this as the hot path.
 */
export function buildAcademyApplicationModel(): ApplicationModel {
  const bundle = assembleAcademyContributionBundle();
  return Object.freeze({
    metadata: Object.freeze({
      id: ACADEMY_PACKAGE_ID,
      applicationId: ACADEMY_APPLICATION_ID,
      displayName: "Academy",
      description:
        "Reference education application package for The JAG OS (model-driven).",
      version: ACADEMY_PACKAGE_VERSION,
      publisher: "JAG",
      tags: Object.freeze([
        "education",
        "reference-package",
        "sis",
        "scheduling",
      ]),
    }),
    ...bundle,
    configuration: Object.freeze({ keys: Object.freeze({}) }),
  });
}
