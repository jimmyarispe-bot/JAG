import { recordActivity } from "@/lib/platform/activity";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { extractSchoolOrganizationId, resolveActorUserId } from "@/lib/platform/shared/context";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type EmployeeLifecycleResult =
  | { ok: true; employeeId: string; message: string }
  | { ok: false; error: string; code?: string };

async function loadEmployee(supabase: AuthClient, employeeId: string) {
  const { data } = await supabase
    .from("employees")
    .select(
      "id, employment_status, school_id, employee_profiles(display_name, first_name, last_name), schools(organization_id)"
    )
    .eq("id", employeeId)
    .maybeSingle();
  return data;
}

function displayName(row: NonNullable<Awaited<ReturnType<typeof loadEmployee>>>): string {
  const profile = Array.isArray(row.employee_profiles)
    ? row.employee_profiles[0]
    : row.employee_profiles;
  return (
    profile?.display_name ??
    ([profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Employee")
  );
}

/**
 * Deactivate an employee (inactive / terminated). Never hard-deletes HR history.
 */
export async function deactivateEmployee(
  supabase: AuthClient,
  input: {
    employeeId: string;
    status?: "inactive" | "terminated" | "on_leave";
    reason?: string | null;
  }
): Promise<EmployeeLifecycleResult> {
  const status = input.status ?? "inactive";
  const existing = await loadEmployee(supabase, input.employeeId);
  if (!existing) return { ok: false, error: "Employee not found", code: "not_found" };

  const actorUserId = await resolveActorUserId(supabase);
  const update: Record<string, unknown> = {
    employment_status: status,
    updated_at: new Date().toISOString(),
  };
  if (status === "terminated") {
    update.separation_date = new Date().toISOString().slice(0, 10);
  }

  const { error } = await supabase.from("employees").update(update).eq("id", input.employeeId);
  if (error) return { ok: false, error: error.message, code: "failed" };

  try {
    await recordActivity(supabase, {
      eventType: "employee.deactivated",
      moduleKey: "hr",
      entityType: "employee",
      entityId: input.employeeId,
      title: "Employee deactivated",
      summary: displayName(existing),
      organizationId: extractSchoolOrganizationId(existing.schools) ?? undefined,
      schoolId: existing.school_id ?? undefined,
      actorUserId: actorUserId ?? undefined,
      sourceTable: "employees",
      sourceId: input.employeeId,
      payload: { status, reason: input.reason ?? null },
    });
  } catch {
    // best-effort
  }

  return { ok: true, employeeId: input.employeeId, message: `Employee marked ${status}` };
}

export async function restoreEmployee(
  supabase: AuthClient,
  input: { employeeId: string }
): Promise<EmployeeLifecycleResult> {
  const existing = await loadEmployee(supabase, input.employeeId);
  if (!existing) return { ok: false, error: "Employee not found", code: "not_found" };

  const actorUserId = await resolveActorUserId(supabase);
  const { error } = await supabase
    .from("employees")
    .update({
      employment_status: "active",
      separation_date: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.employeeId);
  if (error) return { ok: false, error: error.message, code: "failed" };

  try {
    await recordActivity(supabase, {
      eventType: "employee.restored",
      moduleKey: "hr",
      entityType: "employee",
      entityId: input.employeeId,
      title: "Employee restored",
      summary: displayName(existing),
      organizationId: extractSchoolOrganizationId(existing.schools) ?? undefined,
      schoolId: existing.school_id ?? undefined,
      actorUserId: actorUserId ?? undefined,
      sourceTable: "employees",
      sourceId: input.employeeId,
    });
  } catch {
    // best-effort
  }

  return { ok: true, employeeId: input.employeeId, message: "Employee restored to active" };
}
