/**
 * CompatibilityValidator — platform / connector / SDK / dependency integrity.
 */

import { store } from "@/lib/platform-sdk/store";
import type { ExtensionManifest } from "@/lib/platform-sdk/extensions/types";
import {
  PLATFORM_SDK_VERSION,
  satisfiesMinVersion,
} from "@/lib/platform-sdk/versioning";
import { JAG_PLATFORM_VERSION } from "@/lib/jag-platform/versioning";

export type CompatibilityIssue = {
  readonly code:
    | "platform_version"
    | "sdk_version"
    | "connector_missing"
    | "dependency_missing"
    | "dependency_cycle"
    | "config_invalid";
  readonly message: string;
};

export type CompatibilityResult = {
  readonly ok: boolean;
  readonly issues: readonly CompatibilityIssue[];
};

export type CompatibilityValidator = {
  validateManifest(manifest: ExtensionManifest): CompatibilityResult;
  validateInstalled(
    organizationId: string,
    extensionId: string
  ): CompatibilityResult;
  validateDependencyGraph(
    manifests: readonly ExtensionManifest[]
  ): CompatibilityResult;
};

export function createCompatibilityValidator(deps?: {
  platformVersion?: string;
  sdkVersion?: string;
}): CompatibilityValidator {
  const platformVersion =
    deps?.platformVersion ?? JAG_PLATFORM_VERSION.platformVersion;
  const sdkVersion = deps?.sdkVersion ?? PLATFORM_SDK_VERSION;

  return {
    validateManifest(manifest) {
      const issues: CompatibilityIssue[] = [];
      if (
        !satisfiesMinVersion(platformVersion, manifest.minimumPlatformVersion)
      ) {
        issues.push({
          code: "platform_version",
          message: `Platform ${platformVersion} does not satisfy minimum ${manifest.minimumPlatformVersion}.`,
        });
      }
      if (!satisfiesMinVersion(sdkVersion, manifest.minimumSdkVersion)) {
        issues.push({
          code: "sdk_version",
          message: `SDK ${sdkVersion} does not satisfy minimum ${manifest.minimumSdkVersion}.`,
        });
      }
      for (const connectorId of manifest.connectorDependencies) {
        if (!store().connectors.has(connectorId)) {
          issues.push({
            code: "connector_missing",
            message: `Required connector “${connectorId}” is not registered in the SDK.`,
          });
        }
      }
      for (const dep of manifest.dependencies) {
        if (
          !store().extensionCatalog.has(dep) &&
          !store().connectors.has(dep)
        ) {
          issues.push({
            code: "dependency_missing",
            message: `Dependency “${dep}” is not in the extension catalog or connector registry.`,
          });
        }
      }
      return { ok: issues.length === 0, issues: Object.freeze(issues) };
    },

    validateInstalled(organizationId, extensionId) {
      const key = `${organizationId}::${extensionId}`;
      const record = store().extensions.get(key);
      if (!record) {
        return {
          ok: false,
          issues: Object.freeze([
            {
              code: "dependency_missing" as const,
              message: `Extension “${extensionId}” is not installed for this organization.`,
            },
          ]),
        };
      }
      return this.validateManifest(record.manifest);
    },

    validateDependencyGraph(manifests) {
      const issues: CompatibilityIssue[] = [];
      const ids = new Set(manifests.map((m) => m.id));
      const visiting = new Set<string>();
      const visited = new Set<string>();

      const visit = (id: string, stack: string[]) => {
        if (visited.has(id)) return;
        if (visiting.has(id)) {
          issues.push({
            code: "dependency_cycle",
            message: `Dependency cycle detected: ${[...stack, id].join(" → ")}`,
          });
          return;
        }
        visiting.add(id);
        const manifest = manifests.find((m) => m.id === id);
        if (manifest) {
          for (const dep of manifest.dependencies) {
            if (ids.has(dep)) visit(dep, [...stack, id]);
          }
        }
        visiting.delete(id);
        visited.add(id);
      };

      for (const m of manifests) visit(m.id, []);
      return { ok: issues.length === 0, issues: Object.freeze(issues) };
    },
  };
}
