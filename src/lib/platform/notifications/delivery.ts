import {
  appendNotificationHistory,
} from "@/lib/platform/notifications/acknowledgement";
import { assertChannelImplemented } from "@/lib/platform/notifications/channels";
import type {
  NotificationChannelId,
  PlatformNotification,
} from "@/lib/platform/notifications/types";

/**
 * Channel delivery adapters.
 * RC1: in-app only — marks Delivered without external I/O.
 */
export type ChannelDeliveryResult = {
  ok: boolean;
  channel: NotificationChannelId;
  detail: string;
};

export function deliverViaChannel(
  notification: PlatformNotification,
  channel: NotificationChannelId = notification.channel,
  nowIso?: string
): { notification: PlatformNotification; result: ChannelDeliveryResult } {
  assertChannelImplemented(channel);

  if (channel === "in_app") {
    const now = nowIso ?? new Date().toISOString();
    const delivered: PlatformNotification = {
      ...notification,
      channel,
      status: notification.status === "pending" ? "delivered" : notification.status,
      deliveredAt: notification.deliveredAt ?? now,
      history:
        notification.status === "pending"
          ? appendNotificationHistory(notification.history, {
              action: "delivered",
              timestamp: now,
              toStatus: "delivered",
            })
          : notification.history,
    };
    return {
      notification: delivered,
      result: {
        ok: true,
        channel,
        detail: "Delivered to in-app notification inbox",
      },
    };
  }

  // Future channels plug in here without changing assignment business logic.
  throw new Error(`No delivery adapter for channel: ${channel}`);
}
