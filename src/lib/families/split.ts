import { recordActivity } from "@/lib/platform/activity";
import { resolveActorUserId, resolveSchoolContext } from "@/lib/platform/shared/context";
import { syncStudentPlatformRelationships } from "@/lib/students/platform-sync";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type SplitFamilyResult =
  | { ok: true; sourceFamilyId: string; newFamilyId: string; movedStudentIds: string[] }
  | { ok: false; error: string };

/**
 * Move selected students into a new household.
 * Billing remains on the source family unless empty.
 */
export async function splitFamily(
  supabase: AuthClient,
  input: {
    sourceFamilyId: string;
    studentIds: string[];
    newFamilyName: string;
    moveGuardianIds?: string[];
    reason?: string | null;
  }
): Promise<SplitFamilyResult> {
  const studentIds = [...new Set(input.studentIds.filter(Boolean))];
  if (!studentIds.length) return { ok: false, error: "Select at least one student to move." };
  const name = input.newFamilyName.trim();
  if (!name) return { ok: false, error: "New family name is required." };

  const { data: source } = await supabase
    .from("families")
    .select("id, school_id, family_name, status")
    .eq("id", input.sourceFamilyId)
    .maybeSingle();
  if (!source) return { ok: false, error: "Source family not found." };

  const { data: students } = await supabase
    .from("students")
    .select("id, family_id, last_name")
    .in("id", studentIds);

  if (!students?.length || students.some((s) => s.family_id !== source.id)) {
    return { ok: false, error: "All selected students must belong to the source family." };
  }

  // Keep at least one student on source when possible — allowed to move all
  const { data: created, error: createError } = await supabase
    .from("families")
    .insert({
      school_id: source.school_id,
      family_name: name,
      status: "active",
    })
    .select("id")
    .single();

  if (createError || !created) {
    return { ok: false, error: createError?.message ?? "Unable to create new family." };
  }

  const { error: moveError } = await supabase
    .from("students")
    .update({ family_id: created.id })
    .in("id", studentIds);
  if (moveError) {
    await supabase.from("families").delete().eq("id", created.id);
    return { ok: false, error: moveError.message };
  }

  const moveGuardianIds = input.moveGuardianIds ?? [];
  if (moveGuardianIds.length) {
    await supabase
      .from("guardians")
      .update({ family_id: created.id })
      .in("id", moveGuardianIds)
      .eq("family_id", source.id);
  }

  for (const studentId of studentIds) {
    try {
      await syncStudentPlatformRelationships(supabase, studentId);
    } catch {
      // best-effort
    }
  }

  const actorUserId = await resolveActorUserId(supabase);
  const schoolCtx = await resolveSchoolContext(supabase, source.school_id);

  try {
    await recordActivity(supabase, {
      eventType: "family.split",
      moduleKey: "sis",
      entityType: "family",
      entityId: created.id,
      title: "Family split",
      summary: `${source.family_name} → ${name}`,
      organizationId: schoolCtx?.organizationId,
      schoolId: source.school_id,
      familyId: created.id,
      actorUserId,
      sourceTable: "families",
      sourceId: created.id,
      payload: {
        sourceFamilyId: source.id,
        newFamilyId: created.id,
        movedStudentIds: studentIds,
        movedGuardianIds: moveGuardianIds,
        reason: input.reason ?? null,
      },
    });
    await recordActivity(supabase, {
      eventType: "family.updated",
      moduleKey: "sis",
      entityType: "family",
      entityId: source.id,
      title: "Family split (source)",
      summary: `Students moved to ${name}`,
      organizationId: schoolCtx?.organizationId,
      schoolId: source.school_id,
      familyId: source.id,
      actorUserId,
      sourceTable: "families",
      sourceId: source.id,
      payload: { newFamilyId: created.id, movedStudentIds: studentIds },
    });
  } catch {
    // best-effort
  }

  return {
    ok: true,
    sourceFamilyId: source.id,
    newFamilyId: created.id,
    movedStudentIds: studentIds,
  };
}
