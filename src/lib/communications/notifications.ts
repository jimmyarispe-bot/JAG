import type { createAuthClient } from "@/lib/supabase/server-auth";
import type { InAppNotificationRow } from "./types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export interface CreateInAppNotificationInput {
  userId: string;
  title: string;
  body?: string;
  category?: string;
  href?: string | null;
  relatedStudentId?: string | null;
  relatedFamilyId?: string | null;
  relatedCommunicationId?: string | null;
}

export async function createInAppNotification(
  supabase: AuthClient,
  input: CreateInAppNotificationInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const { data, error } = await supabase
    .from("platform_in_app_notifications")
    .insert({
      user_id: input.userId,
      title: input.title,
      body: input.body ?? "",
      category: input.category ?? "general",
      href: input.href ?? null,
      related_student_id: input.relatedStudentId ?? null,
      related_family_id: input.relatedFamilyId ?? null,
      related_communication_id: input.relatedCommunicationId ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Unable to create notification" };
  }
  return { ok: true, id: data.id as string };
}

export async function listInAppNotifications(
  supabase: AuthClient,
  userId: string,
  limit = 30
): Promise<InAppNotificationRow[]> {
  const { data } = await supabase
    .from("platform_in_app_notifications")
    .select(
      "id, user_id, title, body, category, href, related_student_id, related_family_id, related_communication_id, read_at, created_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as InAppNotificationRow[];
}

export async function markInAppNotificationRead(
  supabase: AuthClient,
  notificationId: string,
  userId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase
    .from("platform_in_app_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", userId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Shape compatible with TopNav / admissions StaffNotificationsBell. */
export function toNavNotificationShape(row: InAppNotificationRow) {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    lead_id: null as string | null,
    created_at: row.created_at,
    notification_type: row.category,
    read_at: row.read_at,
    href: row.href,
  };
}
