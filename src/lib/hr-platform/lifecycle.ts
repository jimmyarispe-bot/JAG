import { resolveActorUserId, resolveSchoolContext } from "@/lib/platform/shared/context";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { recordHcmActivity } from "./activity";
import {
  LIFECYCLE_TRANSITIONS,
  type EmployeeLifecycleState,
  type TransitionLifecycleInput,
} from "./types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type LifecycleResult =
  | { ok: true; employeeId: string; fromState: string; toState: EmployeeLifecycleState }
  | { ok: false; error: string; code?: string };

function toDbStatus(state: EmployeeLifecycleState): string {
  if (state === "leave_of_absence") return "on_leave";
  if (state === "hired" || state === "onboarding") return "active";
  if (
    state === "applicant" ||
    state === "interviewing" ||
    state === "offer_extended"
  ) {
    return "inactive";
  }
  return state;
}

function normalizeFromStatus(status: string, stage: string | null): EmployeeLifecycleState {
  if (stage && stage in LIFECYCLE_TRANSITIONS) {
    return stage as EmployeeLifecycleState;
  }
  if (status === "on_leave") return "leave_of_absence";
  if (status in LIFECYCLE_TRANSITIONS) return status as EmployeeLifecycleState;
  return "active";
}

export function canTransition(
  from: EmployeeLifecycleState,
  to: EmployeeLifecycleState
): boolean {
  if (from === to) return true;
  return (LIFECYCLE_TRANSITIONS[from] ?? []).includes(to);
}

export async function transitionEmployeeLifecycle(
  supabase: AuthClient,
  input: TransitionLifecycleInput
): Promise<LifecycleResult> {
  const { data: employee } = await supabase
    .from("employees")
    .select("id, school_id, employment_status, lifecycle_stage")
    .eq("id", input.employeeId)
    .maybeSingle();

  if (!employee) return { ok: false, error: "Employee not found", code: "not_found" };

  const fromState = normalizeFromStatus(
    String(employee.employment_status),
    (employee.lifecycle_stage as string | null) ?? null
  );
  const toState = input.toState;

  if (!canTransition(fromState, toState)) {
    return {
      ok: false,
      error: `Cannot transition from ${fromState} to ${toState}`,
      code: "invalid_transition",
    };
  }

  const actorUserId = await resolveActorUserId(supabase);
  const effectiveDate =
    input.effectiveDate ?? new Date().toISOString().slice(0, 10);
  const dbStatus = toDbStatus(toState);

  await supabase
    .from("employees")
    .update({
      employment_status: dbStatus,
      lifecycle_stage: toState,
      separation_date:
        toState === "terminated" || toState === "retired" ? effectiveDate : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.employeeId);

  const eventType =
    toState === "terminated"
      ? "separation"
      : toState === "leave_of_absence"
        ? "leave"
        : toState === "active" && fromState === "leave_of_absence"
          ? "return"
          : toState === "hired" || toState === "onboarding"
            ? "hire"
            : toState === "offer_extended"
              ? "offer"
              : "other";

  await supabase.from("employee_service_history").insert({
    employee_id: input.employeeId,
    event_type: eventType,
    title: input.title ?? `Lifecycle → ${toState}`,
    description: input.notes ?? null,
    effective_date: effectiveDate,
    recorded_by: actorUserId,
  });

  const schoolId = input.schoolId ?? employee.school_id;
  const schoolCtx = schoolId ? await resolveSchoolContext(supabase, schoolId) : null;

  const activityType =
    toState === "hired" || (toState === "onboarding" && fromState !== "onboarding")
      ? "employee.hired"
      : toState === "terminated"
        ? "employee.terminated"
        : toState === "offer_extended"
          ? "employee.offer.extended"
          : "employee.updated";

  await recordHcmActivity(supabase, {
    eventType: activityType,
    title: `Employee ${toState.replace(/_/g, " ")}`,
    summary: input.title ?? `${fromState} → ${toState}`,
    entityId: input.employeeId,
    organizationId: schoolCtx?.organizationId ?? input.organizationId,
    schoolId,
    actorUserId,
    payload: { fromState, toState, effectiveDate },
  });

  if (toState === "onboarding") {
    try {
      const { seedDefaultOnboardingTasks } = await import("@/lib/hr/automation");
      await seedDefaultOnboardingTasks(supabase, input.employeeId);
    } catch {
      // best-effort
    }
  }

  return {
    ok: true,
    employeeId: input.employeeId,
    fromState,
    toState,
  };
}

export async function promoteEmployee(
  supabase: AuthClient,
  input: {
    employeeId: string;
    title: string;
    notes?: string;
    schoolId?: string | null;
  }
): Promise<LifecycleResult> {
  const actorUserId = await resolveActorUserId(supabase);
  const { data: employee } = await supabase
    .from("employees")
    .select("id, school_id, employment_status, lifecycle_stage")
    .eq("id", input.employeeId)
    .maybeSingle();
  if (!employee) return { ok: false, error: "Employee not found", code: "not_found" };

  await supabase.from("employee_service_history").insert({
    employee_id: input.employeeId,
    event_type: "promotion",
    title: input.title,
    description: input.notes ?? null,
    effective_date: new Date().toISOString().slice(0, 10),
    recorded_by: actorUserId,
  });

  if (input.title) {
    await supabase
      .from("employee_profiles")
      .update({ job_title: input.title })
      .eq("employee_id", input.employeeId);
  }

  const schoolId = input.schoolId ?? employee.school_id;
  const schoolCtx = schoolId ? await resolveSchoolContext(supabase, schoolId) : null;
  await recordHcmActivity(supabase, {
    eventType: "employee.promoted",
    title: "Employee promoted",
    summary: input.title,
    entityId: input.employeeId,
    organizationId: schoolCtx?.organizationId,
    schoolId,
    actorUserId,
  });

  return {
    ok: true,
    employeeId: input.employeeId,
    fromState: String(employee.lifecycle_stage ?? employee.employment_status),
    toState: normalizeFromStatus(
      String(employee.employment_status),
      (employee.lifecycle_stage as string | null) ?? null
    ),
  };
}
