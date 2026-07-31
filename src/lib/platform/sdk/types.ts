/**
 * Platform Governance & Extension SDK (Sprint 077).
 * Contracts for how applications plug into JAG — versioned, validated, explicit.
 * Does not replace framework registries or implement deployment tooling.
 */

/** Platform capabilities applications may declare. */
export type PlatformCapability =
  | "entities"
  | "schemas"
  | "forms"
  | "workflows"
  | "apis"
  | "graph"
  | "forecasting"
  | "automation"
  | "notifications"
  | "decisions"
  | "permissions";

export type ApplicationLifecycleState =
  | "installed"
  | "validated"
  | "enabled"
  | "disabled"
  | "upgrading"
  | "uninstalled";

export type ApplicationLifecycleEvent =
  | "install"
  | "validate"
  | "enable"
  | "disable"
  | "upgrade"
  | "uninstall";

export type ManifestSchemaRef = {
  schemaId: string;
  version?: string;
};

export type ManifestFormRef = {
  formId: string;
  version?: string;
};

export type ManifestWorkflowRef = {
  workflowId: string;
  version?: string;
};

export type ManifestApiRef = {
  endpointId: string;
  version?: string;
};

export type ManifestEntityRef = {
  entityType: string;
};

export type ManifestPermissionRef = {
  permission: string;
  action?: string;
};

export type ManifestAutomationRef = {
  ruleId: string;
};

export type ManifestDependency = {
  /** Another application id. */
  applicationId: string;
  /** Optional semver range note (not auto-resolved). */
  versionRange?: string | null;
  optional?: boolean;
};

export type ManifestExtension = {
  id: string;
  /** Extension point id from the platform catalog. */
  extensionPoint: string;
  version?: string;
  metadata?: Record<string, unknown>;
};

export type CompatibilityMeta = {
  /** Minimum JAG platform version required. */
  minPlatformVersion: string;
  /** Highest platform version this app was tested against. */
  maxTestedPlatformVersion?: string | null;
  /** Capabilities the app still uses but are deprecated. */
  deprecatedCapabilities?: PlatformCapability[];
  notes?: string | null;
};

/**
 * Single application contract — every app exposes one manifest.
 */
export type ApplicationManifest = {
  id: string;
  name: string;
  version: string;
  description?: string | null;
  capabilities: PlatformCapability[];
  schemas: ManifestSchemaRef[];
  entities: ManifestEntityRef[];
  forms: ManifestFormRef[];
  workflows: ManifestWorkflowRef[];
  apis: ManifestApiRef[];
  permissions: ManifestPermissionRef[];
  automation: ManifestAutomationRef[];
  dependencies: ManifestDependency[];
  extensions: ManifestExtension[];
  compatibility: CompatibilityMeta;
  metadata: Record<string, unknown>;
};

export type RegisteredApplication = {
  manifest: ApplicationManifest;
  state: ApplicationLifecycleState;
  installedAt: string;
  updatedAt: string;
  lastEvent: ApplicationLifecycleEvent | null;
  validationIssues: SdkValidationIssue[];
};

export type SdkValidationIssue = {
  path: string;
  code: string;
  message: string;
};

export type SdkValidationResult = {
  valid: boolean;
  issues: SdkValidationIssue[];
};

export type LifecycleTransitionResult = {
  applicationId: string;
  from: ApplicationLifecycleState;
  to: ApplicationLifecycleState;
  event: ApplicationLifecycleEvent;
  ok: boolean;
  issues: SdkValidationIssue[];
};

export type CapabilityResolution = {
  declared: PlatformCapability[];
  requiredByArtifacts: PlatformCapability[];
  missing: PlatformCapability[];
  unused: PlatformCapability[];
};

export type SdkRegisterOptions = {
  skipValidation?: boolean;
  /** Initial lifecycle state after register (default: installed). */
  initialState?: ApplicationLifecycleState;
  now?: string;
};
