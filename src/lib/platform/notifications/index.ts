export { NotificationService } from "@/lib/platform/notifications/service";
export type { NotificationServiceApi } from "@/lib/platform/notifications/service";

export type {
  AssigneeDecisionBuckets,
  AssignmentTarget,
  CreateAssignmentNotificationInput,
  DecisionAccountabilityBuckets,
  NotificationChannel,
  NotificationChannelId,
  NotificationHistoryAction,
  NotificationHistoryEntry,
  NotificationPreferences,
  NotificationStatus,
  NotificationType,
  PlatformNotification,
} from "@/lib/platform/notifications/types";

export {
  DEFAULT_NOTIFICATION_CHANNEL,
  NOTIFICATION_CHANNELS,
  assertChannelImplemented,
  getChannel,
  listImplementedChannels,
} from "@/lib/platform/notifications/channels";

export {
  dispatchAssignmentNotification,
  getStoredNotification,
  listAllNotifications,
  listNotificationsForDecision,
  listNotificationsForRecipient,
  resetNotificationStoreForTests,
  upsertStoredNotification,
} from "@/lib/platform/notifications/dispatcher";

export {
  buildAssigneeDecisionBuckets,
  buildFounderAccountabilityBuckets,
  hasUnacknowledgedNotification,
  isDecisionOverdue,
  isDecisionUnassigned,
  isDueToday,
  notifyDecisionAssignment,
  resolveAssignmentRecipientId,
} from "@/lib/platform/notifications/assignment";

export {
  acknowledgeNotification,
  appendNotificationHistory,
  archiveNotification,
  canAdvanceNotificationStatus,
  markNotificationRead,
  resetNotificationHistorySequenceForTests,
} from "@/lib/platform/notifications/acknowledgement";

export {
  defaultNotificationPreferences,
  getNotificationPreferences,
  resetNotificationPreferencesForTests,
  resolvePreferredChannel,
  setNotificationPreferences,
} from "@/lib/platform/notifications/preferences";

export { deliverViaChannel } from "@/lib/platform/notifications/delivery";
export type { ChannelDeliveryResult } from "@/lib/platform/notifications/delivery";

export {
  DEFAULT_DUE_IN_DAYS_BY_PRIORITY,
  defaultDueDateForPriority,
  overrideDueDate,
} from "@/lib/platform/notifications/due-dates";
