"use server";

import { revalidatePath } from "next/cache";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";
import {
  markAllJagNotificationsRead,
  markJagNotificationRead,
} from "./store";

export async function markNotificationReadAction(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getJagPlatformSession();
  if (!session) return { ok: false, error: "Not authenticated." };
  markJagNotificationRead(id);
  revalidatePath("/jag");
  return { ok: true };
}

export async function markAllNotificationsReadAction(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const session = await getJagPlatformSession();
  if (!session) return { ok: false, error: "Not authenticated." };
  markAllJagNotificationsRead();
  revalidatePath("/jag");
  return { ok: true };
}
