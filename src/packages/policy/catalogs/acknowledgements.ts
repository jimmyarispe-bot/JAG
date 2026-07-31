/** Acknowledgement status — no notification engine. */
export const POLICY_ACKNOWLEDGEMENT_STATUSES = Object.freeze([
  Object.freeze({ id: "pending", label: "Pending" }),
  Object.freeze({ id: "acknowledged", label: "Acknowledged" }),
  Object.freeze({ id: "declined", label: "Declined" }),
  Object.freeze({ id: "expired", label: "Expired" }),
] as const);
