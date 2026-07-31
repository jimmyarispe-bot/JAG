/**
 * JAG runtime package loader — discovers & activates packages via PackageLoader.
 *
 * No @/packages/* imports. Packages bind a JagPackageHost from the composition root.
 */

import { bindPackageManifestSource } from "@/jag/packages/contracts/extensions";
import { PackageLoader } from "@/jag/packages/loader";
import {
  requireJagPackageHost,
} from "@/jag/runtime/package-host";
import type {
  JagLoadedPackage,
  JagPackageId,
  JagStartupOptions,
} from "@/jag/runtime/types";

export function loadApplicationPackages(
  packageIds: JagPackageId[] | undefined,
  options?: JagStartupOptions
): JagLoadedPackage[] {
  const host = requireJagPackageHost();
  const manifests = host.listManifests();

  bindPackageManifestSource({
    listManifests: () => manifests,
  });

  const selected =
    packageIds && packageIds.length > 0
      ? manifests.filter((m) => packageIds.includes(m.metadata.id))
      : [...manifests];

  if (packageIds && packageIds.length > 0) {
    const found = new Set(selected.map((m) => m.metadata.id));
    for (const id of packageIds) {
      if (!found.has(id)) {
        throw new Error(
          `Unknown application package "${id}". Bind it via JagPackageHost.listManifests().`
        );
      }
    }
  }

  if (selected.length === 0) {
    throw new Error(
      "No application package manifests available from JagPackageHost."
    );
  }

  const loaded: JagLoadedPackage[] = [];

  for (const manifest of selected) {
    const result = PackageLoader.loadSync(manifest, {
      jagVersion: options?.jagVersion,
      activate: true,
      onInitialized: (record) => host.registerContributions(record),
    });

    if (!result.ok || !result.value) {
      throw new Error(
        result.error?.message ??
          `Failed to load package "${manifest.metadata.id}" through PackageLoader`
      );
    }

    loaded.push(host.compose(result.value.record, options));
  }

  return loaded;
}
