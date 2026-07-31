/**
 * Marketplace manifest correctness + integrity checks.
 */

import type {
  MarketplaceArtifact,
  MarketplacePackageManifest,
  MarketplaceValidationIssue,
  MarketplaceValidationResult,
} from "@/jag/marketplace/contracts";
import { marketplaceChecksum } from "@/jag/marketplace/checksum";

function issue(
  path: string,
  code: string,
  message: string,
  severity: "error" | "warning" = "error"
): MarketplaceValidationIssue {
  return { path, code, message, severity };
}

export function validateMarketplaceManifest(
  manifest: MarketplacePackageManifest
): MarketplaceValidationResult {
  const issues: MarketplaceValidationIssue[] = [];

  if (!manifest.id?.trim()) {
    issues.push(issue("id", "required", "Manifest id is required"));
  }
  if (!manifest.name?.trim()) {
    issues.push(issue("name", "required", "Manifest name is required"));
  }
  if (!manifest.version?.trim()) {
    issues.push(issue("version", "required", "Manifest version is required"));
  }
  if (!manifest.author?.trim()) {
    issues.push(issue("author", "required", "Manifest author is required"));
  }
  if (!manifest.license?.trim()) {
    issues.push(issue("license", "required", "Manifest license is required"));
  }
  if (!manifest.description?.trim()) {
    issues.push(
      issue("description", "required", "Manifest description is required")
    );
  }
  if (!manifest.kind) {
    issues.push(issue("kind", "required", "Manifest kind is required"));
  }
  if (!Array.isArray(manifest.dependencies)) {
    issues.push(
      issue("dependencies", "required", "dependencies must be an array")
    );
  } else {
    for (const [i, dep] of manifest.dependencies.entries()) {
      if (!dep.id?.trim() || !dep.versionRange?.trim()) {
        issues.push(
          issue(
            `dependencies[${i}]`,
            "invalid",
            "Each dependency needs id and versionRange"
          )
        );
      }
    }
  }
  if (!manifest.checksum?.trim()) {
    issues.push(issue("checksum", "required", "checksum is required"));
  }
  if (!manifest.signing?.publisher?.trim()) {
    issues.push(
      issue("signing.publisher", "required", "signing.publisher is required")
    );
  }
  if (!manifest.metadata?.maturity) {
    issues.push(
      issue("metadata.maturity", "required", "metadata.maturity is required")
    );
  }

  return { ok: issues.length === 0, issues };
}

/**
 * Recompute checksum over manifest fields excluding the checksum itself.
 */
export function verifyMarketplaceChecksum(
  manifest: MarketplacePackageManifest
): MarketplaceValidationResult {
  const { checksum: _ignored, ...rest } = manifest;
  const expected = marketplaceChecksum(rest);
  if (manifest.checksum !== expected) {
    return {
      ok: false,
      issues: [
        issue(
          "checksum",
          "mismatch",
          `Checksum mismatch: expected ${expected}, got ${manifest.checksum}`
        ),
      ],
    };
  }
  return { ok: true, issues: [] };
}

export function validateMarketplaceArtifact(
  artifact: MarketplaceArtifact
): MarketplaceValidationResult {
  const manifestResult = validateMarketplaceManifest(artifact.manifest);
  const checksumResult = verifyMarketplaceChecksum(artifact.manifest);
  const issues = [...manifestResult.issues, ...checksumResult.issues];

  if (artifact.manifest.kind !== artifact.payload.kind) {
    issues.push(
      issue(
        "payload.kind",
        "mismatch",
        `Payload kind "${artifact.payload.kind}" does not match manifest kind "${artifact.manifest.kind}"`
      )
    );
  }

  return { ok: issues.length === 0, issues };
}
