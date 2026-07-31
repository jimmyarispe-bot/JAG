/**
 * Education foundation composition — module graph only.
 *
 * Constitutional note: Industry Blueprints must not own package ids.
 * Organizations resolve modules → CapabilityPack instances when attaching packs.
 *
 * Conceptual mapping (documented; pack ids owned by Organization / package layer):
 *   identity → identity.core
 *   documents → documents.core
 *   communications → communications.core
 *   scheduling → scheduling.core
 *   work → work.core
 *   decision → decision.core
 *   policy → policy.core
 *   reporting → reporting.core
 *   analytics → analytics.core
 */

import {
  EDUCATION_FOUNDATION_MODULES,
  EDUCATION_VERTICAL_MODULES,
} from "@/jag/blueprints/industries/education/catalogs";

export type EducationFoundationModule =
  (typeof EDUCATION_FOUNDATION_MODULES)[number];

export type EducationVerticalModule =
  (typeof EDUCATION_VERTICAL_MODULES)[number];

/** Ordered foundation module composition for Education v2. */
export const EDUCATION_BLUEPRINT_COMPOSITION = Object.freeze({
  version: "2.0.0",
  foundationModules: EDUCATION_FOUNDATION_MODULES,
  verticalModules: EDUCATION_VERTICAL_MODULES,
  /** Human-readable capability keys (not package ids). */
  foundationCapabilities: Object.freeze([
    Object.freeze({ module: "identity", capability: "identity" }),
    Object.freeze({ module: "documents", capability: "documents" }),
    Object.freeze({ module: "communications", capability: "communications" }),
    Object.freeze({ module: "scheduling", capability: "scheduling" }),
    Object.freeze({ module: "work", capability: "work" }),
    Object.freeze({ module: "decision", capability: "decision" }),
    Object.freeze({ module: "policy", capability: "policy" }),
    Object.freeze({ module: "reporting", capability: "reporting" }),
    Object.freeze({ module: "analytics", capability: "analytics" }),
  ]),
});
