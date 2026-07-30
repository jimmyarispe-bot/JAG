/**
 * CapabilityVersion — Sprint 207 Intelligence Capability SDK.
 */

export type CapabilityVersion = {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
};

export function parseCapabilityVersion(raw: string): CapabilityVersion | null {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(raw.trim());
  if (!m) return null;
  return {
    major: Number(m[1]),
    minor: Number(m[2]),
    patch: Number(m[3]),
  };
}

export function formatCapabilityVersion(v: CapabilityVersion): string {
  return `${v.major}.${v.minor}.${v.patch}`;
}

export function compareCapabilityVersions(
  a: CapabilityVersion,
  b: CapabilityVersion
): number {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  return a.patch - b.patch;
}

/** Satisfies range like ">=1.0.0" or exact "1.2.0". */
export function satisfiesVersion(
  actual: CapabilityVersion,
  requirement: string
): boolean {
  const req = requirement.trim();
  if (req.startsWith(">=")) {
    const min = parseCapabilityVersion(req.slice(2));
    return min ? compareCapabilityVersions(actual, min) >= 0 : false;
  }
  if (req.startsWith("^")) {
    const base = parseCapabilityVersion(req.slice(1));
    if (!base) return false;
    return (
      actual.major === base.major &&
      compareCapabilityVersions(actual, base) >= 0
    );
  }
  const exact = parseCapabilityVersion(req);
  return exact ? compareCapabilityVersions(actual, exact) === 0 : false;
}
