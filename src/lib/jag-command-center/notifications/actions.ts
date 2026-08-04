"use server";

import { revalidatePath } from "next/cache";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";
import {
  getJagNotification,
  markAllJagNotificationsRead,
  markJagNotificationRead,
} from "./store";
import { sessionCanAccessNotification } from "./access";

export async function markNotificationReadAction(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getJagPlatformSession();
  if (!session) return { ok: false, error: "Not authenticated." };

  const stored = getJagNotification(id);
  if (!stored) return { ok: false, error: "Notification not found." };
  if (!sessionCanAccessNotification(session, stored)) {
    return { ok: false, error: "Organization access denied." };
  }

  const ok = markJagNotificationRead(session, id);
  if (!ok) return { ok: false, error: "Organization access denied." };

  revalidatePath("/jag");
  return { ok: true };
}

export async function markAllNotificationsReadAction(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const session = await getJagPlatformSession();
  if (!session) return { ok: false, error: "Not authenticated." };

  if (
    session.authority === "organization" &&
    !session.organizationId?.trim()
  ) {
    return { ok: false, error: "Organization context required." };
  }

  markAllJagNotificationsRead(session);
  revalidatePath("/jag");
  return { ok: true };
}
