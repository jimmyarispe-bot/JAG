import type {
  PackageVersion,
  PackageVersionString,
} from "@/jag/packages/contracts/definitions";

const SEMVER =
  /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/;

export function parsePackageVersion(raw: PackageVersionString): PackageVersion {
  const trimmed = raw.trim();
  const match = SEMVER.exec(trimmed);
  if (!match) {
    throw new Error(
      `Invalid package version "${raw}". Expected major.minor.patch[.prerelease]`
    );
  }
  return Object.freeze({
    raw: trimmed,
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4],
  });
}

/** Compare a to b: -1 if a<b, 0 if equal, 1 if a>b (prerelease < release). */
export function comparePackageVersions(
  a: PackageVersion | PackageVersionString,
  b: PackageVersion | PackageVersionString
): number {
  const left = typeof a === "string" ? parsePackageVersion(a) : a;
  const right = typeof b === "string" ? parsePackageVersion(b) : b;
  if (left.major !== right.major) return left.major < right.major ? -1 : 1;
  if (left.minor !== right.minor) return left.minor < right.minor ? -1 : 1;
  if (left.patch !== right.patch) return left.patch < right.patch ? -1 : 1;
  if (left.prerelease && !right.prerelease) return -1;
  if (!left.prerelease && right.prerelease) return 1;
  if (left.prerelease && right.prerelease) {
    return left.prerelease.localeCompare(right.prerelease);
  }
  return 0;
}

export function satisfiesMinVersion(
  installed: PackageVersion | PackageVersionString,
  min?: PackageVersionString
): boolean {
  if (!min) return true;
  return comparePackageVersions(installed, min) >= 0;
}

export function satisfiesMaxVersion(
  installed: PackageVersion | PackageVersionString,
  max?: PackageVersionString
): boolean {
  if (!max) return true;
  return comparePackageVersions(installed, max) <= 0;
}
