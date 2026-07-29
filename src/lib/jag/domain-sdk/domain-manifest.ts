/**
 * Canonical Domain Manifest — required declaration for every industry pack.
 */

import type { DomainCapability } from "./domain-capabilities";
import type {
  DomainContributorDeclaration,
  DomainDependency,
  DomainMetadata,
  DomainOwner,
  DomainPermissionDeclaration,
} from "./domain-metadata";

/**
 * Every domain must declare this shape.
 * Education, Healthcare, Manufacturing, Government, etc. use the same schema.
 */
export interface DomainManifest {
  id: string;
  name: string;
  displayName: string;
  version: string;
  description: string;
  owner: DomainOwner;
  supportedCapabilities: readonly DomainCapability[];
  contributors: readonly DomainContributorDeclaration[];
  /** Runtime contract version range or minimum (e.g. ^1.0.0-rc, 1.0.0-rc). */
  requiredRuntimeVersion: string;
  /** Minimum Core version (e.g. 1.0.0-rc). */
  minimumCoreVersion: string;
  permissions: readonly DomainPermissionDeclaration[];
  dependencies: readonly DomainDependency[];
  featureFlags: Readonly<Record<string, boolean>>;
  /** Optional SDK version requirement. */
  requiredSdkVersion?: string;
  metadata?: DomainMetadata;
}

export type DomainManifestInput = Omit<
  DomainManifest,
  | "supportedCapabilities"
  | "contributors"
  | "permissions"
  | "dependencies"
  | "featureFlags"
> & {
  supportedCapabilities?: readonly DomainCapability[];
  contributors?: readonly DomainContributorDeclaration[];
  permissions?: readonly DomainPermissionDeclaration[];
  dependencies?: readonly DomainDependency[];
  featureFlags?: Readonly<Record<string, boolean>>;
};

export function createDomainManifest(
  input: DomainManifestInput
): DomainManifest {
  return {
    id: input.id,
    name: input.name,
    displayName: input.displayName,
    version: input.version,
    description: input.description,
    owner: input.owner,
    supportedCapabilities: input.supportedCapabilities ?? [],
    contributors: input.contributors ?? [],
    requiredRuntimeVersion: input.requiredRuntimeVersion,
    minimumCoreVersion: input.minimumCoreVersion,
    permissions: input.permissions ?? [],
    dependencies: input.dependencies ?? [],
    featureFlags: input.featureFlags ?? {},
    requiredSdkVersion: input.requiredSdkVersion,
    metadata: input.metadata,
  };
}
