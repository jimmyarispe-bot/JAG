"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { JAG_PLATFORM_USERS_PATH } from "@/lib/jag-platform/platform-access";
import {
  deactivateJagPlatformUser,
  reactivateJagPlatformUser,
  resendJagPlatformSetupEmail,
  updateJagPlatformUser,
} from "@/lib/jag-platform/platform-user-admin";

function originHintFromHeaders(headerStore: Headers): string | undefined {
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  if (!host?.trim()) return undefined;
  const proto = headerStore.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host.split(",")[0]!.trim()}`;
}

function revalidate() {
  revalidatePath(JAG_PLATFORM_USERS_PATH);
}

export async function updateJagPlatformUserAction(formData: FormData) {
  const userId = String(formData.get("user_id") ?? "").trim();
  if (!userId) return { error: "User is required" };

  const raw = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value : undefined;
  };

  const result = await updateJagPlatformUser({
    userId,
    firstName: raw("first_name"),
    lastName: raw("last_name"),
    email: raw("email"),
    role: raw("role"),
  });
  if (!result.success) return { error: result.error };
  revalidate();
  return { success: true, message: "User updated." };
}

export async function deactivateJagPlatformUserAction(formData: FormData) {
  const userId = String(formData.get("user_id") ?? "").trim();
  if (!userId) return { error: "User is required" };

  // Typed confirmation guard — the client sends what the admin typed.
  const confirmation = String(formData.get("confirm") ?? "").trim();
  if (confirmation.toUpperCase() !== "DEACTIVATE") {
    return { error: 'Type DEACTIVATE to confirm.' };
  }

  const result = await deactivateJagPlatformUser({ userId });
  if (!result.success) return { error: result.error };
  revalidate();
  return { success: true, message: "User deactivated. Sign-in is now blocked." };
}

export async function reactivateJagPlatformUserAction(formData: FormData) {
  const userId = String(formData.get("user_id") ?? "").trim();
  if (!userId) return { error: "User is required" };

  const result = await reactivateJagPlatformUser({ userId });
  if (!result.success) return { error: result.error };
  revalidate();
  return { success: true, message: "User reactivated." };
}

export async function resendJagPlatformSetupEmailAction(formData: FormData) {
  const userId = String(formData.get("user_id") ?? "").trim();
  if (!userId) return { error: "User is required" };

  const headerStore = await headers();
  const result = await resendJagPlatformSetupEmail({
    userId,
    originHint: originHintFromHeaders(headerStore),
  });
  if (!result.success) return { error: result.error };
  revalidate();
  return { success: true, message: "Setup email sent." };
}
