"use server";

import { revalidatePath } from "next/cache";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { resolvePrimarySchoolId } from "@/lib/platform/identity/school-access";
import {
  generateSchoolLoopGapReport,
  generateStudentLoopGapReport,
} from "@/lib/platform/operational-loop/diagnostics";
import { retryFailedLoopTransition } from "@/lib/platform/operational-loop/recovery";

export async function retryLoopTransitionAction(formData: FormData): Promise<void> {
  const supabase = await createAuthClient();
  const ctx = await getIdentityContext();
  if (!ctx?.permissions.includes("executive.view") && !ctx?.permissions.includes("scheduling.executive")) {
    return;
  }

  const auditEntryId = formData.get("audit_entry_id") as string;
  if (!auditEntryId) return;

  await retryFailedLoopTransition(supabase, {
    auditEntryId,
    actorUserId: ctx.effectiveUserId,
  });

  revalidatePath("/dashboard/executive");
}

export async function refreshLoopGapReportAction(formData: FormData) {
  const supabase = await createAuthClient();
  const ctx = await getIdentityContext();
  if (!ctx?.permissions.includes("executive.view")) {
    return { error: "Permission denied" };
  }

  const schoolId =
    resolvePrimarySchoolId(ctx, formData.get("school_id") as string | undefined) ??
    ctx.orgAssignments[0]?.school_id;
  if (!schoolId) return { error: "School required" };

  const gaps = await generateSchoolLoopGapReport(supabase, schoolId, 50);
  revalidatePath("/dashboard/executive");
  return { success: true, gapCount: gaps.length, gaps };
}

export async function getStudentLoopGapAction(studentId: string) {
  const supabase = await createAuthClient();
  const ctx = await getIdentityContext();
  if (!ctx?.permissions.includes("students.view") && !ctx?.permissions.includes("executive.view")) {
    return { error: "Permission denied" };
  }
  const report = await generateStudentLoopGapReport(supabase, studentId);
  return report ?? { error: "Student not found" };
}
