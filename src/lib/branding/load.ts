import { cache } from "react";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { getAuthUser } from "@/lib/auth/auth-user";
import { getOrganizationRecord } from "@/lib/configuration/context";
import { getConfigSection } from "@/lib/configuration/sections";
import { resolvePrimaryOrganizationId } from "@/lib/platform/identity/org-membership";
import { resolveOrganizationBranding } from "@/lib/branding/resolve";
import { buildFallbackBranding } from "@/lib/branding/defaults";
import type { OrganizationBranding } from "@/lib/branding/types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/**
 * Request-scoped branding load (Sprint P002).
 * Keyed only by organizationId so all callers share one result per request.
 */
const loadOrganizationBrandingCached = cache(
  async (organizationIdKey: string): Promise<OrganizationBranding> => {
    const { supabase, user } = await getAuthUser();
    const orgId =
      organizationIdKey || (await resolvePrimaryOrganizationId(user?.id)) || "";
    if (!orgId) {
      return buildFallbackBranding("unknown", "School Platform");
    }

    const [orgRecord, brandingConfig, organizationConfig] = await Promise.all([
      getOrganizationRecord(supabase, orgId),
      getConfigSection(supabase, orgId, "branding"),
      getConfigSection(supabase, orgId, "organization"),
    ]);

    const organizationName =
      (typeof organizationConfig.legal_name === "string" && organizationConfig.legal_name.trim()) ||
      orgRecord?.name ||
      "School Platform";

    return resolveOrganizationBranding({
      organizationId: orgId,
      organizationName,
      brandingConfig,
      organizationConfig,
    });
  }
);

/**
 * Load organization branding once per request.
 * `_supabase` is accepted for call-site compatibility; the cached auth client is used.
 */
export async function loadOrganizationBranding(
  _supabase?: AuthClient,
  organizationId?: string | null
): Promise<OrganizationBranding> {
  return loadOrganizationBrandingCached(organizationId ?? "");
}
