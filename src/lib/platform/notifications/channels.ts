import type {
  NotificationChannel,
  NotificationChannelId,
} from "@/lib/platform/notifications/types";

/**
 * Channel registry — business logic dispatches by id.
 * Only `in_app` is implemented for RC1.
 */
export const NOTIFICATION_CHANNELS: readonly NotificationChannel[] = [
  { id: "in_app", label: "In-app", implemented: true },
  { id: "email", label: "Email", implemented: false },
  { id: "sms", label: "SMS", implemented: false },
  { id: "push", label: "Push", implemented: false },
  { id: "microsoft_teams", label: "Microsoft Teams", implemented: false },
  { id: "slack", label: "Slack", implemented: false },
] as const;

export const DEFAULT_NOTIFICATION_CHANNEL: NotificationChannelId = "in_app";

export function getChannel(id: NotificationChannelId): NotificationChannel {
  const channel = NOTIFICATION_CHANNELS.find((c) => c.id === id);
  if (!channel) {
    throw new Error(`Unknown notification channel: ${id}`);
  }
  return channel;
}

export function assertChannelImplemented(id: NotificationChannelId): void {
  const channel = getChannel(id);
  if (!channel.implemented) {
    throw new Error(
      `Notification channel "${id}" is not implemented yet (RC1 supports in-app only).`
    );
  }
}

export function listImplementedChannels(): NotificationChannel[] {
  return NOTIFICATION_CHANNELS.filter((c) => c.implemented);
}
