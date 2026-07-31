/**
 * Blueprint Framework v1 — organization overlay structural checks.
 * Does not execute Studio, Runtime Generation, or Compiler.
 */

import type { OrganizationBlueprint } from "@/jag/blueprints/contracts";
import {
  BLUEPRINT_FRAMEWORK_VERSION,
  type FrameworkValidationIssue,
  type FrameworkValidationResult,
} from "@/jag/blueprint-framework/contracts";

function issue(
  path: string,
  code: string,
  message: string
): FrameworkValidationIssue {
  return { path, code, message };
}

/**
 * Validate that an Organization Blueprint looks like an overlay
 * (identity + pack attachment), not an industry catalog fork.
 */
export function validateOrganizationAgainstBlueprintFramework(
  organization: OrganizationBlueprint
): FrameworkValidationResult {
  const issues: FrameworkValidationIssue[] = [];

  if (!organization.id?.trim()) {
    issues.push(issue("id", "required", "Organization id is required"));
  }
  if (!organization.industryId?.trim()) {
    issues.push(
      issue("industryId", "required", "organization.industryId is required")
    );
  }
  if (!organization.displayName?.trim()) {
    issues.push(
      issue("displayName", "required", "displayName is required")
    );
  }
  if (!organization.packageId?.trim()) {
    issues.push(issue("packageId", "required", "packageId is required"));
  }
  if (!organization.applicationId?.trim()) {
    issues.push(
      issue("applicationId", "required", "applicationId is required")
    );
  }
  if (!organization.enabledModules?.length) {
    issues.push(
      issue(
        "enabledModules",
        "required",
        "enabledModules must include at least one module"
      )
    );
  }

  const packs = organization.capabilityPacks ?? [];
  if (!packs.length) {
    issues.push(
      issue(
        "capabilityPacks",
        "required",
        "Organization must attach capability packs (foundation resolution)"
      )
    );
  }

  // Organization overlays attach packs; they must not ship platform engines.
  const keys = (organization.configuration?.keys ?? {}) as Record<
    string,
    unknown
  >;
  if (keys.stub === true) {
    issues.push(
      issue(
        "configuration.keys.stub",
        "stub_forbidden",
        "Stub organization overlays are not framework-valid"
      )
    );
  }

  return {
    ok: issues.length === 0,
    frameworkVersion: BLUEPRINT_FRAMEWORK_VERSION,
    industryId: organization.industryId,
    issues,
  };
}
