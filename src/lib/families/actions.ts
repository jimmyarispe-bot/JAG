"use server";

import { revalidatePath } from "next/cache";
import { recordActivity } from "@/lib/platform/activity";
import { assertAnyPermission } from "@/lib/platform/identity/action-guards";
import { resolveActorUserId, resolveSchoolContext } from "@/lib/platform/shared/context";
import {
  deriveFamilyName,
  type FamilyGuardianInput,
} from "@/lib/constants/guardians";
import { syncGuardianStudentRelationships, syncStudentPlatformRelationships } from "@/lib/students/platform-sync";
import { inviteParentPortalGuardians } from "@/lib/families/portal-invite";

async function requireFamilyManage() {
  return assertAnyPermission("families.manage", "students.edit");
}

export type CreateFamilyWithGuardiansResult =
  | { familyId: string; guardianIds: string[]; studentId?: string | null }
  | { error: string };

function parseGuardianPayload(formData: FormData, prefix: string, defaults?: Partial<FamilyGuardianInput>) {
  const first = String(formData.get(`${prefix}_first_name`) ?? "").trim();
  const last = String(formData.get(`${prefix}_last_name`) ?? "").trim();
  if (!first || !last) return null;
  return {
    first_name: first,
    last_name: last,
    relationship: String(formData.get(`${prefix}_relationship`) ?? defaults?.relationship ?? "guardian").trim(),
    email: String(formData.get(`${prefix}_email`) ?? "").trim() || null,
    phone: String(formData.get(`${prefix}_phone`) ?? "").trim() || null,
    preferred_contact_method:
      String(formData.get(`${prefix}_preferred_contact_method`) ?? "").trim() || null,
    is_primary: defaults?.is_primary ?? false,
    is_emergency_contact: defaults?.is_emergency_contact ?? false,
  } satisfies FamilyGuardianInput;
}

/** Atomic family + guardians (+ optional student link) via DB RPC. */
export async function createFamilyWithGuardians(
  formData: FormData
): Promise<CreateFamilyWithGuardiansResult> {
  const auth = await requireFamilyManage();
  if ("error" in auth) return { error: auth.error };
  const supabase = auth.supabase;

  const schoolId = String(formData.get("school_id") ?? "").trim();
  const studentId = String(formData.get("student_id") ?? "").trim() || null;
  const studentLastName = String(formData.get("student_last_name") ?? "").trim() || null;
  const sendPortalInvites = formData.get("send_portal_invites") === "true";

  const primary = parseGuardianPayload(formData, "primary", {
    is_primary: true,
    relationship: "guardian",
  });
  if (!primary) return { error: "Primary guardian first and last name are required." };

  const guardians: FamilyGuardianInput[] = [primary];

  if (formData.get("include_second_guardian") === "true") {
    const second = parseGuardianPayload(formData, "second", { is_primary: false });
    if (second) guardians.push(second);
  }

  if (formData.get("include_emergency_contact") === "true") {
    const emergency = parseGuardianPayload(formData, "emergency", {
      is_primary: false,
      is_emergency_contact: true,
      relationship: "emergency",
    });
    if (emergency) guardians.push(emergency);
  }

  const familyName =
    String(formData.get("family_name") ?? "").trim() ||
    deriveFamilyName(primary.last_name, studentLastName);

  const { data, error } = await supabase.rpc("create_family_with_guardians", {
    p_school_id: schoolId,
    p_family_name: familyName,
    p_guardians: guardians,
    p_student_id: studentId,
    p_billing_email: primary.email,
    p_billing_phone: primary.phone,
  });

  if (error || !data) {
    return { error: error?.message ?? "Unable to create family." };
  }

  const payload = data as { family_id?: string; guardian_ids?: string[]; student_id?: string | null };
  const familyId = payload.family_id;
  const guardianIds = Array.isArray(payload.guardian_ids) ? payload.guardian_ids.map(String) : [];
  if (!familyId) return { error: "Family create returned no id." };

  const actorUserId = await resolveActorUserId(supabase);
  const schoolCtx = await resolveSchoolContext(supabase, schoolId);

  try {
    await recordActivity(supabase, {
      eventType: "family.created",
      moduleKey: "sis",
      entityType: "family",
      entityId: familyId,
      title: "Family created",
      summary: familyName,
      organizationId: schoolCtx?.organizationId,
      schoolId,
      familyId,
      studentId: studentId ?? undefined,
      actorUserId,
      sourceTable: "families",
      sourceId: familyId,
    });
  } catch {
    // best-effort
  }

  if (studentId) {
    try {
      await syncStudentPlatformRelationships(supabase, studentId);
      for (const guardianId of guardianIds) {
        await syncGuardianStudentRelationships(supabase, guardianId, familyId);
      }
    } catch {
      // best-effort
    }
  }

  if (sendPortalInvites && schoolCtx?.organizationId) {
    try {
      await inviteParentPortalGuardians({
        organizationId: schoolCtx.organizationId,
        schoolId,
        guardians: guardians.filter((g) => g.email),
      });
    } catch {
      // optional — do not fail family create
    }
  }

  revalidatePath("/dashboard/students");
  if (studentId) revalidatePath(`/dashboard/students/${studentId}`);
  revalidatePath(`/dashboard/families/${familyId}`);

  return { familyId, guardianIds, studentId };
}

/** Link an existing student to an existing family (atomic RPC). */
export async function linkStudentToFamily(formData: FormData) {
  const auth = await requireFamilyManage();
  if ("error" in auth) return { error: auth.error };
  const supabase = auth.supabase;

  const studentId = String(formData.get("student_id") ?? "").trim();
  const familyId = String(formData.get("family_id") ?? "").trim();
  if (!studentId || !familyId) return { error: "Student and family are required." };

  const { data, error } = await supabase.rpc("link_student_to_family", {
    p_student_id: studentId,
    p_family_id: familyId,
  });

  if (error || !data) {
    return { error: error?.message ?? "Unable to link student to family." };
  }

  try {
    await syncStudentPlatformRelationships(supabase, studentId);
    const { data: guardians } = await supabase
      .from("guardians")
      .select("id")
      .eq("family_id", familyId);
    for (const g of guardians ?? []) {
      await syncGuardianStudentRelationships(supabase, g.id, familyId);
    }
  } catch {
    // best-effort
  }

  revalidatePath("/dashboard/students");
  revalidatePath(`/dashboard/students/${studentId}`);
  revalidatePath(`/dashboard/families/${familyId}`);
  return { studentId, familyId };
}
