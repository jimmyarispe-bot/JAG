/**
 * Blueprint Framework v1 — naming conventions (documentation as constants).
 */

export const BLUEPRINT_NAMING_TERMS = Object.freeze({
  Blueprint: "Industry or Organization declarative specification",
  Catalog: "Named collection of industry vocabulary defaults",
  Organization: "Tenant / customer overlay on an industry",
  Module: "Logical capability area key (never a pack id)",
  Profile: "Studio suggestion surface for an industry",
  Contribution: "Declarative model fragment merged into a Runtime Spec",
  Validation: "Structural / framework check (not runtime execution)",
  Proof: "Written evidence that a validation phase passed",
  Runtime: "Compiled, registered JAG operating state",
} as const);

/** Patterns for industry package / organization ids (guidance). */
export const BLUEPRINT_NAMING_PATTERNS = Object.freeze({
  industryId: "lowercase singular domain token (education, healthcare, …)",
  organizationId: "<org-slug>.organization",
  packageId: "lowercase package folder name",
  applicationId: "lowercase application slug",
  catalogEntryId: "snake_case stable id",
  terminologyPackId: "industry.<industryId>.terminology.default",
  permissionPackId: "industry.<industryId>.permission.core",
  reportId: "industry.<industryId>.report.<name>",
} as const);
