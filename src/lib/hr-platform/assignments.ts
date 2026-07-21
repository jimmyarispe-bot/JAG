import { resolveActorUserId, resolveSchoolContext } from "@/lib/platform/shared/context";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { recordHcmActivity } from "./activity";
import type { AssignmentEntityType } from "./types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type AssignmentResult =
  | { ok: true; assignmentId: string }
  | { ok: false; error: string };

export async function assignEmployee(
  supabase: AuthClient,
  input: {
    employeeId: string;
    entityType: AssignmentEntityType;
    entityId: string;
    entityLabel?: string;
    isPrimary?: boolean;
    effectiveStart?: string;
    effectiveEnd?: string | null;
    schoolId?: string | null;
  }
): Promise<AssignmentResult> {
  const { data, error } = await supabase
    .from("hr_employee_assignments")
    .insert({
      employee_id: input.employeeId,
      entity_type: input.entityType,
      entity_id: input.entityId,
      entity_label: input.entityLabel ?? null,
      is_primary: input.isPrimary ?? false,
      effective_start: input.effectiveStart ?? new Date().toISOString().slice(0, 10),
      effective_end: input.effectiveEnd ?? null,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Assignment failed" };

  if (input.entityType === "position") {
    try {
      await supabase.from("employee_positions").upsert(
        {
          employee_id: input.employeeId,
          position_id: input.entityId,
          is_primary: input.isPrimary ?? false,
          effective_start: input.effectiveStart ?? new Date().toISOString().slice(0, 10),
        } as never,
        { onConflict: "employee_id,position_id" }
      );
    } catch {
      // schema may differ
    }
  }

  const { data: emp } = await supabase
    .from("employees")
    .select("school_id")
    .eq("id", input.employeeId)
    .maybeSingle();
  const schoolId = input.schoolId ?? emp?.school_id;
  const schoolCtx = schoolId ? await resolveSchoolContext(supabase, schoolId) : null;

  await supabase.from("employee_service_history").insert({
    employee_id: input.employeeId,
    event_type: "assignment",
    title: `Assigned to ${input.entityType}`,
    description: input.entityLabel ?? input.entityId,
    effective_date: input.effectiveStart ?? new Date().toISOString().slice(0, 10),
    recorded_by: await resolveActorUserId(supabase),
  });

  await recordHcmActivity(supabase, {
    eventType: "employee.assigned",
    title: "Employee assigned",
    summary: `${input.entityType}: ${input.entityLabel ?? input.entityId}`,
    entityId: input.employeeId,
    organizationId: schoolCtx?.organizationId,
    schoolId,
    actorUserId: await resolveActorUserId(supabase),
    payload: {
      entityType: input.entityType,
      entityId: input.entityId,
      assignmentId: data.id,
    },
  });

  return { ok: true, assignmentId: data.id };
}

export async function listEmployeeAssignments(
  supabase: AuthClient,
  employeeId: string
) {
  const { data } = await supabase
    .from("hr_employee_assignments")
    .select("*")
    .eq("employee_id", employeeId)
    .order("effective_start", { ascending: false });
  return data ?? [];
}
