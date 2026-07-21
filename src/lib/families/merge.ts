import { recordActivity } from "@/lib/platform/activity";
import { resolveActorUserId, resolveSchoolContext } from "@/lib/platform/shared/context";
import { syncStudentPlatformRelationships } from "@/lib/students/platform-sync";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type MergeFamiliesResult =
  | { ok: true; targetFamilyId: string; sourceFamilyId: string; movedStudents: number; movedGuardians: number }
  | { ok: false; error: string };

/**
 * Merge source family into target family.
 * Moves students, guardians, households; archives source; preserves history via audit.
 */
export async function mergeFamilies(
  supabase: AuthClient,
  input: { sourceFamilyId: string; targetFamilyId: string; reason?: string | null }
): Promise<MergeFamiliesResult> {
  if (input.sourceFamilyId === input.targetFamilyId) {
    return { ok: false, error: "Source and target family must be different." };
  }

  const { data: families } = await supabase
    .from("families")
    .select("id, school_id, family_name, status")
    .in("id", [input.sourceFamilyId, input.targetFamilyId]);

  const source = families?.find((f) => f.id === input.sourceFamilyId);
  const target = families?.find((f) => f.id === input.targetFamilyId);
  if (!source || !target) return { ok: false, error: "One or both families were not found." };
  if (source.school_id !== target.school_id) {
    return { ok: false, error: "Families must belong to the same school to merge." };
  }

  const { data: students } = await supabase
    .from("students")
    .select("id")
    .eq("family_id", source.id);
  const studentIds = (students ?? []).map((s) => s.id);

  if (studentIds.length) {
    const { error } = await supabase
      .from("students")
      .update({ family_id: target.id })
      .eq("family_id", source.id);
    if (error) return { ok: false, error: error.message };
  }

  const { data: guardians } = await supabase
    .from("guardians")
    .select("id, email, is_primary")
    .eq("family_id", source.id);

  // Demote primary on source if target already has a primary
  const { data: targetPrimary } = await supabase
    .from("guardians")
    .select("id")
    .eq("family_id", target.id)
    .eq("is_primary", true)
    .maybeSingle();

  let movedGuardians = 0;
  for (const g of guardians ?? []) {
    const patch: Record<string, unknown> = { family_id: target.id };
    if (targetPrimary && g.is_primary) patch.is_primary = false;
    const { error } = await supabase.from("guardians").update(patch).eq("id", g.id);
    if (!error) movedGuardians += 1;
  }

  await supabase
    .from("family_households")
    .update({ family_id: target.id })
    .eq("family_id", source.id);

  // Re-point billing account if source has one and target lacks one
  const [{ data: sourceBilling }, { data: targetBilling }] = await Promise.all([
    supabase.from("family_billing_accounts").select("id").eq("family_id", source.id).maybeSingle(),
    supabase.from("family_billing_accounts").select("id").eq("family_id", target.id).maybeSingle(),
  ]);
  if (sourceBilling && !targetBilling) {
    await supabase
      .from("family_billing_accounts")
      .update({ family_id: target.id })
      .eq("id", sourceBilling.id);
  }

  // Soft-archive source (keep history)
  const actorUserId = await resolveActorUserId(supabase);
  await supabase
    .from("families")
    .update({
      status: "archived",
      previous_status: source.status,
      archived_at: new Date().toISOString(),
      archived_by: actorUserId,
      notes: `Merged into ${target.family_name} (${target.id})`,
    })
    .eq("id", source.id);

  for (const studentId of studentIds) {
    try {
      await syncStudentPlatformRelationships(supabase, studentId);
    } catch {
      // best-effort
    }
  }

  const schoolCtx = await resolveSchoolContext(supabase, target.school_id);
  try {
    await recordActivity(supabase, {
      eventType: "family.merged",
      moduleKey: "sis",
      entityType: "family",
      entityId: target.id,
      title: "Families merged",
      summary: `${source.family_name} → ${target.family_name}`,
      organizationId: schoolCtx?.organizationId,
      schoolId: target.school_id,
      familyId: target.id,
      actorUserId,
      sourceTable: "families",
      sourceId: target.id,
      payload: {
        sourceFamilyId: source.id,
        targetFamilyId: target.id,
        movedStudents: studentIds.length,
        movedGuardians,
        reason: input.reason ?? null,
      },
    });
  } catch {
    // best-effort
  }

  return {
    ok: true,
    targetFamilyId: target.id,
    sourceFamilyId: source.id,
    movedStudents: studentIds.length,
    movedGuardians,
  };
}
