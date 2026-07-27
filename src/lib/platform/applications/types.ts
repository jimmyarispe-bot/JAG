/**
 * JAG platform application registry types (Sprint 059).
 *
 * Platform = JAG · Application #1 = AcademyOS · Tenant = Organization.
 * Metadata only — not wired into navigation or entitlements yet.
 */

export type PlatformApplicationKey = "academyos" | (string & {});

export type PlatformApplicationStatus = "active" | "inactive" | "deprecated";

export type OrganizationApplicationStatus = "enabled" | "disabled";

export type PlatformApplication = {
  id: string;
  key: PlatformApplicationKey;
  name: string;
  description: string;
  status: PlatformApplicationStatus;
  sortOrder: number;
  homeRoute: string | null;
  permissionPackKey: string | null;
  metadata: Record<string, unknown>;
};

export type OrganizationApplicationEnablement = {
  id: string;
  organizationId: string;
  applicationId: string;
  applicationKey: PlatformApplicationKey;
  applicationName: string;
  status: OrganizationApplicationStatus;
  enabledAt: string | null;
  disabledAt: string | null;
  metadata: Record<string, unknown>;
};

export type TenantApplicationSnapshot = {
  platformName: "JAG";
  organizationId: string;
  enabledApplicationKeys: PlatformApplicationKey[];
  /** True when enablement was inferred (no rows), not loaded from DB. */
  usedSoftDefault: boolean;
};
