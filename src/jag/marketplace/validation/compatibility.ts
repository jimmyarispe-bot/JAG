/**
 * Marketplace compatibility validation against SDK / Platform / Framework versions.
 */

import {
  BLUEPRINT_FRAMEWORK_VERSION,
} from "@/jag/blueprint-framework";
import { satisfiesVersionRange } from "@/jag/capability-packs";
import { JAG_SDK_VERSION } from "@/jag/sdk/version";
// Import version module only — avoid @/jag/sdk barrel (keeps marketplace ↔ sdk acyclic).
import type {
  MarketplaceCompatibility,
  MarketplaceValidationIssue,
  MarketplaceValidationResult,
} from "@/jag/marketplace/contracts";
import {
  JAG_MARKETPLACE_PLATFORM_VERSION,
} from "@/jag/marketplace/version";

function issue(
  path: string,
  code: string,
  message: string
): MarketplaceValidationIssue {
  return { path, code, message, severity: "error" };
}

function checkBound(
  path: string,
  actual: string,
  min: string | undefined,
  max: string | undefined,
  label: string
): MarketplaceValidationIssue[] {
  const issues: MarketplaceValidationIssue[] = [];
  if (min && !satisfiesVersionRange(actual, `>=${min}`)) {
    issues.push(
      issue(
        path,
        "incompatible",
        `${label} ${actual} does not satisfy minimum ${min}`
      )
    );
  }
  if (max && !satisfiesVersionRange(actual, `<=${max}`)) {
    issues.push(
      issue(
        path,
        "incompatible",
        `${label} ${actual} exceeds maximum ${max}`
      )
    );
  }
  return issues;
}

export type CompatibilityEnvironment = {
  readonly sdkVersion?: string;
  readonly platformVersion?: string;
  readonly blueprintFrameworkVersion?: string;
};

export function validateMarketplaceCompatibility(
  compatibility: MarketplaceCompatibility,
  env: CompatibilityEnvironment = {}
): MarketplaceValidationResult {
  const sdk = env.sdkVersion ?? JAG_SDK_VERSION;
  const platform = env.platformVersion ?? JAG_MARKETPLACE_PLATFORM_VERSION;
  const framework = env.blueprintFrameworkVersion ?? BLUEPRINT_FRAMEWORK_VERSION;

  const issues: MarketplaceValidationIssue[] = [
    ...checkBound(
      "compatibility.jagSdkMin",
      sdk,
      compatibility.jagSdkMin,
      compatibility.jagSdkMax,
      "SDK"
    ),
    ...checkBound(
      "compatibility.jagPlatformMin",
      platform,
      compatibility.jagPlatformMin,
      compatibility.jagPlatformMax,
      "Platform"
    ),
    ...checkBound(
      "compatibility.blueprintFrameworkMin",
      framework,
      compatibility.blueprintFrameworkMin,
      compatibility.blueprintFrameworkMax,
      "Blueprint Framework"
    ),
  ];

  return { ok: issues.length === 0, issues };
}
