/**
 * Platform SDK™ versioning — independent of application plug-in SDK.
 */

export const PLATFORM_SDK_VERSION = "1.0.0" as const;

export type SdkVersionInfo = {
  readonly sdkVersion: typeof PLATFORM_SDK_VERSION;
  readonly minPlatformVersion: string;
  readonly apiContract: "v1";
};

export const PLATFORM_SDK_INFO: SdkVersionInfo = Object.freeze({
  sdkVersion: PLATFORM_SDK_VERSION,
  minPlatformVersion: "1.0.0-ga",
  apiContract: "v1",
});

/** Semver-ish compare: returns -1 / 0 / 1. Strips prerelease suffix for major.minor.patch. */
export function compareSemver(a: string, b: string): number {
  const parse = (v: string) => {
    const core = v.split("-")[0] ?? v;
    const parts = core.split(".").map((p) => Number.parseInt(p, 10) || 0);
    return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0] as const;
  };
  const pa = parse(a);
  const pb = parse(b);
  for (let i = 0; i < 3; i++) {
    if (pa[i]! < pb[i]!) return -1;
    if (pa[i]! > pb[i]!) return 1;
  }
  return 0;
}

export function satisfiesMinVersion(
  actual: string,
  minimum: string
): boolean {
  return compareSemver(actual, minimum) >= 0;
}
