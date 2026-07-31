/**
 * Blueprint Framework v1 — published standard constants.
 */

import {
  BLUEPRINT_FRAMEWORK_VERSION,
  REQUIRED_INDUSTRY_CATALOG_KEYS,
  ORGANIZATION_OVERLAY_ALLOWED,
  ORGANIZATION_OVERLAY_FORBIDDEN,
} from "@/jag/blueprint-framework/contracts";
import {
  BLUEPRINT_FOUNDATION_MODULES,
  BLUEPRINT_FOUNDATION_CAPABILITY_MAP,
  BLUEPRINT_FOUNDATION_PACK_ID_RESOLUTION,
  BLUEPRINT_NAMING_TERMS,
  BLUEPRINT_NAMING_PATTERNS,
  FORBIDDEN_INDUSTRY_PACK_IDS,
} from "@/jag/blueprint-framework/conventions";

/**
 * Single export summarizing the authoring standard.
 * Documentation / validation aid — not a runtime engine.
 */
export const BLUEPRINT_FRAMEWORK_STANDARD = Object.freeze({
  version: BLUEPRINT_FRAMEWORK_VERSION,
  foundationModules: BLUEPRINT_FOUNDATION_MODULES,
  foundationCapabilityMap: BLUEPRINT_FOUNDATION_CAPABILITY_MAP,
  /** Documented pack resolution — Organization-owned; never Industry-owned. */
  foundationPackIdResolution: BLUEPRINT_FOUNDATION_PACK_ID_RESOLUTION,
  requiredCatalogKeys: REQUIRED_INDUSTRY_CATALOG_KEYS,
  organizationOverlay: Object.freeze({
    allowed: ORGANIZATION_OVERLAY_ALLOWED,
    forbidden: ORGANIZATION_OVERLAY_FORBIDDEN,
  }),
  naming: Object.freeze({
    terms: BLUEPRINT_NAMING_TERMS,
    patterns: BLUEPRINT_NAMING_PATTERNS,
  }),
  forbiddenIndustryPackIds: FORBIDDEN_INDUSTRY_PACK_IDS,
  layering: Object.freeze([
    "Platform",
    "Capability Packs",
    "Industry Blueprint",
    "Organization Blueprint",
    "Runtime Generation",
    "Compiler",
    "Runtime",
  ] as const),
});
