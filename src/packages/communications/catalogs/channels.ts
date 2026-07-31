/** Channel kinds — definitions only. Providers are integrations. */
export const COMMUNICATION_CHANNEL_KINDS = Object.freeze([
  Object.freeze({ id: "email", label: "Email" }),
  Object.freeze({ id: "sms", label: "SMS" }),
  Object.freeze({ id: "push", label: "Push" }),
  Object.freeze({ id: "in_app", label: "In-App" }),
  Object.freeze({ id: "voice", label: "Voice" }),
  Object.freeze({ id: "chat", label: "Chat" }),
  Object.freeze({ id: "webhook", label: "Webhook" }),
] as const);

export type CommunicationChannelKindId =
  (typeof COMMUNICATION_CHANNEL_KINDS)[number]["id"];
