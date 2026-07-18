import { createAuthClient } from "@/lib/supabase/server-auth";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { canViewConfiguration } from "@/lib/configuration/access";
import { getOrganizationRecord, getPrimaryOrganizationId } from "@/lib/configuration/context";
import { getConfigSection } from "@/lib/configuration/sections";
import type { ConfigSectionKey } from "@/lib/configuration/types";
import { redirect } from "next/navigation";

function hydrateOrganizationConfig(
  config: Record<string, unknown>,
  org: { name?: string | null; settings?: unknown } | null
): Record<string, unknown> {
  if (!org) return config;

  const settings =
    org.settings && typeof org.settings === "object" && !Array.isArray(org.settings)
      ? (org.settings as Record<string, unknown>)
      : {};

  return {
    ...settings,
    ...config,
    legal_name:
      (typeof config.legal_name === "string" && config.legal_name.trim()) ||
      (typeof settings.legal_name === "string" && settings.legal_name.trim()) ||
      org.name ||
      "",
  };
}

export async function loadConfigPage(sectionKey?: ConfigSectionKey) {
  const ctx = await getIdentityContext();
  if (!ctx || !canViewConfiguration(ctx)) redirect("/dashboard");

  const supabase = await createAuthClient();
  const organizationId = await getPrimaryOrganizationId(supabase);
  if (!organizationId) redirect("/dashboard/admin");

  let config: Record<string, unknown> = {};
  try {
    if (sectionKey) {
      config = await getConfigSection(supabase, organizationId, sectionKey);
      if (sectionKey === "organization") {
        const org = await getOrganizationRecord(supabase, organizationId);
        config = hydrateOrganizationConfig(config, org);
      }
    }
  } catch {
    // Prefer an immediate empty state over a Vercel function timeout.
    config = {};
  }

  return { ctx, supabase, organizationId, config };
}
