/**
 * Package Runtime extension ports — notify peer engines of contributions.
 * No package imports; host binds adapters.
 */

import type {
  PackageManifest,
  PackageRecord,
  PackageResult,
} from "@/jag/packages/contracts/definitions";

export type PackageExtensionCallResult = PackageResult<{
  readonly referenceId?: string;
  readonly data?: Readonly<Record<string, unknown>>;
}>;

export type ProcessPackagePort = {
  readonly onContributions?: (input: {
    record: PackageRecord;
    processIds: readonly string[];
  }) => Promise<PackageExtensionCallResult>;
};

export type DecisionPackagePort = {
  readonly onContributions?: (input: {
    record: PackageRecord;
    decisionIds: readonly string[];
  }) => Promise<PackageExtensionCallResult>;
};

export type DocumentPackagePort = {
  readonly onContributions?: (input: {
    record: PackageRecord;
    documentIds: readonly string[];
  }) => Promise<PackageExtensionCallResult>;
};

export type CommunicationPackagePort = {
  readonly onContributions?: (input: {
    record: PackageRecord;
    communicationIds: readonly string[];
  }) => Promise<PackageExtensionCallResult>;
};

export type WorkflowPackagePort = {
  readonly onContributions?: (input: {
    record: PackageRecord;
    workflowIds: readonly string[];
  }) => Promise<PackageExtensionCallResult>;
};

export type EntityPackagePort = {
  readonly onContributions?: (input: {
    record: PackageRecord;
    entityTypeIds: readonly string[];
  }) => Promise<PackageExtensionCallResult>;
};

export type NavigationPackagePort = {
  readonly onContributions?: (input: {
    record: PackageRecord;
    navigationIds: readonly string[];
  }) => Promise<PackageExtensionCallResult>;
};

export type OrganizationPackagePort = {
  readonly onPackageActivated?: (input: {
    record: PackageRecord;
    organizationId?: string;
  }) => Promise<PackageExtensionCallResult>;
};

export type PackageRuntimeExtensionPorts = {
  readonly processes?: ProcessPackagePort;
  readonly decisions?: DecisionPackagePort;
  readonly documents?: DocumentPackagePort;
  readonly communications?: CommunicationPackagePort;
  readonly workflows?: WorkflowPackagePort;
  readonly entities?: EntityPackagePort;
  readonly navigation?: NavigationPackagePort;
  readonly organization?: OrganizationPackagePort;
};

const EMPTY: PackageRuntimeExtensionPorts = Object.freeze({});
let bound: PackageRuntimeExtensionPorts = EMPTY;

export function bindPackageRuntimeExtensions(
  ports: PackageRuntimeExtensionPorts
): void {
  bound = Object.freeze({ ...ports });
}

export function getPackageRuntimeExtensions(): PackageRuntimeExtensionPorts {
  return bound;
}

export function resetPackageRuntimeExtensionsForTests(): void {
  bound = EMPTY;
}

/** Optional host-side discovery source (still no @/packages imports here). */
export type PackageManifestSource = {
  readonly listManifests: () => Promise<readonly PackageManifest[]> | readonly PackageManifest[];
};

let manifestSource: PackageManifestSource | null = null;

export function bindPackageManifestSource(
  source: PackageManifestSource | null
): void {
  manifestSource = source;
}

export function getPackageManifestSource(): PackageManifestSource | null {
  return manifestSource;
}
