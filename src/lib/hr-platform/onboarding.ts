import { resolveActorUserId, resolveSchoolContext } from "@/lib/platform/shared/context";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { seedDefaultOnboardingTasks } from "@/lib/hr/automation";
import { recordHcmActivity } from "./activity";
import { transitionEmployeeLifecycle } from "./lifecycle";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

const EXTENDED_TASKS = [
  {
    task_key: "handbook_ack",
    title: "Acknowledge employee handbook",
    category: "policy",
    requires_signature: true,
  },
  {
    task_key: "tech_checklist",
    title: "Complete technology checklist",
    category: "technology",
    requires_signature: false,
  },
  {
    task_key: "background_verify",
    title: "Background verification complete",
    category: "credential",
    requires_signature: false,
  },
  {
    task_key: "payroll_ready",
    title: "Payroll readiness (W-4 / banking)",
    category: "paperwork",
    requires_signature: false,
  },
  {
    task_key: "required_docs",
    title: "Upload required onboarding documents",
    category: "paperwork",
    requires_signature: false,
  },
  {
    task_key: "training_assign",
    title: "Complete assigned onboarding training",
    category: "training",
    requires_signature: false,
  },
] as const;

export async function ensureExtendedOnboardingTasks(
  supabase: AuthClient,
  employeeId: string
): Promise<number> {
  await seedDefaultOnboardingTasks(supabase, employeeId);
  const { data: existing } = await supabase
    .from("hr_onboarding_tasks")
    .select("task_key")
    .eq("employee_id", employeeId);
  const keys = new Set((existing ?? []).map((t) => t.task_key));
  const toInsert = EXTENDED_TASKS.filter((t) => !keys.has(t.task_key)).map((t) => ({
    employee_id: employeeId,
    ...t,
    status: "pending",
  }));
  if (toInsert.length) {
    await supabase.from("hr_onboarding_tasks").insert(toInsert);
  }
  return toInsert.length;
}

export async function completeOnboardingTask(
  supabase: AuthClient,
  taskId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: task } = await supabase
    .from("hr_onboarding_tasks")
    .select("id, employee_id")
    .eq("id", taskId)
    .maybeSingle();
  if (!task) return { ok: false, error: "Task not found" };

  await supabase
    .from("hr_onboarding_tasks")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", taskId);

  const { data: pending } = await supabase
    .from("hr_onboarding_tasks")
    .select("id")
    .eq("employee_id", task.employee_id)
    .in("status", ["pending", "in_progress"]);

  if (!(pending ?? []).length) {
    await transitionEmployeeLifecycle(supabase, {
      employeeId: task.employee_id,
      toState: "active",
      title: "Onboarding completed",
    });

    const { data: emp } = await supabase
      .from("employees")
      .select("school_id")
      .eq("id", task.employee_id)
      .maybeSingle();
    const schoolCtx = emp?.school_id
      ? await resolveSchoolContext(supabase, emp.school_id)
      : null;
    await recordHcmActivity(supabase, {
      eventType: "employee.onboarding.completed",
      title: "Onboarding completed",
      entityId: task.employee_id,
      organizationId: schoolCtx?.organizationId,
      schoolId: emp?.school_id,
      actorUserId: await resolveActorUserId(supabase),
    });
  }

  return { ok: true };
}

export async function listOnboardingTasks(
  supabase: AuthClient,
  employeeId: string
) {
  const { data } = await supabase
    .from("hr_onboarding_tasks")
    .select("*")
    .eq("employee_id", employeeId)
    .order("created_at");
  return data ?? [];
}
