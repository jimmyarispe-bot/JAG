/**
 * Blueprint Framework v1 — authoring contracts.
 * Types and constants only. No runtime behavior.
 */

import type { IndustryBlueprintComposition } from "@/jag/blueprint-framework/contracts/composition";
import type { IndustryCatalogPayload } from "@/jag/blueprint-framework/contracts/catalogs";

export const BLUEPRINT_FRAMEWORK_VERSION = "1.0.0" as const;

/**
 * Expected shape of IndustryBlueprint.configuration.keys for framework v1.
 * Stored as data on the industry blueprint — not enforced by Platform engines.
 */
export type FrameworkIndustryConfigurationKeys = {
  readonly industry: string;
  readonly blueprintEdition?: string;
  readonly composition: IndustryBlueprintComposition;
  readonly catalogs: IndustryCatalogPayload;
};

export type FrameworkValidationIssue = {
  readonly path: string;
  readonly code: string;
  readonly message: string;
};

export type FrameworkValidationResult = {
  readonly ok: boolean;
  readonly frameworkVersion: typeof BLUEPRINT_FRAMEWORK_VERSION;
  readonly industryId?: string;
  readonly issues: readonly FrameworkValidationIssue[];
};
