import {
  FORBIDDEN_PACKAGE_CONTRIBUTION_KINDS,
  PACKAGE_CONTRIBUTION_KINDS,
  type PackageManifest,
} from "@/jag/packages/contracts/definitions";
import { parsePackageVersion } from "@/jag/packages/manifest";

export type ManifestValidationIssue = {
  readonly code: string;
  readonly message: string;
};

export function validatePackageManifest(
  manifest: PackageManifest
): ManifestValidationIssue[] {
  const issues: ManifestValidationIssue[] = [];
  const meta = manifest.metadata;

  if (!meta?.id?.trim()) {
    issues.push({ code: "metadata.id", message: "metadata.id is required" });
  }
  if (!meta?.applicationId?.trim()) {
    issues.push({
      code: "metadata.applicationId",
      message: "metadata.applicationId is required",
    });
  }
  if (!meta?.displayName?.trim()) {
    issues.push({
      code: "metadata.displayName",
      message: "metadata.displayName is required",
    });
  }
  if (!meta?.version?.trim()) {
    issues.push({
      code: "metadata.version",
      message: "metadata.version is required",
    });
  } else {
    try {
      parsePackageVersion(meta.version);
    } catch (err) {
      issues.push({
        code: "metadata.version",
        message: err instanceof Error ? err.message : "Invalid version",
      });
    }
  }

  if (!Array.isArray(manifest.contributions)) {
    issues.push({
      code: "contributions",
      message: "contributions must be an array",
    });
    return issues;
  }

  const kindSet = new Set<string>(PACKAGE_CONTRIBUTION_KINDS);
  const forbidden = new Set<string>(FORBIDDEN_PACKAGE_CONTRIBUTION_KINDS);
  const seenContributionKeys = new Set<string>();

  for (const contrib of manifest.contributions) {
    if (forbidden.has(contrib.kind as string)) {
      issues.push({
        code: "contributions.engine",
        message: `Packages may not contribute "${contrib.kind}" (engines forbidden)`,
      });
      continue;
    }
    if (!kindSet.has(contrib.kind)) {
      issues.push({
        code: "contributions.kind",
        message: `Unknown contribution kind "${contrib.kind}"`,
      });
      continue;
    }
    if (!Array.isArray(contrib.ids) || contrib.ids.length === 0) {
      issues.push({
        code: "contributions.ids",
        message: `Contribution "${contrib.kind}" requires non-empty ids`,
      });
    }
    for (const id of contrib.ids ?? []) {
      const key = `${contrib.kind}:${id}`;
      if (seenContributionKeys.has(key)) {
        issues.push({
          code: "contributions.duplicate",
          message: `Duplicate contribution id "${id}" for kind "${contrib.kind}"`,
        });
      }
      seenContributionKeys.add(key);
    }
  }

  for (const dep of manifest.dependencies ?? []) {
    if (!dep.packageId?.trim()) {
      issues.push({
        code: "dependencies.packageId",
        message: "dependency.packageId is required",
      });
    }
    if (dep.incompatible && dep.optional) {
      issues.push({
        code: "dependencies.flags",
        message: `Dependency "${dep.packageId}" cannot be both optional and incompatible`,
      });
    }
    for (const v of [dep.minVersion, dep.maxVersion]) {
      if (!v) continue;
      try {
        parsePackageVersion(v);
      } catch (err) {
        issues.push({
          code: "dependencies.version",
          message: err instanceof Error ? err.message : "Invalid dependency version",
        });
      }
    }
  }

  if (manifest.compatibility?.jagMinVersion) {
    try {
      parsePackageVersion(manifest.compatibility.jagMinVersion);
    } catch (err) {
      issues.push({
        code: "compatibility.jagMinVersion",
        message: err instanceof Error ? err.message : "Invalid jagMinVersion",
      });
    }
  }
  if (manifest.compatibility?.jagMaxVersion) {
    try {
      parsePackageVersion(manifest.compatibility.jagMaxVersion);
    } catch (err) {
      issues.push({
        code: "compatibility.jagMaxVersion",
        message: err instanceof Error ? err.message : "Invalid jagMaxVersion",
      });
    }
  }

  return issues;
}
