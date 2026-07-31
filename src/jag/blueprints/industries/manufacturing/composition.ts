/**
 * Manufacturing foundation composition — module graph only.
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
  MANUFACTURING_FOUNDATION_MODULES,
  MANUFACTURING_VERTICAL_MODULES,
} from "@/jag/blueprints/industries/manufacturing/catalogs";

export type ManufacturingFoundationModule =
  (typeof MANUFACTURING_FOUNDATION_MODULES)[number];

export type ManufacturingVerticalModule =
  (typeof MANUFACTURING_VERTICAL_MODULES)[number];

/** Ordered foundation module composition for Manufacturing v1. */
export const MANUFACTURING_BLUEPRINT_COMPOSITION = Object.freeze({
  version: "1.0.0",
  foundationModules: MANUFACTURING_FOUNDATION_MODULES,
  verticalModules: MANUFACTURING_VERTICAL_MODULES,
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
