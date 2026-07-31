/**
 * Extension lifecycle — install / enable / disable / upgrade / validate / uninstall.
 */

import { createCompatibilityValidator } from "@/lib/platform-sdk/validation/compatibility";
import { orgExtKey, store } from "@/lib/platform-sdk/store";
import type {
  ExtensionLifecycle,
  ExtensionManifest,
  ExtensionRecord,
} from "@/lib/platform-sdk/extensions/types";
import { compareSemver } from "@/lib/platform-sdk/versioning";

function now(): string {
  return new Date().toISOString();
}

function dependencyStatus(
  organizationId: string,
  manifest: ExtensionManifest
): {
  status: ExtensionRecord["dependencyStatus"];
  missing: readonly string[];
} {
  const missing: string[] = [];
  for (const dep of manifest.dependencies) {
    const depRecord = store().extensions.get(orgExtKey(organizationId, dep));
    const inCatalog = store().extensionCatalog.has(dep);
    const isConnector = store().connectors.has(dep);
    if (isConnector) continue;
    if (!inCatalog) {
      missing.push(dep);
      continue;
    }
    if (!depRecord || !depRecord.enabled) {
      missing.push(dep);
    }
  }
  for (const connectorId of manifest.connectorDependencies) {
    if (!store().connectors.has(connectorId)) missing.push(connectorId);
  }
  if (missing.length === 0) return { status: "ok", missing: [] };
  return { status: "missing", missing: Object.freeze(missing) };
}

function toRecord(
  organizationId: string,
  manifest: ExtensionManifest,
  partial: Partial<ExtensionRecord> & {
    installedVersion: string;
    enabled: boolean;
    status: ExtensionRecord["status"];
    installedAt: string;
  }
): ExtensionRecord {
  const deps = dependencyStatus(organizationId, manifest);
  const catalog = store().extensionCatalog.get(manifest.id);
  const latest = catalog?.version ?? null;
  const upgradeAvailable =
    latest != null && compareSemver(latest, partial.installedVersion) > 0;

  return {
    organizationId,
    manifest,
    status: deps.status === "missing" ? "Incompatible" : partial.status,
    installedVersion: partial.installedVersion,
    enabled: partial.enabled,
    upgradeAvailable,
    latestAvailableVersion: latest,
    dependencyStatus: deps.status,
    missingDependencies: deps.missing,
    installedAt: partial.installedAt,
    updatedAt: now(),
    configuration: partial.configuration ?? {},
  };
}

export function createExtensionLifecycle(): ExtensionLifecycle {
  const compatibility = createCompatibilityValidator();

  return {
    install(organizationId, manifest) {
      store().extensionCatalog.set(manifest.id, manifest);
      const key = orgExtKey(organizationId, manifest.id);
      const existing = store().extensions.get(key);
      if (existing) return existing;

      const compat = compatibility.validateManifest(manifest);
      const record = toRecord(organizationId, manifest, {
        installedVersion: manifest.version,
        enabled: false,
        status: compat.ok ? "Installed" : "Incompatible",
        installedAt: now(),
      });
      store().extensions.set(key, record);
      return record;
    },

    enable(organizationId, extensionId) {
      const key = orgExtKey(organizationId, extensionId);
      const current = store().extensions.get(key);
      if (!current) {
        throw new Error(`Extension “${extensionId}” is not installed.`);
      }
      const deps = dependencyStatus(organizationId, current.manifest);
      if (deps.status !== "ok") {
        throw new Error(
          `Cannot enable: missing dependencies ${deps.missing.join(", ")}.`
        );
      }
      const next = toRecord(organizationId, current.manifest, {
        installedVersion: current.installedVersion,
        enabled: true,
        status: "Enabled",
        installedAt: current.installedAt,
        configuration: current.configuration,
      });
      store().extensions.set(key, next);
      return next;
    },

    disable(organizationId, extensionId) {
      const key = orgExtKey(organizationId, extensionId);
      const current = store().extensions.get(key);
      if (!current) {
        throw new Error(`Extension “${extensionId}” is not installed.`);
      }
      const next = toRecord(organizationId, current.manifest, {
        installedVersion: current.installedVersion,
        enabled: false,
        status: "Disabled",
        installedAt: current.installedAt,
        configuration: current.configuration,
      });
      store().extensions.set(key, next);
      return next;
    },

    upgrade(organizationId, extensionId, nextManifest) {
      const key = orgExtKey(organizationId, extensionId);
      const current = store().extensions.get(key);
      if (!current) {
        throw new Error(`Extension “${extensionId}” is not installed.`);
      }
      if (nextManifest.id !== extensionId) {
        throw new Error("Upgrade manifest id mismatch.");
      }
      store().extensionCatalog.set(nextManifest.id, nextManifest);
      const compat = compatibility.validateManifest(nextManifest);
      const next = toRecord(organizationId, nextManifest, {
        installedVersion: nextManifest.version,
        enabled: current.enabled && compat.ok,
        status: compat.ok
          ? current.enabled
            ? "Enabled"
            : "Installed"
          : "Incompatible",
        installedAt: current.installedAt,
        configuration: current.configuration,
      });
      store().extensions.set(key, next);
      return next;
    },

    validate(organizationId, extensionId) {
      const key = orgExtKey(organizationId, extensionId);
      const current = store().extensions.get(key);
      if (!current) {
        return {
          ok: false,
          errors: Object.freeze([`Extension “${extensionId}” is not installed.`]),
        };
      }
      const compat = compatibility.validateManifest(current.manifest);
      const deps = dependencyStatus(organizationId, current.manifest);
      const errors = [
        ...compat.issues.map((i) => i.message),
        ...deps.missing.map((d) => `Missing dependency: ${d}`),
      ];
      return { ok: errors.length === 0, errors: Object.freeze(errors) };
    },

    uninstall(organizationId, extensionId) {
      const key = orgExtKey(organizationId, extensionId);
      return store().extensions.delete(key);
    },
  };
}
