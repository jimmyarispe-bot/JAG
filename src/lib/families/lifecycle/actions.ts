"use server";

import { revalidatePath } from "next/cache";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { requireFamilyEditAccess, requireFamilyLifecycleAccess } from "@/lib/families/access";
import { archiveFamily, deleteFamily, getFamilyDependencyReport, restoreFamily } from "./service";
import { mergeFamilies } from "@/lib/families/merge";
import { splitFamily } from "@/lib/families/split";
import { moveStudentToFamily } from "@/lib/families/relationships";
import { getFamilyById } from "@/lib/families/queries";

function revalidateFamilyPaths(familyId?: string) {
  revalidatePath("/dashboard/families");
  revalidatePath("/dashboard/students");
  if (familyId) revalidatePath(`/dashboard/families/${familyId}`);
}

export async function archiveFamilyAction(input: { familyId: string; reason?: string | null }) {
  const access = await requireFamilyLifecycleAccess();
  if (!access.ok) return { ok: false as const, error: access.error, code: "forbidden" as const };
  const supabase = await createAuthClient();
  const result = await archiveFamily(supabase, input);
  if (result.ok) revalidateFamilyPaths(input.familyId);
  return result;
}

export async function restoreFamilyAction(input: { familyId: string }) {
  const access = await requireFamilyLifecycleAccess();
  if (!access.ok) return { ok: false as const, error: access.error, code: "forbidden" as const };
  const supabase = await createAuthClient();
  const result = await restoreFamily(supabase, input);
  if (result.ok) revalidateFamilyPaths(input.familyId);
  return result;
}

export async function deleteFamilyAction(input: {
  familyId: string;
  confirmationText: string;
  acknowledged: boolean;
}) {
  const access = await requireFamilyLifecycleAccess();
  if (!access.ok) return { ok: false as const, error: access.error, code: "forbidden" as const };
  const supabase = await createAuthClient();
  const result = await deleteFamily(supabase, input);
  if (result.ok) {
    revalidatePath("/dashboard/families");
    revalidatePath("/dashboard/students");
  }
  return result;
}

export async function getFamilyDeleteContextAction(familyId: string) {
  const access = await requireFamilyLifecycleAccess();
  if (!access.ok) return { ok: false as const, error: access.error };
  const supabase = await createAuthClient();
  const family = await getFamilyById(familyId);
  if (!family) return { ok: false as const, error: "Family not found" };
  const dependencies = await getFamilyDependencyReport(supabase, familyId);
  return {
    ok: true as const,
    family: {
      id: family.id,
      name: family.family_name,
      status: family.status,
      schoolName: Array.isArray(family.schools)
        ? family.schools[0]?.name ?? null
        : (family.schools as { name?: string } | null)?.name ?? null,
    },
    dependencies,
  };
}

export async function mergeFamiliesAction(input: {
  sourceFamilyId: string;
  targetFamilyId: string;
  reason?: string | null;
}) {
  const access = await requireFamilyLifecycleAccess();
  if (!access.ok) return { ok: false as const, error: access.error };
  const supabase = await createAuthClient();
  const result = await mergeFamilies(supabase, input);
  if (result.ok) {
    revalidateFamilyPaths(result.targetFamilyId);
    revalidateFamilyPaths(result.sourceFamilyId);
  }
  return result;
}

export async function splitFamilyAction(input: {
  sourceFamilyId: string;
  studentIds: string[];
  newFamilyName: string;
  moveGuardianIds?: string[];
  reason?: string | null;
}) {
  const access = await requireFamilyLifecycleAccess();
  if (!access.ok) return { ok: false as const, error: access.error };
  const supabase = await createAuthClient();
  const result = await splitFamily(supabase, input);
  if (result.ok) {
    revalidateFamilyPaths(result.sourceFamilyId);
    revalidateFamilyPaths(result.newFamilyId);
  }
  return result;
}

export async function moveStudentToFamilyAction(input: {
  studentId: string;
  familyId: string;
  reason?: string | null;
}) {
  const access = await requireFamilyEditAccess();
  if (!access.ok) return { ok: false as const, error: access.error };
  const supabase = await createAuthClient();
  const result = await moveStudentToFamily(supabase, input);
  if (result.ok) {
    revalidatePath(`/dashboard/students/${input.studentId}`);
    revalidateFamilyPaths(input.familyId);
  }
  return result;
}
