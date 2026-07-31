/**
 * PackageLoader — discover manifests, validate, initialize, register contributions.
 * No @/packages imports; host supplies manifests or a PackageManifestSource.
 */

import type {
  PackageManifest,
  PackageRecord,
  PackageResult,
} from "@/jag/packages/contracts/definitions";
import {
  getPackageManifestSource,
  getPackageRuntimeExtensions,
} from "@/jag/packages/contracts/extensions";
import {
  activatePackage,
  discoverPackage,
  initializePackage,
  installPackage,
  validatePackage,
} from "@/jag/packages/registry";

export type LoadPackageOptions = {
  readonly jagVersion?: string;
  /** When true, continue through activated. Default false (stop at initialized). */
  readonly activate?: boolean;
};

async function publishContributionHooks(record: PackageRecord): Promise<void> {
  const ports = getPackageRuntimeExtensions();
  const byKind = new Map<string, string[]>();
  for (const c of record.manifest.contributions) {
    byKind.set(c.kind, [...(byKind.get(c.kind) ?? []), ...c.ids]);
  }

  if (ports.entities?.onContributions && byKind.has("entities")) {
    await ports.entities.onContributions({
      record,
      entityTypeIds: byKind.get("entities")!,
    });
  }
  if (ports.workflows?.onContributions && byKind.has("workflows")) {
    await ports.workflows.onContributions({
      record,
      workflowIds: byKind.get("workflows")!,
    });
  }
  if (ports.processes?.onContributions && byKind.has("processes")) {
    await ports.processes.onContributions({
      record,
      processIds: byKind.get("processes")!,
    });
  }
  if (ports.decisions?.onContributions && byKind.has("decisions")) {
    await ports.decisions.onContributions({
      record,
      decisionIds: byKind.get("decisions")!,
    });
  }
  if (ports.documents?.onContributions && byKind.has("documents")) {
    await ports.documents.onContributions({
      record,
      documentIds: byKind.get("documents")!,
    });
  }
  if (ports.communications?.onContributions && byKind.has("communications")) {
    await ports.communications.onContributions({
      record,
      communicationIds: byKind.get("communications")!,
    });
  }
  if (ports.navigation?.onContributions && byKind.has("navigation")) {
    await ports.navigation.onContributions({
      record,
      navigationIds: byKind.get("navigation")!,
    });
  }
}

export type LoadPackageSyncOptions = LoadPackageOptions & {
  /** Sync contribution registration (host / package side). */
  readonly onInitialized?: (record: PackageRecord) => void;
};

/**
 * Synchronous lifecycle path used by process boot (startJAG).
 * Same states as async load; contribution hooks via onInitialized + ports (sync fire-and-forget).
 */
export function loadPackageManifestSync(
  manifest: PackageManifest,
  options?: LoadPackageSyncOptions
): PackageResult<{ record: PackageRecord }> {
  const discovered = discoverPackage(manifest);
  if (!discovered.ok || !discovered.value) return discovered;

  const validated = validatePackage(manifest.metadata.id, {
    jagVersion: options?.jagVersion,
  });
  if (!validated.ok || !validated.value) return validated;

  const installed = installPackage(manifest.metadata.id);
  if (!installed.ok || !installed.value) return installed;

  const initialized = initializePackage(manifest.metadata.id);
  if (!initialized.ok || !initialized.value) return initialized;

  options?.onInitialized?.(initialized.value.record);

  if (options?.activate) {
    const activated = activatePackage(manifest.metadata.id);
    if (!activated.ok || !activated.value) return activated;
    return activated;
  }

  return initialized;
}

/**
 * Load a single declarative manifest through the lifecycle up to initialized
 * (or activated when options.activate).
 */
export async function loadPackageManifest(
  manifest: PackageManifest,
  options?: LoadPackageOptions
): Promise<PackageResult<{ record: PackageRecord }>> {
  const result = loadPackageManifestSync(manifest, {
    ...options,
    activate: false,
  });
  if (!result.ok || !result.value) return result;

  await publishContributionHooks(result.value.record);

  if (options?.activate) {
    const activated = activatePackage(manifest.metadata.id);
    if (!activated.ok || !activated.value) return activated;
    const ports = getPackageRuntimeExtensions();
    if (ports.organization?.onPackageActivated) {
      await ports.organization.onPackageActivated({
        record: activated.value.record,
      });
    }
    return activated;
  }

  return result;
}

/** Discover manifests from the bound source (if any), then load each. */
export async function discoverAndLoadPackages(
  options?: LoadPackageOptions
): Promise<PackageResult<{ records: PackageRecord[] }>> {
  const source = getPackageManifestSource();
  if (!source) {
    return {
      ok: false,
      error: {
        code: "no_source",
        message:
          "No PackageManifestSource bound. Call bindPackageManifestSource() or loadPackageManifest().",
      },
    };
  }

  const manifests = await source.listManifests();
  const records: PackageRecord[] = [];
  for (const manifest of manifests) {
    const result = await loadPackageManifest(manifest, options);
    if (!result.ok || !result.value) {
      return {
        ok: false,
        error: result.error,
      };
    }
    records.push(result.value.record);
  }
  return { ok: true, value: { records } };
}

export const PackageLoader = {
  load: loadPackageManifest,
  loadSync: loadPackageManifestSync,
  discoverAndLoad: discoverAndLoadPackages,
} as const;
