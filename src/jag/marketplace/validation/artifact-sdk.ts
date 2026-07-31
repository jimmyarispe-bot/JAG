/**
 * Validate marketplace artifact payloads using the public SDK validation API.
 */

import {
  validateBlueprint,
  validateCapabilityPack,
  validateOrganization,
} from "@/jag/sdk/validation";
import type {
  MarketplaceArtifact,
  MarketplaceValidationResult,
} from "@/jag/marketplace/contracts";
import { validateMarketplaceArtifact } from "@/jag/marketplace/validation/validate-manifest";
import { validateMarketplaceCompatibility } from "@/jag/marketplace/validation/compatibility";

export function validateMarketplaceArtifactWithSdk(
  artifact: MarketplaceArtifact
): MarketplaceValidationResult {
  const structural = validateMarketplaceArtifact(artifact);
  const compat = validateMarketplaceCompatibility(
    artifact.manifest.compatibility
  );
  const issues = [...structural.issues, ...compat.issues];

  if (artifact.payload.kind === "capability-pack") {
    const packResult = validateCapabilityPack(artifact.payload.pack);
    for (const i of packResult.issues) {
      if (i.severity === "warning") continue;
      issues.push({
        path: `payload.pack.${i.path}`,
        code: i.code,
        message: i.message,
        severity: "error",
      });
    }
  } else if (artifact.payload.kind === "industry-blueprint") {
    const bp = validateBlueprint(artifact.payload.industry);
    for (const i of bp.issues) {
      issues.push({
        path: `payload.industry.${i.path}`,
        code: i.code,
        message: i.message,
        severity: "error",
      });
    }
  } else {
    const org = validateOrganization(artifact.payload.organization);
    for (const i of org.issues) {
      issues.push({
        path: `payload.organization.${i.path}`,
        code: i.code,
        message: i.message,
        severity: "error",
      });
    }
  }

  return { ok: issues.length === 0, issues };
}
