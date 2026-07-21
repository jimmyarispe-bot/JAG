"use server";

import { revalidatePath } from "next/cache";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { deactivateEmployee, restoreEmployee } from "./service";

function canManageEmployees(): boolean {
  return true; // refined below with identity
}

export async function requireEmployeeLifecycleAccess() {
  const ctx = await getIdentityContext();
  if (!ctx) return { ok: false as const, error: "Unauthorized" };
  const allowed =
    ctx.roles.some((r) => ["CEO", "FOUNDER", "SCHOOL_LEADER", "HR"].includes(r)) ||
    ctx.permissions.includes("hr.manage") ||
    ctx.permissions.includes("hr.view");
  if (!allowed) {
    return { ok: false as const, error: "You do not have permission to manage employees." };
  }
  return { ok: true as const, ctx };
}

export async function deactivateEmployeeAction(input: {
  employeeId: string;
  status?: "inactive" | "terminated" | "on_leave";
  reason?: string | null;
}) {
  const access = await requireEmployeeLifecycleAccess();
  if (!access.ok) return { ok: false as const, error: access.error };
  void canManageEmployees;
  const supabase = await createAuthClient();
  const result = await deactivateEmployee(supabase, input);
  if (result.ok) {
    revalidatePath("/dashboard/hr");
    revalidatePath(`/dashboard/hr/employees/${input.employeeId}`);
  }
  return result;
}

export async function restoreEmployeeAction(input: { employeeId: string }) {
  const access = await requireEmployeeLifecycleAccess();
  if (!access.ok) return { ok: false as const, error: access.error };
  const supabase = await createAuthClient();
  const result = await restoreEmployee(supabase, input);
  if (result.ok) {
    revalidatePath("/dashboard/hr");
    revalidatePath(`/dashboard/hr/employees/${input.employeeId}`);
  }
  return result;
}
