import type { createAuthClient } from "@/lib/supabase/server-auth";
import { getPrimaryOrganizationId, getOrganizationRecord } from "@/lib/configuration/context";
import { getConfigSection } from "@/lib/configuration/sections";
import { resolveOrganizationBranding } from "@/lib/branding/resolve";
import { buildFallbackBranding } from "@/lib/branding/defaults";
import type { OrganizationBranding } from "@/lib/branding/types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function loadOrganizationBranding(
  supabase: AuthClient,
  organizationId?: string | null
): Promise<OrganizationBranding> {
  const orgId = organizationId ?? (await getPrimaryOrganizationId(supabase));
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
