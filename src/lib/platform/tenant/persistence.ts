import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createAnonServerClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";
import { BrandRegistry } from "@/lib/platform/branding";
import type { OrganizationBrand } from "@/lib/platform/branding/types";

/**
 * Durable backing for the tenant registries (migration 226).
 *
 * The registries stay synchronous in-memory Maps — this module hydrates them
 * once per request at entry points, and writes through on mutation. Callers
 * downstream are unchanged.
 *
 * Fail-soft by design: if `organization_brands` is missing (code deployed
 * before the migration ran) hydration logs and returns, leaving the seeded
 * demo brands in place rather than breaking every login page.
 */

const BRANDS_TABLE = "organization_brands";

/**
 * The generated `Database` types predate migration 226, so these queries use an
 * untyped client. Regenerate with `supabase gen types typescript --linked` and
 * this cast can go away.
 */
type UntypedClient = SupabaseClient;

function anonClient(): UntypedClient {
  return createAnonServerClient() as unknown as UntypedClient;
}

function serviceClient(): UntypedClient {
  return createServiceRoleClient() as unknown as UntypedClient;
}

type BrandRow = {
  organization_id: string;
  subdomain: string;
  organization_name: string;
  display_name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  success_color: string;
  warning_color: string;
  danger_color: string;
  light_logo_url: string;
  dark_logo_url: string;
  favicon_url: string;
  app_icon_url: string;
  heading_font: string;
  body_font: string;
  login_background_url: string;
  dashboard_background_url: string;
  email_footer: string;
  pdf_footer: string;
  powered_by_enabled: boolean;
  created_at: string;
  updated_at: string;
};

function rowToBrand(row: BrandRow): OrganizationBrand {
  return {
    organization_id: row.organization_id,
    subdomain: row.subdomain,
    organization_name: row.organization_name,
    display_name: row.display_name,
    primary_color: row.primary_color,
    secondary_color: row.secondary_color,
    accent_color: row.accent_color,
    success_color: row.success_color,
    warning_color: row.warning_color,
    danger_color: row.danger_color,
    light_logo_url: row.light_logo_url,
    dark_logo_url: row.dark_logo_url,
    favicon_url: row.favicon_url,
    app_icon_url: row.app_icon_url,
    heading_font: row.heading_font,
    body_font: row.body_font,
    login_background_url: row.login_background_url,
    dashboard_background_url: row.dashboard_background_url,
    email_footer: row.email_footer,
    pdf_footer: row.pdf_footer,
    powered_by_enabled: row.powered_by_enabled,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function brandToRow(brand: OrganizationBrand): BrandRow {
  return {
    organization_id: brand.organization_id,
    subdomain: brand.subdomain.toLowerCase(),
    organization_name: brand.organization_name,
    display_name: brand.display_name,
    primary_color: brand.primary_color,
    secondary_color: brand.secondary_color,
    accent_color: brand.accent_color,
    success_color: brand.success_color,
    warning_color: brand.warning_color,
    danger_color: brand.danger_color,
    light_logo_url: brand.light_logo_url,
    dark_logo_url: brand.dark_logo_url,
    favicon_url: brand.favicon_url,
    app_icon_url: brand.app_icon_url,
    heading_font: brand.heading_font,
    body_font: brand.body_font,
    login_background_url: brand.login_background_url,
    dashboard_background_url: brand.dashboard_background_url,
    email_footer: brand.email_footer,
    pdf_footer: brand.pdf_footer,
    powered_by_enabled: brand.powered_by_enabled,
    created_at: brand.created_at,
    updated_at: brand.updated_at,
  };
}

/**
 * Fill the in-memory brand registry from the database.
 * Cached per request — repeated calls in one render cost one query.
 */
export const hydrateBrandRegistry = cache(async (): Promise<number> => {
  try {
    const { data, error } = await anonClient().from(BRANDS_TABLE).select("*");
    if (error) {
      console.warn(`[tenant-persistence] brand hydrate skipped: ${error.message}`);
      return 0;
    }
    const rows = (data ?? []) as BrandRow[];
    for (const row of rows) {
      BrandRegistry.upsert(rowToBrand(row));
    }
    return rows.length;
  } catch (cause) {
    console.warn("[tenant-persistence] brand hydrate failed", cause);
    return 0;
  }
});

/** Write a brand through to the database. Service role only. */
export async function persistBrand(
  brand: OrganizationBrand
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { error } = await serviceClient()
      .from(BRANDS_TABLE)
      .upsert(brandToRow(brand), { onConflict: "organization_id" });
    if (error) return { ok: false, error: error.message };
    BrandRegistry.upsert(brand);
    return { ok: true };
  } catch (cause) {
    return {
      ok: false,
      error: cause instanceof Error ? cause.message : "Unknown persistence error",
    };
  }
}

/** Remove a brand from the database and the in-memory registry. */
export async function deletePersistedBrand(
  organizationId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { error } = await serviceClient()
      .from(BRANDS_TABLE)
      .delete()
      .eq("organization_id", organizationId);
    if (error) return { ok: false, error: error.message };
    BrandRegistry.remove(organizationId);
    return { ok: true };
  } catch (cause) {
    return {
      ok: false,
      error: cause instanceof Error ? cause.message : "Unknown persistence error",
    };
  }
}

/** True when a subdomain is already taken by a different organization. */
export async function subdomainTaken(
  subdomain: string,
  exceptOrganizationId?: string
): Promise<boolean> {
  const { data, error } = await anonClient()
    .from(BRANDS_TABLE)
    .select("organization_id")
    .eq("subdomain", subdomain.trim().toLowerCase())
    .limit(1);
  if (error || !data?.length) return false;
  const owner = (data[0] as { organization_id: string }).organization_id;
  return owner !== exceptOrganizationId;
}
