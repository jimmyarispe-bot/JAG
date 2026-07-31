/**
 * Academy package registration — loaded exclusively through PackageLoader
 * via the JAG runtime package host (see host.ts).
 */

import type { JagLoadedPackage } from "@/jag/runtime/types";
import { PackageLoader } from "@/jag/packages";
import { AcademyPackageManifest } from "@/packages/academy/manifest";
import { bindAcademyPackageHost } from "@/packages/academy/host";
import { ACADEMY_PACKAGE_ID } from "@/packages/academy/package";
import { getJagPackageHost } from "@/jag/runtime/package-host";
import type { AcademyCompositionOverrides } from "@/applications/academyos/composition/types";

export type RegisterAcademyPackageOptions = AcademyCompositionOverrides & {
  assertHealthy?: boolean;
  registerPlatform?: boolean;
  jagVersion?: string;
};

/**
 * Register Academy through the Universal Package Runtime (PackageLoader).
 * Ensures the Academy host is bound, then loads the Academy manifest.
 */
export function registerAcademyPackage(
  options?: RegisterAcademyPackageOptions
): JagLoadedPackage {
  bindAcademyPackageHost();
  const host = getJagPackageHost();
  if (!host) {
    throw new Error("Academy package host failed to bind");
  }

  const result = PackageLoader.loadSync(AcademyPackageManifest, {
    jagVersion: options?.jagVersion,
    activate: true,
    onInitialized: (record) => host.registerContributions(record),
  });

  if (!result.ok || !result.value) {
    throw new Error(
      result.error?.message ??
        `Failed to load ${ACADEMY_PACKAGE_ID} through PackageLoader`
    );
  }

  return host.compose(result.value.record, {
    assertHealthy: options?.assertHealthy,
    academy: options as Record<string, unknown>,
    packageOptions: options as Record<string, unknown>,
  });
}
