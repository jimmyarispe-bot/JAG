/**
 * JAG SDK Validation API — public wrappers over Blueprint Framework + pack rules.
 */

import type {
  CapabilityPack,
  IndustryBlueprint,
  OrganizationBlueprint,
} from "@/jag/blueprints/contracts";
import {
  validateIndustryAgainstBlueprintFramework,
  validateOrganizationAgainstBlueprintFramework,
} from "@/jag/blueprint-framework";
import { validateCapabilityPack as validateCapabilityPackInternal } from "@/jag/capability-packs";
import type { SdkValidationResult } from "@/jag/sdk/public-types";

function toSdkResult(input: {
  readonly ok: boolean;
  readonly issues: readonly {
    readonly path: string;
    readonly code: string;
    readonly message: string;
    readonly severity?: "error" | "warning";
  }[];
}): SdkValidationResult {
  return Object.freeze({
    ok: input.ok,
    issues: Object.freeze(
      input.issues.map((i) =>
        Object.freeze({
          path: i.path,
          code: i.code,
          message: i.message,
          ...(i.severity ? { severity: i.severity } : {}),
        })
      )
    ),
  });
}

/** Validate an Industry Blueprint against Blueprint Framework v1. */
export function validateBlueprint(
  industry: IndustryBlueprint
): SdkValidationResult {
  const result = validateIndustryAgainstBlueprintFramework(industry);
  return toSdkResult(result);
}

/** Validate an Organization Blueprint overlay against Blueprint Framework v1. */
export function validateOrganization(
  organization: OrganizationBlueprint
): SdkValidationResult {
  const result = validateOrganizationAgainstBlueprintFramework(organization);
  return toSdkResult(result);
}

/**
 * Validate a Capability Pack (manifest + dependency declarations).
 * Wraps the public Capability Pack Architecture validator.
 */
export function validateCapabilityPack(
  pack: CapabilityPack
): SdkValidationResult {
  const result = validateCapabilityPackInternal(pack);
  return toSdkResult({
    ok: result.ok,
    issues: result.issues.map((i) => ({
      path: i.path,
      code: i.code,
      message: i.message,
      severity: i.severity,
    })),
  });
}
