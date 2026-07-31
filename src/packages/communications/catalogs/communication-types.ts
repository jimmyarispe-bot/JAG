/** Example communication type keys — industry blueprints decide which exist. */
export const COMMUNICATION_TYPE_EXAMPLES = Object.freeze([
  Object.freeze({ id: "notification", label: "Notification" }),
  Object.freeze({ id: "announcement", label: "Announcement" }),
  Object.freeze({ id: "message", label: "Message" }),
  Object.freeze({ id: "conversation", label: "Conversation" }),
  Object.freeze({ id: "reminder", label: "Reminder" }),
  Object.freeze({ id: "alert", label: "Alert" }),
  Object.freeze({ id: "invitation", label: "Invitation" }),
  Object.freeze({ id: "campaign", label: "Campaign" }),
  Object.freeze({ id: "bulletin", label: "Bulletin" }),
  Object.freeze({ id: "newsletter", label: "Newsletter" }),
] as const);
