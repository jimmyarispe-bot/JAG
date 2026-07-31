/**
 * Structural validation for industry + organization blueprints.
 */

import type {
  IndustryBlueprint,
  OrganizationBlueprint,
} from "@/jag/blueprints/contracts";

export type BlueprintValidationIssue = {
  readonly path: string;
  readonly code: string;
  readonly message: string;
};

export type BlueprintValidationResult = {
  readonly ok: boolean;
  readonly issues: readonly BlueprintValidationIssue[];
};

function issue(
  path: string,
  code: string,
  message: string
): BlueprintValidationIssue {
  return { path, code, message };
}

export function validateIndustryBlueprint(
  industry: IndustryBlueprint
): BlueprintValidationResult {
  const issues: BlueprintValidationIssue[] = [];
  if (!industry.id?.trim()) {
    issues.push(issue("industry.id", "required", "Industry id is required"));
  }
  if (!industry.label?.trim()) {
    issues.push(issue("industry.label", "required", "Industry label is required"));
  }
  if (!industry.version?.trim()) {
    issues.push(
      issue("industry.version", "required", "Industry version is required")
    );
  }
  return { ok: issues.length === 0, issues };
}

export function validateOrganizationBlueprint(
  organization: OrganizationBlueprint
): BlueprintValidationResult {
  const issues: BlueprintValidationIssue[] = [];
  if (!organization.id?.trim()) {
    issues.push(
      issue("organization.id", "required", "Organization blueprint id is required")
    );
  }
  if (!organization.industryId?.trim()) {
    issues.push(
      issue(
        "organization.industryId",
        "required",
        "organization.industryId is required"
      )
    );
  }
  if (!organization.packageId?.trim()) {
    issues.push(
      issue("organization.packageId", "required", "packageId is required")
    );
  }
  if (!organization.applicationId?.trim()) {
    issues.push(
      issue(
        "organization.applicationId",
        "required",
        "applicationId is required"
      )
    );
  }
  if (!organization.displayName?.trim()) {
    issues.push(
      issue("organization.displayName", "required", "displayName is required")
    );
  }
  if (!organization.version?.trim()) {
    issues.push(
      issue("organization.version", "required", "version is required")
    );
  }
  return { ok: issues.length === 0, issues };
}

export function validateBlueprintPair(
  industry: IndustryBlueprint,
  organization: OrganizationBlueprint
): BlueprintValidationResult {
  const a = validateIndustryBlueprint(industry);
  const b = validateOrganizationBlueprint(organization);
  const issues = [...a.issues, ...b.issues];
  if (
    a.ok &&
    b.ok &&
    organization.industryId !== industry.id
  ) {
    issues.push(
      issue(
        "organization.industryId",
        "mismatch",
        `Organization industryId "${organization.industryId}" does not match industry "${industry.id}"`
      )
    );
  }
  return { ok: issues.length === 0, issues };
}
