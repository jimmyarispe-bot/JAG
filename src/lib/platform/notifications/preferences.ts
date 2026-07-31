import { DEFAULT_NOTIFICATION_CHANNEL } from "@/lib/platform/notifications/channels";
import type {
  NotificationChannelId,
  NotificationPreferences,
} from "@/lib/platform/notifications/types";

const preferenceStore = new Map<string, NotificationPreferences>();

export function resetNotificationPreferencesForTests(): void {
  preferenceStore.clear();
}

export function defaultNotificationPreferences(
  userId: string
): NotificationPreferences {
  return {
    userId,
    channels: {
      in_app: true,
      email: false,
      sms: false,
      push: false,
      microsoft_teams: false,
      slack: false,
    },
    quietHours: null,
  };
}

export function getNotificationPreferences(
  userId: string
): NotificationPreferences {
  return preferenceStore.get(userId) ?? defaultNotificationPreferences(userId);
}

export function setNotificationPreferences(
  preferences: NotificationPreferences
): NotificationPreferences {
  preferenceStore.set(preferences.userId, preferences);
  return preferences;
}

/** Resolve delivery channel from preferences (falls back to in-app). */
export function resolvePreferredChannel(
  userId: string
): NotificationChannelId {
  const prefs = getNotificationPreferences(userId);
  if (prefs.channels.in_app !== false) return DEFAULT_NOTIFICATION_CHANNEL;
  // Future: pick first enabled implemented channel.
  return DEFAULT_NOTIFICATION_CHANNEL;
}
