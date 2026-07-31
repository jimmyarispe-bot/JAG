import { PLATFORM_VERSION as SDK_PLATFORM_VERSION } from "@/lib/platform/sdk/compatibility";

/**
 * Platform versioning policy constants (Sprint 078).
 * SDK compatibility checks use PLATFORM_VERSION from the SDK module.
 */

export const PLATFORM_RELEASE = {
  /** Overall JAG platform operating version. */
  platformVersion: "0.78.0",
  /** SDK contract version (must stay aligned with SdkService.platformVersion). */
  sdkVersion: SDK_PLATFORM_VERSION,
  /** Capability catalog epoch — bump when capability set changes. */
  capabilityCatalogVersion: "1.0.0",
  /** Deprecation grace: document-only; no auto-migration. */
  deprecationPolicy: "announce → mark deprecated → remove after two minor platform versions",
} as const;

export type VersionGovernance = {
  platformVersion: string;
  capabilityVersion: string;
  sdkCompatibility: string;
  applicationCompatibility: string;
  deprecationPolicy: string;
};

export function getVersionGovernance(): VersionGovernance {
  return {
    platformVersion: PLATFORM_RELEASE.platformVersion,
    capabilityVersion: PLATFORM_RELEASE.capabilityCatalogVersion,
    sdkCompatibility: `Applications must set compatibility.minPlatformVersion ≤ ${PLATFORM_RELEASE.platformVersion} and typically ≥ SDK ${PLATFORM_RELEASE.sdkVersion}`,
    applicationCompatibility:
      "ApplicationManifest.version is application-owned; platform validates dependency and capability declarations only",
    deprecationPolicy: PLATFORM_RELEASE.deprecationPolicy,
  };
}
