/** Communication status model — representation only (no transport). */
export const COMMUNICATION_STATUS_STATES = Object.freeze([
  Object.freeze({ id: "draft", label: "Draft" }),
  Object.freeze({ id: "queued", label: "Queued" }),
  Object.freeze({ id: "sent", label: "Sent" }),
  Object.freeze({ id: "delivered", label: "Delivered" }),
  Object.freeze({ id: "read", label: "Read" }),
  Object.freeze({ id: "acknowledged", label: "Acknowledged" }),
  Object.freeze({ id: "archived", label: "Archived" }),
] as const);

export type CommunicationStatusStateId =
  (typeof COMMUNICATION_STATUS_STATES)[number]["id"];
