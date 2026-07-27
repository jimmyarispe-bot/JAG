import {
  DEFAULT_APPLICATION_KEY,
  PLATFORM_NAME,
} from "@/lib/platform/applications/catalog";
import type {
  OrganizationApplicationEnablement,
  PlatformApplicationKey,
  TenantApplicationSnapshot,
} from "@/lib/platform/applications/types";

/**
 * Resolve enabled application keys for a tenant.
 *
 * Soft default (Phase 1 / Sprint 059): if there are **no** enablement rows,
 * treat the tenant as AcademyOS-enabled so existing orgs keep working
 * before/without migration apply. Explicit `disabled` rows are honored.
 *
 * Not wired into UI or permission gates yet.
 */
export function resolveEnabledApplicationKeys(
  enablements: ReadonlyArray<Pick<OrganizationApplicationEnablement, "applicationKey" | "status">> | null | undefined
): { keys: PlatformApplicationKey[]; usedSoftDefault: boolean } {
  if (!enablements || enablements.length === 0) {
    return { keys: [DEFAULT_APPLICATION_KEY], usedSoftDefault: true };
  }

  const keys = enablements
    .filter((row) => row.status === "enabled")
    .map((row) => row.applicationKey);

  return { keys, usedSoftDefault: false };
}

export function isApplicationEnabled(
  enabledKeys: ReadonlyArray<PlatformApplicationKey>,
  key: PlatformApplicationKey
): boolean {
  return enabledKeys.includes(key);
}

export function buildTenantApplicationSnapshot(input: {
  organizationId: string;
  enablements: ReadonlyArray<Pick<OrganizationApplicationEnablement, "applicationKey" | "status">> | null | undefined;
}): TenantApplicationSnapshot {
  const resolved = resolveEnabledApplicationKeys(input.enablements);
  return {
    platformName: PLATFORM_NAME,
    organizationId: input.organizationId,
    enabledApplicationKeys: resolved.keys,
    usedSoftDefault: resolved.usedSoftDefault,
  };
}
