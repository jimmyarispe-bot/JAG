/**
 * Blueprint Framework v1 — standard foundation modules.
 * Module keys only. Pack ids are owned by Organization Blueprints.
 */

/** Ordered foundation modules every Industry Blueprint must include. */
export const BLUEPRINT_FOUNDATION_MODULES = Object.freeze([
  "identity",
  "documents",
  "communications",
  "scheduling",
  "work",
  "decision",
  "policy",
  "reporting",
  "analytics",
] as const);

export type BlueprintFoundationModule =
  (typeof BLUEPRINT_FOUNDATION_MODULES)[number];

/**
 * Conceptual module → capability key mapping.
 * Organizations resolve capability keys to pack ids at attachment time.
 */
export const BLUEPRINT_FOUNDATION_CAPABILITY_MAP = Object.freeze(
  BLUEPRINT_FOUNDATION_MODULES.map((module) =>
    Object.freeze({ module, capability: module })
  )
);

/** Documented pack id resolution (Organization-owned; never on Industry Blueprint). */
export const BLUEPRINT_FOUNDATION_PACK_ID_RESOLUTION = Object.freeze({
  identity: "identity.core",
  documents: "documents.core",
  communications: "communications.core",
  scheduling: "scheduling.core",
  work: "work.core",
  decision: "decision.core",
  policy: "policy.core",
  reporting: "reporting.core",
  analytics: "analytics.core",
} as const);
