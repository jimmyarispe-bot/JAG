/**
 * Blueprint Framework v1 — forbidden Industry Blueprint content.
 */

/** Substrings that must not appear in Industry Blueprint configuration JSON. */
export const FORBIDDEN_INDUSTRY_PACK_ID_SUFFIXES = Object.freeze([
  ".core",
] as const);

/** Known foundation pack ids — must not appear on Industry Blueprints. */
export const FORBIDDEN_INDUSTRY_PACK_IDS = Object.freeze([
  "identity.core",
  "documents.core",
  "communications.core",
  "scheduling.core",
  "work.core",
  "decision.core",
  "policy.core",
  "reporting.core",
  "analytics.core",
] as const);

/** Symbols / patterns Industry Blueprints must not reference. */
export const FORBIDDEN_INDUSTRY_IMPLEMENTATION_MARKERS = Object.freeze([
  "ProcessRuntime",
  "DecisionRuntime",
  "compileApplicationModel",
  "generateRuntimeSpecification",
  "EntityService",
] as const);
