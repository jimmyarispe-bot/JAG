/**
 * PackageRuntime — facade over registry + loader lifecycle.
 */

import type {
  PackageId,
  PackageManifest,
  PackageRecord,
  PackageResult,
} from "@/jag/packages/contracts/definitions";
import {
  PackageLoader,
  type LoadPackageOptions,
} from "@/jag/packages/loader";
import {
  PackageRegistry,
  activatePackage,
  deactivatePackage,
  removePackage,
  suspendPackage,
} from "@/jag/packages/registry";

export const PackageRuntime = {
  /** Discover → validate → install → initialize (+ optional activate). */
  load: (manifest: PackageManifest, options?: LoadPackageOptions) =>
    PackageLoader.load(manifest, options),

  discoverAndLoad: (options?: LoadPackageOptions) =>
    PackageLoader.discoverAndLoad(options),

  activate: (packageId: PackageId) => activatePackage(packageId),
  suspend: (packageId: PackageId) => suspendPackage(packageId),
  deactivate: (packageId: PackageId) => deactivatePackage(packageId),
  remove: (packageId: PackageId) => removePackage(packageId),

  get: (packageId: PackageId) => PackageRegistry.get(packageId),
  list: (filter?: { state?: PackageRecord["state"] }) =>
    PackageRegistry.list(filter),
  listContributions: PackageRegistry.listContributions,
  getMetrics: PackageRegistry.getMetrics,
} as const;

export type PackageRuntimeApi = typeof PackageRuntime;

export async function runPackageLifecycle(
  manifest: PackageManifest,
  options?: LoadPackageOptions & { activate?: boolean }
): Promise<PackageResult<{ record: PackageRecord }>> {
  return PackageRuntime.load(manifest, {
    ...options,
    activate: options?.activate ?? true,
  });
}
