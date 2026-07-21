import { resolveActorUserId, resolveSchoolContext } from "@/lib/platform/shared/context";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { recordHcmActivity } from "./activity";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type PerformanceResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createPerformanceReview(
  supabase: AuthClient,
  input: {
    employeeId: string;
    schoolId: string;
    evaluationType?: string;
    periodStart?: string;
    periodEnd?: string;
    summary?: string;
  }
): Promise<PerformanceResult> {
  const actorUserId = await resolveActorUserId(supabase);
  const { data, error } = await supabase
    .from("performance_evaluations")
    .insert({
      employee_id: input.employeeId,
      school_id: input.schoolId,
      evaluation_type: input.evaluationType ?? "annual",
      evaluation_period_start: input.periodStart ?? null,
      evaluation_period_end: input.periodEnd ?? null,
      summary: input.summary ?? null,
      status: "draft",
      evaluator_user_id: actorUserId,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Failed" };
  return { ok: true, id: data.id };
}

export async function completePerformanceReview(
  supabase: AuthClient,
  evaluationId: string,
  input?: { overallRating?: string; summary?: string; coachingNotes?: string }
): Promise<PerformanceResult> {
  const { data: evalRow } = await supabase
    .from("performance_evaluations")
    .select("id, employee_id, school_id")
    .eq("id", evaluationId)
    .maybeSingle();
  if (!evalRow) return { ok: false, error: "Review not found" };

  await supabase
    .from("performance_evaluations")
    .update({
      status: "completed",
      overall_rating: input?.overallRating ?? null,
      summary: input?.summary ?? null,
      coaching_notes: input?.coachingNotes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", evaluationId);

  if (input?.overallRating) {
    await supabase
      .from("employees")
      .update({ performance_rating: input.overallRating })
      .eq("id", evalRow.employee_id);
  }

  const schoolCtx = await resolveSchoolContext(supabase, evalRow.school_id);
  await recordHcmActivity(supabase, {
    eventType: "employee.review.completed",
    title: "Performance review completed",
    entityId: evalRow.employee_id,
    organizationId: schoolCtx?.organizationId,
    schoolId: evalRow.school_id,
    actorUserId: await resolveActorUserId(supabase),
    sourceTable: "performance_evaluations",
    sourceId: evaluationId,
  });

  return { ok: true, id: evaluationId };
}

export async function createPerformanceGoal(
  supabase: AuthClient,
  input: {
    employeeId: string;
    title: string;
    description?: string;
    targetDate?: string;
    evaluationId?: string | null;
  }
): Promise<PerformanceResult> {
  const { data, error } = await supabase
    .from("performance_goals")
    .insert({
      employee_id: input.employeeId,
      evaluation_id: input.evaluationId ?? null,
      title: input.title,
      description: input.description ?? null,
      target_date: input.targetDate ?? null,
      status: "active",
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Failed" };
  return { ok: true, id: data.id };
}

export async function addPerformanceNote(
  supabase: AuthClient,
  input: {
    employeeId: string;
    schoolId?: string | null;
    noteType?: "note" | "recognition" | "observation" | "improvement_plan";
    title: string;
    body?: string;
  }
): Promise<PerformanceResult> {
  const { data, error } = await supabase
    .from("hr_performance_notes")
    .insert({
      employee_id: input.employeeId,
      school_id: input.schoolId ?? null,
      note_type: input.noteType ?? "note",
      title: input.title,
      body: input.body ?? "",
      created_by: await resolveActorUserId(supabase),
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Failed" };
  return { ok: true, id: data.id };
}
