/**
 * CapabilityManifest — Sprint 207 Intelligence Capability SDK.
 */

import type { CapabilityDependency } from "./CapabilityDependency";
import type {
  CapabilityCategory,
  CapabilityFeatureFlags,
  CapabilityMetadata,
} from "./CapabilityMetadata";
import type { CapabilityPermissions } from "./CapabilityPermissions";
import type {
  CapabilityNavItem,
  CapabilityProviders,
  CapabilityRoute,
} from "./CapabilityProvider";
import type { CapabilityVersion } from "./CapabilityVersion";

export type CapabilityManifest = {
  readonly id: string;
  readonly name: string;
  readonly version: CapabilityVersion;
  readonly description: string;
  readonly category: CapabilityCategory;
  readonly routes: readonly CapabilityRoute[];
  readonly navigation: readonly CapabilityNavItem[];
  readonly permissions: CapabilityPermissions;
  readonly dependencies: readonly CapabilityDependency[];
  readonly providers: CapabilityProviders;
  readonly featureFlags: CapabilityFeatureFlags;
  readonly metadata: CapabilityMetadata;
  readonly enabled: boolean;
};
