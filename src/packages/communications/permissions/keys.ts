export const COMMUNICATIONS_PERMISSION_KEYS = Object.freeze({
  access: "communications.access",
  typesRead: "communications.types.read",
  typesUpdate: "communications.types.update",
  channelsRead: "communications.channels.read",
  channelsUpdate: "communications.channels.update",
  templatesRead: "communications.templates.read",
  templatesUpdate: "communications.templates.update",
  conversationsRead: "communications.conversations.read",
  conversationsUpdate: "communications.conversations.update",
  messagesRead: "communications.messages.read",
  messagesUpdate: "communications.messages.update",
  notificationsRead: "communications.notifications.read",
  notificationsUpdate: "communications.notifications.update",
  campaignsRead: "communications.campaigns.read",
  campaignsUpdate: "communications.campaigns.update",
  preferencesRead: "communications.preferences.read",
  preferencesUpdate: "communications.preferences.update",
  deliveryRead: "communications.delivery.read",
  deliveryUpdate: "communications.delivery.update",
} as const);

export const COMMUNICATIONS_PERMISSION_PACK_ID =
  "communications.permission.core" as const;
