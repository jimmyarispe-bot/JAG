/**
 * Validate Organization Studio answers against an industry blueprint.
 */

import type { IndustryBlueprint } from "@/jag/blueprints/contracts";
import type { OrganizationStudioAnswers } from "@/jag/studio/contracts";

export type StudioValidationIssue = {
  readonly path: string;
  readonly code: string;
  readonly message: string;
};

export type StudioValidationResult = {
  readonly ok: boolean;
  readonly issues: readonly StudioValidationIssue[];
};

function issue(
  path: string,
  code: string,
  message: string
): StudioValidationIssue {
  return { path, code, message };
}

export function validateOrganizationStudioAnswers(
  industry: IndustryBlueprint,
  answers: OrganizationStudioAnswers
): StudioValidationResult {
  const issues: StudioValidationIssue[] = [];

  if (answers.industryId !== industry.id) {
    issues.push(
      issue(
        "industryId",
        "mismatch",
        `Answers industryId "${answers.industryId}" does not match industry "${industry.id}"`
      )
    );
  }
  if (!answers.organizationId?.trim()) {
    issues.push(
      issue("organizationId", "required", "organizationId is required")
    );
  }
  if (!answers.packageId?.trim()) {
    issues.push(issue("packageId", "required", "packageId is required"));
  }
  if (!answers.applicationId?.trim()) {
    issues.push(
      issue("applicationId", "required", "applicationId is required")
    );
  }
  if (!answers.version?.trim()) {
    issues.push(issue("version", "required", "version is required"));
  }
  if (!answers.identity?.name?.trim()) {
    issues.push(
      issue("identity.name", "required", "Organization name is required")
    );
  }
  if (!answers.identity?.timeZone?.trim()) {
    issues.push(
      issue("identity.timeZone", "required", "Time zone is required")
    );
  }
  if (!answers.identity?.languages?.length) {
    issues.push(
      issue(
        "identity.languages",
        "required",
        "At least one language is required"
      )
    );
  }
  if (!answers.locations?.length) {
    issues.push(
      issue("locations", "required", "At least one location is required")
    );
  } else {
    answers.locations.forEach((loc, i) => {
      if (!loc.id?.trim() || !loc.name?.trim() || !loc.kind?.trim()) {
        issues.push(
          issue(
            `locations[${i}]`,
            "invalid",
            "Each location needs id, kind, and name"
          )
        );
      }
    });
  }
  if (!answers.enabledModules?.length) {
    issues.push(
      issue(
        "enabledModules",
        "required",
        "At least one enabled module is required"
      )
    );
  }

  const industryModules = new Set(industry.modules ?? []);
  if (industryModules.size > 0) {
    for (const mod of answers.enabledModules ?? []) {
      if (!industryModules.has(mod)) {
        issues.push(
          issue(
            "enabledModules",
            "unknown_module",
            `Module "${mod}" is not listed on industry "${industry.id}"`
          )
        );
      }
    }
  }

  return { ok: issues.length === 0, issues };
}
