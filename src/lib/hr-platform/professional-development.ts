import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type PdResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createPdCourse(
  supabase: AuthClient,
  input: {
    title: string;
    schoolId?: string | null;
    description?: string;
    ceuCredits?: number;
    courseType?: string;
    deliveryMode?: string;
    isRequired?: boolean;
  }
): Promise<PdResult> {
  const { data, error } = await supabase
    .from("pd_courses")
    .insert({
      school_id: input.schoolId ?? null,
      title: input.title,
      description: input.description ?? null,
      ceu_credits: input.ceuCredits ?? 0,
      course_type: input.courseType ?? "course",
      delivery_mode: input.deliveryMode ?? "online",
      is_required: input.isRequired ?? false,
      is_active: true,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Failed" };
  return { ok: true, id: data.id };
}

export async function assignTraining(
  supabase: AuthClient,
  input: {
    employeeId: string;
    courseId?: string | null;
    courseTitle: string;
    ceuEarned?: number;
  }
): Promise<PdResult> {
  const { data, error } = await supabase
    .from("employee_training_records")
    .insert({
      employee_id: input.employeeId,
      course_id: input.courseId ?? null,
      course_title: input.courseTitle,
      ceu_earned: input.ceuEarned ?? 0,
      status: "assigned",
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Failed" };
  return { ok: true, id: data.id };
}

export async function completeTraining(
  supabase: AuthClient,
  trainingId: string,
  input?: { ceuEarned?: number; certificatePath?: string }
): Promise<PdResult> {
  const { error } = await supabase
    .from("employee_training_records")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      ceu_earned: input?.ceuEarned,
      certificate_path: input?.certificatePath ?? null,
    })
    .eq("id", trainingId);
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: trainingId };
}
