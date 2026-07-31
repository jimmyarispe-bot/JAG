/** Extension Framework™ — metadata + lifecycle contracts. */

import type { PermissionDefinition } from "@/lib/platform-sdk/permissions/types";

export const EXTENSION_CATEGORIES = [
  "Connector",
  "Industry Pack",
  "Intelligence",
  "Digital Twin",
  "Evidence",
  "Decision",
  "Utility",
] as const;

export type ExtensionCategory = (typeof EXTENSION_CATEGORIES)[number];

export const EXTENSION_STATUSES = [
  "Available",
  "Installed",
  "Enabled",
  "Disabled",
  "Upgrade Available",
  "Incompatible",
] as const;

export type ExtensionStatus = (typeof EXTENSION_STATUSES)[number];

export type ExtensionConfigSchema = {
  readonly type: "object";
  readonly properties: Readonly<
    Record<
      string,
      {
        readonly type: "string" | "number" | "boolean";
        readonly description?: string;
        readonly required?: boolean;
      }
    >
  >;
};

export type ExtensionManifest = {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly category: ExtensionCategory;
  readonly description: string;
  readonly dependencies: readonly string[];
  readonly minimumPlatformVersion: string;
  readonly minimumSdkVersion: string;
  readonly requiredPermissions: readonly PermissionDefinition[];
  readonly digitalTwinEntities: readonly string[];
  readonly connectorDependencies: readonly string[];
  readonly featureFlags: readonly string[];
  readonly configurationSchema: ExtensionConfigSchema;
};

export type ExtensionRecord = {
  readonly organizationId: string;
  readonly manifest: ExtensionManifest;
  readonly status: ExtensionStatus;
  readonly installedVersion: string;
  readonly enabled: boolean;
  readonly upgradeAvailable: boolean;
  readonly latestAvailableVersion: string | null;
  readonly dependencyStatus: "ok" | "missing" | "incompatible";
  readonly missingDependencies: readonly string[];
  readonly installedAt: string;
  readonly updatedAt: string;
  readonly configuration: Readonly<Record<string, string | number | boolean>>;
};

export interface ExtensionLifecycle {
  install(organizationId: string, manifest: ExtensionManifest): ExtensionRecord;
  enable(organizationId: string, extensionId: string): ExtensionRecord;
  disable(organizationId: string, extensionId: string): ExtensionRecord;
  upgrade(
    organizationId: string,
    extensionId: string,
    next: ExtensionManifest
  ): ExtensionRecord;
  validate(
    organizationId: string,
    extensionId: string
  ): { readonly ok: boolean; readonly errors: readonly string[] };
  uninstall(organizationId: string, extensionId: string): boolean;
}
