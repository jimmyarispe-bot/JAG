import { cache } from "react";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { createAuthClient as getAuthClient } from "@/lib/supabase/server-auth";
import type { ConfigSectionKey } from "@/lib/configuration/types";
import { SECTION_DEFAULTS } from "@/lib/configuration/types";
import { recordConfigVersion } from "@/lib/configuration/versioning";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

function orgLevelQuery(
  supabase: AuthClient,
  organizationId: string,
  sectionKey: ConfigSectionKey,
  schoolId?: string | null
) {
  let query = supabase
    .from("config_sections")
    .select("id, config_data, schema_version, updated_at")
    .eq("organization_id", organizationId)
    .eq("section_key", sectionKey);

  if (schoolId) query = query.eq("school_id", schoolId);
  else query = query.is("school_id", null);

  // NULL school_id upserts can create duplicates under a standard UNIQUE constraint.
  // Always prefer the newest row when multiples exist.
  return query.order("updated_at", { ascending: false });
}

const getConfigSectionCached = cache(
  async (
    organizationId: string,
    sectionKey: ConfigSectionKey,
    schoolIdKey: string
  ): Promise<Record<string, unknown>> => {
    const supabase = await getAuthClient();
    const schoolId = schoolIdKey || null;
    const { data, error } = await orgLevelQuery(
      supabase,
      organizationId,
      sectionKey,
      schoolId
    )
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[config] getConfigSection read error", {
        organizationId,
        sectionKey,
        schoolId,
        error: error.message,
      });
    }

    const stored = (data?.config_data as Record<string, unknown> | null) ?? {};
    const defaults = SECTION_DEFAULTS[sectionKey] ?? {};
    return { ...defaults, ...stored };
  }
);

/** Config section read — once per request per (org, section, school) (Sprint P002). */
export async function getConfigSection(
  _supabase: AuthClient | undefined,
  organizationId: string,
  sectionKey: ConfigSectionKey,
  schoolId?: string | null
): Promise<Record<string, unknown>> {
  return getConfigSectionCached(organizationId, sectionKey, schoolId ?? "");
}

/**
 * Resolve the row to update for a section. Upsert on (organization_id, school_id, section_key)
 * does not match when school_id is NULL (PostgreSQL UNIQUE treats NULLs as distinct).
 */
async function resolveConfigSectionRow(
  supabase: AuthClient,
  organizationId: string,
  sectionKey: ConfigSectionKey,
  schoolId?: string | null
): Promise<{ id: string; schema_version: number } | null> {
  const { data: rows, error } = await orgLevelQuery(supabase, organizationId, sectionKey, schoolId);

  if (error) {
    console.error("[config] resolveConfigSectionRow error", {
      organizationId,
      sectionKey,
      schoolId: schoolId ?? null,
      error: error.message,
    });
    return null;
  }

  if (!rows?.length) return null;

  const [primary, ...duplicates] = rows;
  if (duplicates.length > 0) {
    const duplicateIds = duplicates.map((row) => row.id);
    await supabase.from("config_sections").delete().in("id", duplicateIds);
  }

  return { id: primary.id, schema_version: primary.schema_version ?? 0 };
}

export async function saveConfigSection(
  supabase: AuthClient,
  input: {
    organizationId: string;
    sectionKey: ConfigSectionKey;
    configData: Record<string, unknown>;
    schoolId?: string | null;
    userId?: string;
    requiresApproval?: boolean;
    changeSummary?: string;
  }
) {
  const previous = await getConfigSection(supabase, input.organizationId, input.sectionKey, input.schoolId);
  const existing = await resolveConfigSectionRow(
    supabase,
    input.organizationId,
    input.sectionKey,
    input.schoolId
  );

  const patch = {
    config_data: input.configData,
    updated_by: input.userId ?? null,
    requires_approval: input.requiresApproval ?? false,
    approval_status: input.requiresApproval ? "pending_approval" : "approved",
  };

  let data: { id: string; schema_version: number } | null = null;
  let error: { message: string } | null = null;

  if (existing) {
    const result = await supabase
      .from("config_sections")
      .update(patch)
      .eq("id", existing.id)
      .select("id, schema_version")
      .single();
    data = result.data;
    error = result.error;
  } else {
    const result = await supabase
      .from("config_sections")
      .insert({
        organization_id: input.organizationId,
        school_id: input.schoolId ?? null,
        section_key: input.sectionKey,
        ...patch,
      })
      .select("id, schema_version")
      .single();
    data = result.data;
    error = result.error;
  }

  if (error || !data) return { error: error?.message ?? "Failed to save configuration section." };

  const nextVersion = (data.schema_version ?? existing?.schema_version ?? 0) + 1;

  await recordConfigVersion(supabase, {
    organizationId: input.organizationId,
    schoolId: input.schoolId,
    sectionKey: input.sectionKey,
    configSectionId: data.id,
    previousValues: previous,
    newValues: input.configData,
    changedBy: input.userId,
    changeSummary: input.changeSummary ?? `Updated ${input.sectionKey} configuration`,
    versionNumber: nextVersion,
  });

  await supabase
    .from("config_sections")
    .update({ schema_version: nextVersion })
    .eq("id", data.id);

  return { success: true, id: data.id };
}

export async function listConfigSections(supabase: AuthClient, organizationId: string) {
  const { data } = await supabase
    .from("config_sections")
    .select("section_key, school_id, updated_at, approval_status")
    .eq("organization_id", organizationId)
    .order("section_key");

  return data ?? [];
}
