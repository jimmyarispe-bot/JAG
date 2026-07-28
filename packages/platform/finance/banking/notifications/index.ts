import { randomUUID } from "node:crypto";
import { listNotifications, upsertNotification } from "../store";
import type {
  BankingNotification,
  BankingNotificationKind,
} from "../types";

export function notifyBanking(input: {
  organizationId: string;
  kind: BankingNotificationKind;
  message: string;
}): BankingNotification {
  return upsertNotification({
    id: `bnot:${randomUUID()}`,
    organizationId: input.organizationId,
    kind: input.kind,
    message: input.message,
    createdAt: new Date().toISOString(),
    read: false,
  });
}

export function markNotificationRead(input: {
  organizationId: string;
  notificationId: string;
}): BankingNotification | { error: string } {
  const existing = listNotifications(input.organizationId).find(
    (n) => n.id === input.notificationId
  );
  if (!existing) return { error: "Notification not found." };
  return upsertNotification({ ...existing, read: true });
}

export { listNotifications };
