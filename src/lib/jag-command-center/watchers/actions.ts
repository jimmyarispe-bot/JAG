"use server";

import { revalidatePath } from "next/cache";
import { WatcherService } from "@/lib/platform/intelligence/watchers/index";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";
import { recordJagAuditEvent } from "../audit/store";
import { getAccessibleWatcherAlert } from "./access";

async function mutateAlertStatus(
  formData: FormData,
  status: "acknowledged" | "dismissed" | "resolved",
  action:
    | "watcher_alert_acknowledged"
    | "watcher_alert_dismissed"
    | "watcher_alert_resolved",
  detailVerb: string
) {
  const session = await getJagPlatformSession();
  if (!session) return;
  const id = String(formData.get("alertId") ?? "");
  if (!id) return;
  // Session → stored alert → stored org ACL → then mutate.
  const existing = getAccessibleWatcherAlert(session, id);
  if (!existing) return;

  const alert = WatcherService.setStatus(existing.id, status);
  if (alert) {
    recordJagAuditEvent({
      action,
      actorUserId: session.userId,
      actorLabel: session.displayName,
      organizationId: alert.organizationId,
      detail: `${detailVerb} alert: ${alert.title}`,
      metadata: { alertId: alert.id },
    });
  }
  revalidatePath("/jag/inbox");
}

export async function jagAcknowledgeAlertAction(formData: FormData) {
  await mutateAlertStatus(
    formData,
    "acknowledged",
    "watcher_alert_acknowledged",
    "Acknowledged"
  );
}

export async function jagDismissAlertAction(formData: FormData) {
  await mutateAlertStatus(
    formData,
    "dismissed",
    "watcher_alert_dismissed",
    "Dismissed"
  );
}

export async function jagResolveAlertAction(formData: FormData) {
  await mutateAlertStatus(
    formData,
    "resolved",
    "watcher_alert_resolved",
    "Resolved"
  );
}
