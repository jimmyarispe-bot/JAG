/**
 * CapabilityDependency — Sprint 207.
 */

export type CapabilityDependency = {
  readonly capabilityId: string;
  readonly versionRange: string;
  readonly optional?: boolean;
};

export type CapabilityDependencyIssueKind =
  | "missing"
  | "version_mismatch"
  | "circular"
  | "disabled"
  | "provider_conflict";

export type CapabilityDependencyIssue = {
  readonly kind: CapabilityDependencyIssueKind;
  readonly capabilityId: string;
  readonly dependencyId?: string;
  readonly detail: string;
};
