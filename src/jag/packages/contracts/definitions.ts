/**
 * JAG Package Runtime — immutable manifest & lifecycle contracts.
 * Declarative only: never executes industry business logic.
 */

export type PackageId = string;
export type PackageVersionString = string;

export type PackageLifecycleState =
  | "discovered"
  | "validated"
  | "installed"
  | "initialized"
  | "activated"
  | "suspended"
  | "deactivated"
  | "removed";

export const PACKAGE_LIFECYCLE_STATES: readonly PackageLifecycleState[] = [
  "discovered",
  "validated",
  "installed",
  "initialized",
  "activated",
  "suspended",
  "deactivated",
  "removed",
] as const;

/** Allowed contribution kinds — packages may not contribute engines. */
export type PackageContributionKind =
  | "entities"
  | "forms"
  | "workflows"
  | "processes"
  | "decisions"
  | "documents"
  | "communications"
  | "navigation"
  | "reports"
  | "permissions"
  | "terminology"
  | "localization";

export const PACKAGE_CONTRIBUTION_KINDS: readonly PackageContributionKind[] = [
  "entities",
  "forms",
  "workflows",
  "processes",
  "decisions",
  "documents",
  "communications",
  "navigation",
  "reports",
  "permissions",
  "terminology",
  "localization",
] as const;

export const FORBIDDEN_PACKAGE_CONTRIBUTION_KINDS = [
  "engines",
  "runtime",
  "infrastructure",
  "persistence",
  "providers",
] as const;

export type PackageVersion = {
  readonly raw: PackageVersionString;
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly prerelease?: string;
};

export type PackageCompatibility = {
  readonly jagMinVersion?: PackageVersionString;
  readonly jagMaxVersion?: PackageVersionString;
  readonly apiLevel?: number;
};

export type PackageMetadata = {
  readonly id: PackageId;
  readonly applicationId: string;
  readonly displayName: string;
  readonly description?: string;
  readonly version: PackageVersionString;
  readonly publisher?: string;
  readonly license?: string;
  readonly tags?: readonly string[];
};

export type PackageCapability = {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
};

export type PackageDependency = {
  readonly packageId: PackageId;
  readonly minVersion?: PackageVersionString;
  readonly maxVersion?: PackageVersionString;
  readonly optional?: boolean;
  /** If true, this package cannot be activated alongside the named package. */
  readonly incompatible?: boolean;
};

export type PackageExtension = {
  readonly id: string;
  readonly target:
    | "processes"
    | "decisions"
    | "documents"
    | "communications"
    | "workflows"
    | "entities"
    | "navigation"
    | "organization";
  readonly referenceIds?: readonly string[];
};

export type PackageContribution = {
  readonly kind: PackageContributionKind;
  /** Opaque contribution ids declared by the package (definition ids, etc.). */
  readonly ids: readonly string[];
  readonly label?: string;
};

export type PackageManifest = {
  readonly metadata: PackageMetadata;
  readonly compatibility?: PackageCompatibility;
  readonly capabilities?: readonly PackageCapability[];
  readonly dependencies?: readonly PackageDependency[];
  readonly extensions?: readonly PackageExtension[];
  readonly contributions: readonly PackageContribution[];
};

export type PackageLifecycle = {
  readonly packageId: PackageId;
  readonly state: PackageLifecycleState;
  readonly updatedAt: string;
  readonly previousState?: PackageLifecycleState;
  readonly reason?: string;
};

export type PackageRecord = {
  readonly manifest: PackageManifest;
  readonly version: PackageVersion;
  readonly state: PackageLifecycleState;
  readonly discoveredAt: string;
  readonly installedAt?: string;
  readonly activatedAt?: string;
  readonly deactivatedAt?: string;
  readonly suspendedAt?: string;
  readonly removedAt?: string;
};

export type PackageEventType =
  | "package.discovered"
  | "package.validated"
  | "package.installed"
  | "package.initialized"
  | "package.activated"
  | "package.suspended"
  | "package.deactivated"
  | "package.removed"
  | "package.contributions_registered"
  | "package.dependency_rejected";

export type PackageEvent = {
  readonly id: string;
  readonly type: PackageEventType;
  readonly packageId: PackageId;
  readonly occurredAt: string;
  readonly data?: Readonly<Record<string, unknown>>;
};

export type PackageMetrics = {
  readonly packageId: PackageId;
  readonly state: PackageLifecycleState;
  readonly contributionCount: number;
  readonly dependencyCount: number;
  readonly activatedAt?: string;
};

export type PackageResult<T = void> = {
  readonly ok: boolean;
  readonly value?: T;
  readonly error?: { readonly code: string; readonly message: string };
  readonly events?: readonly PackageEvent[];
};
