/**
 * Invitation kinds — reference communications.core intent models.
 * Transport remains outside this pack.
 */
export const SCHEDULE_INVITATION_KINDS = Object.freeze([
  Object.freeze({ id: "invitation", label: "Invitation" }),
  Object.freeze({ id: "rsvp", label: "RSVP" }),
  Object.freeze({ id: "reminder", label: "Reminder" }),
  Object.freeze({ id: "cancellation", label: "Cancellation" }),
  Object.freeze({ id: "update", label: "Update" }),
] as const);
