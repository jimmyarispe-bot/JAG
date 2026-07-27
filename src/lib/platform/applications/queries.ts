import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import type {
  OrganizationApplicationEnablement,
  PlatformApplication,
  PlatformApplicationKey,
  PlatformApplicationStatus,
  OrganizationApplicationStatus,
} from "@/lib/platform/applications/types";
import { buildTenantApplicationSnapshot } from "@/lib/platform/applications/resolve";

type Db = SupabaseClient<Database>;

function asRecord(value: Json | null | undefined): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function mapPlatformApplication(row: {
  id: string;
  key: string;
  name: string;
  description: string;
  status: string;
  sort_order: number;
  home_route: string | null;
  permission_pack_key: string | null;
  metadata: Json;
}): PlatformApplication {
  return {
    id: row.id,
    key: row.key as PlatformApplicationKey,
    name: row.name,
    description: row.description,
    status: row.status as PlatformApplicationStatus,
    sortOrder: row.sort_order,
    homeRoute: row.home_route,
    permissionPackKey: row.permission_pack_key,
    metadata: asRecord(row.metadata),
  };
}

/** List active applications from the platform registry. */
export async function listPlatformApplications(
  supabase: Db
): Promise<PlatformApplication[]> {
  const { data, error } = await supabase
    .from("platform_applications")
    .select(
      "id, key, name, description, status, sort_order, home_route, permission_pack_key, metadata"
    )
    .eq("status", "active")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapPlatformApplication);
}

/** Load enablement rows for one tenant (joined with application key/name). */
export async function listOrganizationApplications(
  supabase: Db,
  organizationId: string
): Promise<OrganizationApplicationEnablement[]> {
  const { data, error } = await supabase
    .from("organization_applications")
    .select(
      `
      id,
      organization_id,
      application_id,
      status,
      enabled_at,
      disabled_at,
      metadata,
      platform_applications!inner (
        key,
        name
      )
    `
    )
    .eq("organization_id", organizationId);

  if (error) throw error;

  return (data ?? []).map((row) => {
    const app = row.platform_applications as unknown as {
      key: string;
      name: string;
    };
    return {
      id: row.id,
      organizationId: row.organization_id,
      applicationId: row.application_id,
      applicationKey: app.key as PlatformApplicationKey,
      applicationName: app.name,
      status: row.status as OrganizationApplicationStatus,
      enabledAt: row.enabled_at,
      disabledAt: row.disabled_at,
      metadata: asRecord(row.metadata),
    };
  });
}

/**
 * Tenant enablement snapshot with soft default.
 * Safe to call from future layout/identity code; unused by UI in Sprint 059.
 */
export async function getTenantApplicationSnapshot(
  supabase: Db,
  organizationId: string
) {
  const enablements = await listOrganizationApplications(supabase, organizationId);
  return buildTenantApplicationSnapshot({ organizationId, enablements });
}
