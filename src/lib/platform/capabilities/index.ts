/**
 * Intelligence Capability SDK — Sprint 207.
 * Application architecture only. Does not change JAG Core behavior.
 *
 * DX: register a CapabilityManifest (+ providers) → workspace discovers it.
 */

export type { CapabilityVersion } from "./CapabilityVersion";
export {
  parseCapabilityVersion,
  formatCapabilityVersion,
  compareCapabilityVersions,
  satisfiesVersion,
} from "./CapabilityVersion";

export type {
  CapabilityPermission,
  CapabilityPermissions,
} from "./CapabilityPermissions";
export { CAPABILITY_PERMISSION_PRESETS } from "./CapabilityPermissions";

export type {
  CapabilityCategory,
  CapabilityMetadata,
  CapabilityFeatureFlags,
} from "./CapabilityMetadata";

export type {
  CapabilityDependency,
  CapabilityDependencyIssue,
  CapabilityDependencyIssueKind,
} from "./CapabilityDependency";

export type {
  CapabilityHealthStatus,
  CapabilityHealth,
  CapabilityHealthProvider,
} from "./CapabilityHealth";
export { CAPABILITY_HEALTH_STATUSES } from "./CapabilityHealth";

export type {
  CapabilityNavItem,
  CapabilityRoute,
  CapabilitySearchItem,
  CapabilitySearchProvider,
  CapabilityConversationProvider,
  CapabilityBriefingProvider,
  CapabilityWatcherProvider,
  CapabilityObservabilityProvider,
  CapabilityProviders,
} from "./CapabilityProvider";

export type {
  CapabilityLifecycleState,
  CapabilityLifecycle,
} from "./CapabilityLifecycle";
export { CAPABILITY_LIFECYCLE_STATES } from "./CapabilityLifecycle";

export type { CapabilityManifest } from "./CapabilityManifest";

export {
  CapabilityRegistry,
  type RegisteredCapability,
} from "./CapabilityRegistry";

export {
  CapabilityLoader,
  SHELL_NAVIGATION,
} from "./CapabilityLoader";

export {
  CapabilityService,
  type CapabilityExplorerModel,
} from "./CapabilityService";

export {
  ensureCapabilitiesRegistered,
  resetCapabilitiesForTests,
} from "./bootstrap";

export { PHASE_II_INTELLIGENCE_MANIFESTS } from "./manifests/intelligence";

export {
  recordCapabilityObservation,
  listCapabilityObservations,
  clearCapabilityObservationsForTests,
  type CapabilityObservation,
  type CapabilityObservationKind,
} from "./observability";
