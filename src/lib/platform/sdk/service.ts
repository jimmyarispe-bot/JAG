import {
  applicationsDeclaringCapability,
  getManifest,
  isApplicationEnabled,
  listEnabledApplications,
  listManifests,
  resolveApplicationCapabilities,
} from "@/lib/platform/sdk/application";
import {
  PLATFORM_CAPABILITIES,
  PLATFORM_CAPABILITY_LABELS,
  hasCapability,
  isPlatformCapability,
  resolveCapabilities,
} from "@/lib/platform/sdk/capabilities";
import {
  PLATFORM_VERSION,
  checkCompatibility,
  compareSemver,
  isCompatible,
} from "@/lib/platform/sdk/compatibility";
import {
  CAPABILITY_EXTENSION_POINTS,
  PLATFORM_EXTENSION_POINTS,
  isSupportedExtensionPoint,
  listAllCapabilities,
  listAllExtensionPoints,
  listExtensionPointsForCapability,
} from "@/lib/platform/sdk/contracts";
import {
  extensionCapabilityWarnings,
  listManifestExtensions,
  validateExtensions,
} from "@/lib/platform/sdk/extensions";
import {
  assertTransition,
  canTransition,
  isOperational,
  lifecycleTransitionIssue,
  listLifecycleEvents,
  nextLifecycleState,
} from "@/lib/platform/sdk/lifecycle";
import { emptyManifest, normalizeManifest } from "@/lib/platform/sdk/manifest";
import {
  SdkRegistry,
  assertApplicationRegistered,
  getApplication,
  listApplications,
  putApplication,
  removeApplication,
  resetSdkRegistryForTests,
} from "@/lib/platform/sdk/registry";
import { validateManifest } from "@/lib/platform/sdk/validation";
import type {
  ApplicationLifecycleEvent,
  ApplicationManifest,
  LifecycleTransitionResult,
  RegisteredApplication,
  SdkRegisterOptions,
} from "@/lib/platform/sdk/types";

export function resetSdkFrameworkForTests(): void {
  resetSdkRegistryForTests();
}

function nowIso(now?: string): string {
  return now ?? new Date().toISOString();
}

/**
 * Platform Governance & Extension SDK.
 * Applications register manifests; platform validates capabilities and lifecycle.
 * Does not call into Entity/Forms/Workflow/API registries.
 */
export const SdkService = {
  registry: SdkRegistry,
  platformVersion: PLATFORM_VERSION,
  capabilities: PLATFORM_CAPABILITIES,
  capabilityLabels: PLATFORM_CAPABILITY_LABELS,
  extensionPoints: PLATFORM_EXTENSION_POINTS,

  normalize: normalizeManifest,
  emptyManifest,
  validate: validateManifest,
  resolveCapabilities,
  hasCapability,
  isPlatformCapability,
  checkCompatibility,
  isCompatible,
  compareSemver,
  listExtensionPoints: listAllExtensionPoints,
  listCapabilities: listAllCapabilities,
  extensionPointsFor: listExtensionPointsForCapability,
  isSupportedExtensionPoint,
  capabilityExtensionPoints: CAPABILITY_EXTENSION_POINTS,
  validateExtensions,
  extensionWarnings: extensionCapabilityWarnings,
  listExtensions: listManifestExtensions,

  /**
   * Register an application manifest (governance contract only).
   * Does not rewrite or invoke framework registrations.
   */
  register(
    manifest: ApplicationManifest,
    options?: SdkRegisterOptions
  ): RegisteredApplication {
    const normalized = normalizeManifest(manifest);
    const result = options?.skipValidation
      ? { valid: true, issues: [] }
      : validateManifest(normalized);

    if (!result.valid) {
      const detail = result.issues
        .map((i) => `${i.code}: ${i.message}`)
        .join("; ");
      throw new Error(`Manifest validation failed: ${detail}`);
    }

    const timestamp = nowIso(options?.now);
    const existing = getApplication(normalized.id);
    const record: RegisteredApplication = {
      manifest: normalized,
      state: options?.initialState ?? existing?.state ?? "installed",
      installedAt: existing?.installedAt ?? timestamp,
      updatedAt: timestamp,
      lastEvent: existing?.lastEvent ?? "install",
      validationIssues: [],
    };
    return putApplication(record);
  },

  unregister(applicationId: string): boolean {
    return removeApplication(applicationId);
  },

  get: getApplication,
  getManifest,
  list: listApplications,
  listManifests,
  listEnabled: listEnabledApplications,
  isEnabled: isApplicationEnabled,
  assertRegistered: assertApplicationRegistered,
  resolveApplicationCapabilities,
  applicationsWithCapability: applicationsDeclaringCapability,

  // Lifecycle orchestration points (no deployment tooling)
  canTransition,
  nextState: nextLifecycleState,
  listLifecycleEvents,
  isOperational,

  transition(
    applicationId: string,
    event: ApplicationLifecycleEvent,
    options?: { now?: string; skipValidation?: boolean }
  ): LifecycleTransitionResult {
    const record = assertApplicationRegistered(applicationId);
    const from = record.state;
    const issue = lifecycleTransitionIssue(from, event);
    if (issue) {
      return {
        applicationId,
        from,
        to: from,
        event,
        ok: false,
        issues: [issue],
      };
    }

    const issues = [];
    if (event === "validate" || event === "enable") {
      if (!options?.skipValidation) {
        const validation = validateManifest(record.manifest);
        issues.push(...validation.issues);
        if (!validation.valid && event === "enable") {
          return {
            applicationId,
            from,
            to: from,
            event,
            ok: false,
            issues,
          };
        }
      }
    }

    const to = assertTransition(from, event);
    const timestamp = nowIso(options?.now);
    putApplication({
      ...record,
      state: to,
      updatedAt: timestamp,
      lastEvent: event,
      validationIssues: issues,
    });

    return { applicationId, from, to, event, ok: true, issues };
  },

  install(applicationId: string, options?: { now?: string }) {
    return this.transition(applicationId, "install", options);
  },
  validateApp(applicationId: string, options?: { now?: string }) {
    return this.transition(applicationId, "validate", options);
  },
  enable(applicationId: string, options?: { now?: string }) {
    return this.transition(applicationId, "enable", options);
  },
  disable(applicationId: string, options?: { now?: string }) {
    return this.transition(applicationId, "disable", options);
  },
  upgrade(applicationId: string, options?: { now?: string }) {
    return this.transition(applicationId, "upgrade", options);
  },
  uninstall(applicationId: string, options?: { now?: string }) {
    return this.transition(applicationId, "uninstall", options);
  },

  /**
   * Apply a new manifest version during upgrade (state must allow upgrade path).
   */
  applyUpgrade(
    applicationId: string,
    nextManifest: ApplicationManifest,
    options?: { now?: string }
  ): RegisteredApplication {
    const record = assertApplicationRegistered(applicationId);
    if (record.manifest.id !== nextManifest.id) {
      throw new Error("Upgrade manifest id must match registered application");
    }
    if (record.state !== "upgrading" && record.state !== "enabled" && record.state !== "disabled") {
      // Allow starting upgrade then applying
      if (record.state === "validated" || record.state === "installed") {
        // ok to apply as replace while not uninstalled
      } else if (record.state === "uninstalled") {
        throw new Error("Cannot upgrade an uninstalled application");
      }
    }

    const normalized = normalizeManifest(nextManifest);
    const validation = validateManifest(normalized);
    if (!validation.valid) {
      const detail = validation.issues
        .map((i) => `${i.code}: ${i.message}`)
        .join("; ");
      throw new Error(`Upgrade validation failed: ${detail}`);
    }

    const timestamp = nowIso(options?.now);
    let state = record.state;
    if (state === "enabled" || state === "disabled" || state === "validated") {
      state = "upgrading";
    }

    return putApplication({
      ...record,
      manifest: normalized,
      state,
      updatedAt: timestamp,
      lastEvent: "upgrade",
      validationIssues: [],
    });
  },

  resetForTests: resetSdkFrameworkForTests,
} as const;

export type SdkServiceApi = typeof SdkService;
