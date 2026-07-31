/**
 * Blueprint Framework v1 — organization overlay rules (declarative).
 */

/** Keys an Organization Blueprint may contribute (conceptual). */
export const ORGANIZATION_OVERLAY_ALLOWED = Object.freeze([
  "branding",
  "departments",
  "locations",
  "organizationalPolicies",
  "organizationAnswers",
  "localTerminology",
  "enabledModules",
  "capabilityPackAttachment",
  "disableLists",
] as const);

/** Concerns forbidden on Organization Blueprints. */
export const ORGANIZATION_OVERLAY_FORBIDDEN = Object.freeze([
  "runtimeLogic",
  "compilerHooks",
  "capabilityDefinitions",
  "platformEngines",
  "industryCatalogDuplication",
] as const);

export type OrganizationOverlayRuleSet = {
  readonly allowed: typeof ORGANIZATION_OVERLAY_ALLOWED;
  readonly forbidden: typeof ORGANIZATION_OVERLAY_FORBIDDEN;
};
