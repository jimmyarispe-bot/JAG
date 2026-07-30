"use server";

import { revalidatePath } from "next/cache";
import { WatcherService } from "@/lib/platform/intelligence/watchers/index";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";
import { recordJagAuditEvent } from "../audit/store";

export async function jagAcknowledgeAlertAction(formData: FormData) {
  const session = await getJagPlatformSession();
  if (!session) return;
  const id = String(formData.get("alertId") ?? "");
  if (!id) return;
  const alert = WatcherService.setStatus(id, "acknowledged");
  if (alert) {
    recordJagAuditEvent({
      action: "watcher_alert_acknowledged",
      actorUserId: session.userId,
      actorLabel: session.displayName,
      organizationId: alert.organizationId,
      detail: `Acknowledged alert: ${alert.title}`,
      metadata: { alertId: alert.id },
    });
  }
  revalidatePath("/jag/inbox");
}

export async function jagDismissAlertAction(formData: FormData) {
  const session = await getJagPlatformSession();
  if (!session) return;
  const id = String(formData.get("alertId") ?? "");
  if (!id) return;
  const alert = WatcherService.setStatus(id, "dismissed");
  if (alert) {
    recordJagAuditEvent({
      action: "watcher_alert_dismissed",
      actorUserId: session.userId,
      actorLabel: session.displayName,
      organizationId: alert.organizationId,
      detail: `Dismissed alert: ${alert.title}`,
      metadata: { alertId: alert.id },
    });
  }
  revalidatePath("/jag/inbox");
}

export async function jagResolveAlertAction(formData: FormData) {
  const session = await getJagPlatformSession();
  if (!session) return;
  const id = String(formData.get("alertId") ?? "");
  if (!id) return;
  const alert = WatcherService.setStatus(id, "resolved");
  if (alert) {
    recordJagAuditEvent({
      action: "watcher_alert_resolved",
      actorUserId: session.userId,
      actorLabel: session.displayName,
      organizationId: alert.organizationId,
      detail: `Resolved alert: ${alert.title}`,
      metadata: { alertId: alert.id },
    });
  }
  revalidatePath("/jag/inbox");
}
