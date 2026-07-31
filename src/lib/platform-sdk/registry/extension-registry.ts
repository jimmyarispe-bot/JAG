/**
 * ExtensionRegistry — installed / enabled / version / upgrade / dependency status.
 */

import { createExtensionLifecycle } from "@/lib/platform-sdk/lifecycle/extension-lifecycle";
import { orgExtKey, store } from "@/lib/platform-sdk/store";
import type {
  ExtensionManifest,
  ExtensionRecord,
} from "@/lib/platform-sdk/extensions/types";
import { compareSemver } from "@/lib/platform-sdk/versioning";

export type ExtensionRegistry = {
  registerCatalog(manifest: ExtensionManifest): void;
  listCatalog(): readonly ExtensionManifest[];
  listInstalled(organizationId: string): readonly ExtensionRecord[];
  get(
    organizationId: string,
    extensionId: string
  ): ExtensionRecord | null;
  listEnabled(organizationId: string): readonly ExtensionRecord[];
  listDisabled(organizationId: string): readonly ExtensionRecord[];
  listUpgradeAvailable(organizationId: string): readonly ExtensionRecord[];
  lifecycle: ReturnType<typeof createExtensionLifecycle>;
};

export function createExtensionRegistry(): ExtensionRegistry {
  const lifecycle = createExtensionLifecycle();

  return {
    lifecycle,
    registerCatalog(manifest) {
      const existing = store().extensionCatalog.get(manifest.id);
      if (
        !existing ||
        compareSemver(manifest.version, existing.version) >= 0
      ) {
        store().extensionCatalog.set(manifest.id, manifest);
      }
      // Refresh upgrade flags for installed copies
      for (const [key, record] of store().extensions) {
        if (record.manifest.id !== manifest.id) continue;
        const upgradeAvailable =
          compareSemver(manifest.version, record.installedVersion) > 0;
        store().extensions.set(key, {
          ...record,
          upgradeAvailable,
          latestAvailableVersion: manifest.version,
          status: upgradeAvailable ? "Upgrade Available" : record.status,
        });
      }
    },
    listCatalog() {
      return Object.freeze([...store().extensionCatalog.values()]);
    },
    listInstalled(organizationId) {
      return Object.freeze(
        [...store().extensions.values()].filter(
          (r) => r.organizationId === organizationId
        )
      );
    },
    get(organizationId, extensionId) {
      return (
        store().extensions.get(orgExtKey(organizationId, extensionId)) ?? null
      );
    },
    listEnabled(organizationId) {
      return Object.freeze(
        this.listInstalled(organizationId).filter((r) => r.enabled)
      );
    },
    listDisabled(organizationId) {
      return Object.freeze(
        this.listInstalled(organizationId).filter(
          (r) => !r.enabled && r.status !== "Incompatible"
        )
      );
    },
    listUpgradeAvailable(organizationId) {
      return Object.freeze(
        this.listInstalled(organizationId).filter((r) => r.upgradeAvailable)
      );
    },
  };
}
