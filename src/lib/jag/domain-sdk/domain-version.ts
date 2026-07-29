/**
 * Domain SDK versioning and compatibility helpers.
 * Semver utilities for SDK · Domain · Runtime · Core alignment.
 */

/** Published Domain SDK version (this package). */
export const DOMAIN_SDK_VERSION = "1.0.0" as const;

/** Runtime contract version baseline assumed by this SDK (Ω-7B freeze). */
export const DOMAIN_SDK_RUNTIME_CONTRACT = "1.0.0-rc" as const;

/** Minimum Core / Runtime package version this SDK targets. */
export const DOMAIN_SDK_MINIMUM_CORE = "1.0.0-rc" as const;

export interface SemVer {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
}

export interface VersionCompatibilityInput {
  /** Domain package version (manifest.version). */
  domainVersion: string;
  /** Host Runtime contract version. */
  runtimeVersion: string;
  /** Host Core version. */
  coreVersion: string;
  /** Domain-declared required Runtime contract. */
  requiredRuntimeVersion: string;
  /** Domain-declared minimum Core version. */
  minimumCoreVersion: string;
  /** Optional: host Domain SDK version (defaults to {@link DOMAIN_SDK_VERSION}). */
  sdkVersion?: string;
  /** Optional: domain-declared SDK range. */
  requiredSdkVersion?: string;
}

export interface VersionCompatibilityResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

const SEMVER_RE =
  /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/;

export function parseSemVer(input: string): SemVer | null {
  const match = SEMVER_RE.exec(input.trim());
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4],
  };
}

export function isValidSemVer(input: string): boolean {
  return parseSemVer(input) !== null;
}

export function compareSemVer(a: SemVer, b: SemVer): number {
  if (a.major !== b.major) return a.major < b.major ? -1 : 1;
  if (a.minor !== b.minor) return a.minor < b.minor ? -1 : 1;
  if (a.patch !== b.patch) return a.patch < b.patch ? -1 : 1;
  if (a.prerelease === b.prerelease) return 0;
  if (!a.prerelease) return 1;
  if (!b.prerelease) return -1;
  return a.prerelease < b.prerelease ? -1 : a.prerelease > b.prerelease ? 1 : 0;
}

/**
 * Satisfies a simple range:
 * - `1.2.3` exact (major.minor.patch)
 * - `^1.2.3` compatible major (and >= base)
 * - `~1.2.3` compatible minor (and >= base)
 * - `>=1.2.3` greater or equal
 */
export function satisfiesVersion(actual: string, range: string): boolean {
  const trimmed = range.trim();
  const actualVer = parseSemVer(actual);
  if (!actualVer) return false;

  if (trimmed.startsWith("^")) {
    const base = parseSemVer(trimmed.slice(1));
    if (!base) return false;
    if (compareSemVer(actualVer, base) < 0) return false;
    return actualVer.major === base.major;
  }
  if (trimmed.startsWith("~")) {
    const base = parseSemVer(trimmed.slice(1));
    if (!base) return false;
    if (compareSemVer(actualVer, base) < 0) return false;
    return actualVer.major === base.major && actualVer.minor === base.minor;
  }
  if (trimmed.startsWith(">=")) {
    const base = parseSemVer(trimmed.slice(2).trim());
    if (!base) return false;
    return compareSemVer(actualVer, base) >= 0;
  }
  const exact = parseSemVer(trimmed);
  if (!exact) return false;
  return (
    actualVer.major === exact.major &&
    actualVer.minor === exact.minor &&
    actualVer.patch === exact.patch
  );
}

function normalizeMinimumRange(range: string): string {
  return range.match(/^[\^~>=]/) ? range : `>=${range}`;
}

function rangeBase(range: string): string {
  return range.replace(/^[\^~>=\s]+/, "");
}

export function checkVersionCompatibility(
  input: VersionCompatibilityInput
): VersionCompatibilityResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isValidSemVer(input.domainVersion)) {
    errors.push(`Invalid domain version: ${input.domainVersion}`);
  }
  if (!isValidSemVer(input.runtimeVersion)) {
    errors.push(`Invalid runtime version: ${input.runtimeVersion}`);
  }
  if (!isValidSemVer(input.coreVersion)) {
    errors.push(`Invalid core version: ${input.coreVersion}`);
  }
  if (!isValidSemVer(rangeBase(input.requiredRuntimeVersion))) {
    errors.push(
      `Invalid requiredRuntimeVersion: ${input.requiredRuntimeVersion}`
    );
  }
  if (!isValidSemVer(rangeBase(input.minimumCoreVersion))) {
    errors.push(`Invalid minimumCoreVersion: ${input.minimumCoreVersion}`);
  }

  if (errors.length) {
    return { ok: false, errors, warnings };
  }

  const runtimeRange = normalizeMinimumRange(input.requiredRuntimeVersion);
  if (!satisfiesVersion(input.runtimeVersion, runtimeRange)) {
    errors.push(
      `Runtime ${input.runtimeVersion} does not satisfy required ${input.requiredRuntimeVersion}`
    );
  }

  const coreRange = normalizeMinimumRange(input.minimumCoreVersion);
  if (!satisfiesVersion(input.coreVersion, coreRange)) {
    errors.push(
      `Core ${input.coreVersion} is below minimum ${input.minimumCoreVersion}`
    );
  }

  const sdkVersion = input.sdkVersion ?? DOMAIN_SDK_VERSION;
  if (input.requiredSdkVersion) {
    const sdkRange = input.requiredSdkVersion.match(/^[\^~>=]/)
      ? input.requiredSdkVersion
      : `^${input.requiredSdkVersion}`;
    if (!satisfiesVersion(sdkVersion, sdkRange)) {
      errors.push(
        `SDK ${sdkVersion} does not satisfy required ${input.requiredSdkVersion}`
      );
    }
  }

  if (/-dev(?:\.|$)/.test(input.domainVersion)) {
    warnings.push("Domain version is a development build");
  }

  return { ok: errors.length === 0, errors, warnings };
}
