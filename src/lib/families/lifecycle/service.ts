import { recordActivity } from "@/lib/platform/activity";
import { resolveActorUserId, resolveSchoolContext } from "@/lib/platform/shared/context";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { inspectFamilyDependencies, type FamilyDependencyReport } from "./dependencies";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type FamilyLifecycleResult =
  | { ok: true; familyId: string; message: string }
  | {
      ok: false;
      error: string;
      code?:
        | "forbidden"
        | "not_found"
        | "has_dependencies"
        | "confirmation_required"
        | "already_archived"
        | "not_archived"
        | "failed";
      dependencies?: FamilyDependencyReport;
      suggestArchive?: boolean;
    };

interface FamilyRow {
  id: string;
  school_id: string;
  family_name: string;
  status: string;
  previous_status: string | null;
}

async function loadFamily(supabase: AuthClient, familyId: string): Promise<FamilyRow | null> {
  const { data } = await supabase
    .from("families")
    .select("id, school_id, family_name, status, previous_status")
    .eq("id", familyId)
    .maybeSingle();
  return (data as FamilyRow | null) ?? null;
}

export async function archiveFamily(
  supabase: AuthClient,
  input: { familyId: string; reason?: string | null }
): Promise<FamilyLifecycleResult> {
  const family = await loadFamily(supabase, input.familyId);
  if (!family) return { ok: false, error: "Family not found", code: "not_found" };
  if (family.status === "archived") {
    return { ok: false, error: "Family is already archived", code: "already_archived" };
  }

  const actorUserId = await resolveActorUserId(supabase);
  const previousStatus = family.status !== "archived" ? family.status : "active";

  const { error } = await supabase
    .from("families")
    .update({
      previous_status: previousStatus,
      status: "archived",
      archived_at: new Date().toISOString(),
      archived_by: actorUserId,
    })
    .eq("id", family.id);

  if (error) return { ok: false, error: error.message, code: "failed" };

  const schoolCtx = await resolveSchoolContext(supabase, family.school_id);
  try {
    await recordActivity(supabase, {
      eventType: "family.archived",
      moduleKey: "sis",
      entityType: "family",
      entityId: family.id,
      title: "Family archived",
      summary: family.family_name,
      organizationId: schoolCtx?.organizationId,
      schoolId: family.school_id,
      familyId: family.id,
      actorUserId,
      sourceTable: "families",
      sourceId: family.id,
      payload: { reason: input.reason ?? null, previousStatus },
    });
  } catch {
    // best-effort
  }

  return { ok: true, familyId: family.id, message: "Family archived." };
}

export async function restoreFamily(
  supabase: AuthClient,
  input: { familyId: string }
): Promise<FamilyLifecycleResult> {
  const family = await loadFamily(supabase, input.familyId);
  if (!family) return { ok: false, error: "Family not found", code: "not_found" };
  if (family.status !== "archived") {
    return { ok: false, error: "Family is not archived", code: "not_archived" };
  }

  const actorUserId = await resolveActorUserId(supabase);
  const restoredStatus = family.previous_status?.trim() || "active";

  const { error } = await supabase
    .from("families")
    .update({
      status: restoredStatus,
      previous_status: null,
      archived_at: null,
      archived_by: null,
    })
    .eq("id", family.id);

  if (error) return { ok: false, error: error.message, code: "failed" };

  const schoolCtx = await resolveSchoolContext(supabase, family.school_id);
  try {
    await recordActivity(supabase, {
      eventType: "family.restored",
      moduleKey: "sis",
      entityType: "family",
      entityId: family.id,
      title: "Family restored",
      summary: family.family_name,
      organizationId: schoolCtx?.organizationId,
      schoolId: family.school_id,
      familyId: family.id,
      actorUserId,
      sourceTable: "families",
      sourceId: family.id,
      payload: { restoredStatus },
    });
  } catch {
    // best-effort
  }

  return { ok: true, familyId: family.id, message: "Family restored." };
}

export async function deleteFamily(
  supabase: AuthClient,
  input: { familyId: string; confirmationText: string; acknowledged: boolean }
): Promise<FamilyLifecycleResult> {
  if (!input.acknowledged || input.confirmationText !== "DELETE") {
    return {
      ok: false,
      error: "Confirmation required. Check the box and type DELETE to continue.",
      code: "confirmation_required",
    };
  }

  const family = await loadFamily(supabase, input.familyId);
  if (!family) return { ok: false, error: "Family not found", code: "not_found" };

  const dependencies = await inspectFamilyDependencies(supabase, family.id);
  if (!dependencies.canDelete) {
    return {
      ok: false,
      error:
        "This family has related records. Permanent deletion is unavailable. Archive the family instead.",
      code: "has_dependencies",
      dependencies,
      suggestArchive: true,
    };
  }

  const actorUserId = await resolveActorUserId(supabase);
  const schoolCtx = await resolveSchoolContext(supabase, family.school_id);

  try {
    await recordActivity(supabase, {
      eventType: "family.deleted",
      moduleKey: "sis",
      entityType: "family",
      entityId: family.id,
      title: "Family permanently deleted",
      summary: family.family_name,
      organizationId: schoolCtx?.organizationId,
      schoolId: family.school_id,
      familyId: family.id,
      actorUserId,
      sourceTable: "families",
      sourceId: family.id,
      payload: { confirmed: true, dependenciesChecked: true },
    });
  } catch {
    // best-effort
  }

  // Remove empty guardians first
  await supabase.from("guardians").delete().eq("family_id", family.id);
  await supabase.from("family_households").delete().eq("family_id", family.id);

  const { error } = await supabase.from("families").delete().eq("id", family.id);
  if (error) return { ok: false, error: error.message, code: "failed" };

  return { ok: true, familyId: family.id, message: "Family deleted successfully." };
}

export async function getFamilyDependencyReport(supabase: AuthClient, familyId: string) {
  return inspectFamilyDependencies(supabase, familyId);
}
