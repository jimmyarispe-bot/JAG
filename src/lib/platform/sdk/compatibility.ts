import type {
  ApplicationManifest,
  CompatibilityMeta,
  SdkValidationIssue,
} from "@/lib/platform/sdk/types";

/**
 * Platform version used for compatibility checks.
 * Bump when publishing breaking platform SDK contracts.
 */
export const PLATFORM_VERSION = "0.78.0";

export function compareSemver(a: string, b: string): number {
  const pa = a.split(".").map((p) => Number.parseInt(p, 10) || 0);
  const pb = b.split(".").map((p) => Number.parseInt(p, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d < 0 ? -1 : 1;
  }
  return 0;
}

export function normalizeCompatibility(
  meta: CompatibilityMeta
): CompatibilityMeta {
  return {
    minPlatformVersion: meta.minPlatformVersion.trim(),
    maxTestedPlatformVersion: meta.maxTestedPlatformVersion?.trim() || null,
    deprecatedCapabilities: meta.deprecatedCapabilities
      ? [...meta.deprecatedCapabilities]
      : [],
    notes: meta.notes ?? null,
  };
}

/**
 * Check manifest compatibility against the running platform version.
 * Does not implement automatic migrations.
 */
export function checkCompatibility(
  manifest: ApplicationManifest,
  platformVersion: string = PLATFORM_VERSION
): SdkValidationIssue[] {
  const issues: SdkValidationIssue[] = [];
  const compat = manifest.compatibility;

  if (!compat?.minPlatformVersion?.trim()) {
    issues.push({
      path: "compatibility.minPlatformVersion",
      code: "missing_min_platform_version",
      message: "compatibility.minPlatformVersion is required",
    });
    return issues;
  }

  if (compareSemver(platformVersion, compat.minPlatformVersion) < 0) {
    issues.push({
      path: "compatibility.minPlatformVersion",
      code: "incompatible_platform_version",
      message: `Platform ${platformVersion} is below minimum ${compat.minPlatformVersion}`,
    });
  }

  if (compat.maxTestedPlatformVersion) {
    if (
      compareSemver(platformVersion, compat.maxTestedPlatformVersion) > 0
    ) {
      issues.push({
        path: "compatibility.maxTestedPlatformVersion",
        code: "untested_platform_version",
        message: `Platform ${platformVersion} exceeds max tested ${compat.maxTestedPlatformVersion}`,
      });
    }
  }

  for (const cap of compat.deprecatedCapabilities ?? []) {
    if (manifest.capabilities.includes(cap)) {
      issues.push({
        path: "compatibility.deprecatedCapabilities",
        code: "deprecated_capability_in_use",
        message: `Capability "${cap}" is marked deprecated for this application`,
      });
    }
  }

  return issues;
}

export function isCompatible(
  manifest: ApplicationManifest,
  platformVersion: string = PLATFORM_VERSION
): boolean {
  return (
    checkCompatibility(manifest, platformVersion).filter(
      (i) => i.code === "incompatible_platform_version"
    ).length === 0
  );
}
