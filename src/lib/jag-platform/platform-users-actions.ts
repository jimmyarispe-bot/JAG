"use server";

import { revalidatePath } from "next/cache";
import {
  grantJagPlatformAccess,
  provisionJagPlatformUser,
  revokeJagPlatformAccess,
} from "@/lib/jag-platform/platform-users";
import {
  isJagPlatformAccessRole,
  JAG_PLATFORM_GRANT_ROLE,
  JAG_PLATFORM_USERS_PATH,
} from "@/lib/jag-platform/platform-access";

function revalidate() {
  revalidatePath(JAG_PLATFORM_USERS_PATH);
}

export async function grantJagPlatformAccessAction(formData: FormData) {
  const userId = String(formData.get("user_id") ?? "").trim();
  const rawRole = String(formData.get("role") ?? JAG_PLATFORM_GRANT_ROLE);
  const role = isJagPlatformAccessRole(rawRole)
    ? rawRole
    : JAG_PLATFORM_GRANT_ROLE;
  if (!userId) return { error: "User is required" };
  const result = await grantJagPlatformAccess({ userId, role });
  if (!result.success) return { error: result.error };
  revalidate();
  return { success: true, userId: result.userId };
}

export async function provisionJagPlatformUserAction(formData: FormData) {
  const rawRole = String(formData.get("role") ?? JAG_PLATFORM_GRANT_ROLE);
  const role = isJagPlatformAccessRole(rawRole)
    ? rawRole
    : JAG_PLATFORM_GRANT_ROLE;
  const result = await provisionJagPlatformUser({
    firstName: String(formData.get("first_name") ?? ""),
    lastName: String(formData.get("last_name") ?? ""),
    email: String(formData.get("email") ?? ""),
    role,
  });
  if (!result.success) return { error: result.error };
  revalidate();
  return { success: true, userId: result.userId, created: result.created };
}

export async function revokeJagPlatformAccessAction(formData: FormData) {
  const userId = String(formData.get("user_id") ?? "").trim();
  if (!userId) return { error: "User is required" };
  const result = await revokeJagPlatformAccess({ userId });
  if (!result.success) return { error: result.error };
  revalidate();
  return { success: true };
}
