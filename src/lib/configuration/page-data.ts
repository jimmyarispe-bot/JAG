import { createAuthClient } from "@/lib/supabase/server-auth";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { canViewConfiguration } from "@/lib/configuration/access";
import { getOrganizationRecord, getPrimaryOrganizationId } from "@/lib/configuration/context";
import { getConfigSection } from "@/lib/configuration/sections";
import type { ConfigSectionKey } from "@/lib/configuration/types";
import { redirect } from "next/navigation";

function isBlank(value: unknown): boolean {
  return value == null || (typeof value === "string" && value.trim() === "");
}

/**
 * Merge org record settings into the organization section config.
 * Source of truth is config_sections (via getConfigSection).
 * org.settings fills gaps only; empty defaults must not erase saved/settings values.
 * legal_name may fall back to org.name only when both config and settings lack it.
 */
function hydrateOrganizationConfig(
  config: Record<string, unknown>,
  org: { name?: string | null; settings?: unknown } | null
): Record<string, unknown> {
  if (!org) return config;

  const settings =
    org.settings && typeof org.settings === "object" && !Array.isArray(org.settings)
      ? (org.settings as Record<string, unknown>)
      : {};

  const merged: Record<string, unknown> = { ...settings };

  for (const [key, value] of Object.entries(config)) {
    // Keep settings value when section config only has an empty default.
    if (isBlank(value) && !isBlank(settings[key])) continue;
    merged[key] = value;
  }

  if (isBlank(merged.legal_name) && org.name) {
    merged.legal_name = org.name;
  }

  return merged;
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
  } catch (error) {
    console.error("[config] loadConfigPage failed", {
      organizationId,
      sectionKey: sectionKey ?? null,
      error: error instanceof Error ? error.message : error,
    });
    // Prefer an immediate empty state over a Vercel function timeout.
    config = {};
  }

  return { ctx, supabase, organizationId, config };
}
