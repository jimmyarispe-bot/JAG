"use server";

import { revalidatePath } from "next/cache";
import {
  assignUserRole,
  createManagedUser,
  deleteManagedUser,
  importUsersFromCsv,
  inviteManagedUsers,
  resetUserPassword,
  setUserActiveState,
} from "@/lib/platform/identity/user-management";
import {
  resolveUserManagementRole,
  resolveUserManagementStatus,
  type UserManagementRoleValue,
} from "@/lib/platform/identity/user-management-catalog";
import { assignUserOrgScopeAction } from "@/lib/platform/identity/server-actions";

function revalidateUsers() {
  revalidatePath("/dashboard/admin/users");
}

export async function createUserAction(formData: FormData) {
  const role = resolveUserManagementRole(String(formData.get("role") ?? ""));
  if (!role) return { error: "Select a valid role" };

  const schoolIds = formData
    .getAll("school_ids")
    .map(String)
    .filter(Boolean);

  const result = await createManagedUser({
    firstName: String(formData.get("first_name") ?? ""),
    lastName: String(formData.get("last_name") ?? ""),
    preferredName: String(formData.get("preferred_name") ?? "") || null,
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? "") || null,
    organizationId: String(formData.get("organization_id") ?? ""),
    schoolIds,
    role,
    department: String(formData.get("department") ?? "") || null,
    managerUserId: String(formData.get("manager_user_id") ?? "") || null,
    status: resolveUserManagementStatus(String(formData.get("status") ?? "active")),
  });

  if (!result.success) return { error: result.error };
  revalidateUsers();
  return { success: true, userId: result.userId, invited: result.invited };
}

export async function inviteUsersAction(formData: FormData) {
  const role = resolveUserManagementRole(String(formData.get("role") ?? ""));
  if (!role) return { error: "Select a valid role" };

  const rawEmails = String(formData.get("emails") ?? "");
  const emails = rawEmails
    .split(/[\n,;]+/)
    .map((e) => e.trim())
    .filter(Boolean);

  if (!emails.length) return { error: "Enter at least one email" };

  const schoolIds = formData.getAll("school_ids").map(String).filter(Boolean);
  const result = await inviteManagedUsers({
    emails,
    role,
    organizationId: String(formData.get("organization_id") ?? ""),
    schoolIds,
  });

  if (!result.success) {
    // TEMP instrumentation — remove after invite failure capture
    const actionResult = { error: result.error };
    console.error("[INVITE FAILURE]", {
      location: "inviteUsersAction",
      result: actionResult,
    });
    return actionResult;
  }
  revalidateUsers();
  return {
    success: true,
    created: result.created,
    errors: result.errors,
  };
}

export async function importUsersCsvAction(formData: FormData) {
  const csvText = String(formData.get("csv_text") ?? "");
  const organizationId = String(formData.get("organization_id") ?? "");
  const schoolsJson = String(formData.get("schools_json") ?? "[]");
  let schools: Array<{ id: string; name: string }> = [];
  try {
    schools = JSON.parse(schoolsJson) as Array<{ id: string; name: string }>;
  } catch {
    return { error: "Invalid schools payload" };
  }

  const result = await importUsersFromCsv({ csvText, organizationId, schools });
  if (!result.success) return { error: result.error };
  revalidateUsers();
  return { success: true, created: result.created, errors: result.errors };
}

export async function assignUserRoleAction(formData: FormData) {
  const role = resolveUserManagementRole(String(formData.get("role") ?? ""));
  if (!role) return { error: "Select a valid role" };
  const result = await assignUserRole({
    userId: String(formData.get("user_id") ?? ""),
    role,
    replace: formData.get("replace") === "true",
  });
  if (!result.success) return { error: result.error };
  revalidateUsers();
  return { success: true };
}

export async function assignUserSchoolsAction(formData: FormData) {
  const userId = String(formData.get("user_id") ?? "");
  const schoolIds = formData.getAll("school_ids").map(String).filter(Boolean);
  if (!userId || !schoolIds.length) return { error: "User and at least one school required" };

  for (const schoolId of schoolIds) {
    const fd = new FormData();
    fd.set("user_id", userId);
    fd.set("school_id", schoolId);
    fd.set("all_campuses", "true");
    fd.set("all_programs", "true");
    const result = await assignUserOrgScopeAction(fd);
    if (result && "error" in result && result.error) {
      return { error: result.error };
    }
  }
  revalidateUsers();
  return { success: true };
}

export async function deactivateUserAction(formData: FormData) {
  const result = await setUserActiveState({
    userId: String(formData.get("user_id") ?? ""),
    active: false,
  });
  if (!result.success) return { error: result.error };
  revalidateUsers();
  return { success: true };
}

export async function activateUserAction(formData: FormData) {
  const result = await setUserActiveState({
    userId: String(formData.get("user_id") ?? ""),
    active: true,
  });
  if (!result.success) return { error: result.error };
  revalidateUsers();
  return { success: true };
}

export async function resetPasswordAction(formData: FormData) {
  const result = await resetUserPassword(String(formData.get("user_id") ?? ""));
  if (!result.success) return { error: result.error };
  return { success: true };
}

export async function deleteUserAction(formData: FormData) {
  const result = await deleteManagedUser(String(formData.get("user_id") ?? ""));
  if (!result.success) return { error: result.error };
  revalidateUsers();
  return { success: true };
}

export async function bulkAssignRoleAction(formData: FormData) {
  const role = resolveUserManagementRole(String(formData.get("role") ?? ""));
  if (!role) return { error: "Select a valid role" };
  const userIds = formData.getAll("user_ids").map(String).filter(Boolean);
  for (const userId of userIds) {
    const result = await assignUserRole({
      userId,
      role: role as UserManagementRoleValue,
      replace: true,
    });
    if (!result.success) return { error: result.error };
  }
  revalidateUsers();
  return { success: true };
}

export async function bulkAssignSchoolAction(formData: FormData) {
  const schoolId = String(formData.get("school_id") ?? "");
  const userIds = formData.getAll("user_ids").map(String).filter(Boolean);
  if (!schoolId) return { error: "Select a school" };
  for (const userId of userIds) {
    const fd = new FormData();
    fd.set("user_id", userId);
    fd.set("school_id", schoolId);
    fd.set("all_campuses", "true");
    fd.set("all_programs", "true");
    const result = await assignUserOrgScopeAction(fd);
    if (result && "error" in result && result.error) {
      return { error: result.error };
    }
  }
  revalidateUsers();
  return { success: true };
}

export async function bulkDeactivateAction(formData: FormData) {
  const userIds = formData.getAll("user_ids").map(String).filter(Boolean);
  for (const userId of userIds) {
    const result = await setUserActiveState({ userId, active: false });
    if (!result.success) return { error: result.error };
  }
  revalidateUsers();
  return { success: true };
}
