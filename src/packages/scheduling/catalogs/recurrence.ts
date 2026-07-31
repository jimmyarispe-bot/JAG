/** Recurrence frequencies — representation only (no scheduling engine). */
export const RECURRENCE_FREQUENCIES = Object.freeze([
  Object.freeze({ id: "daily", label: "Daily" }),
  Object.freeze({ id: "weekly", label: "Weekly" }),
  Object.freeze({ id: "monthly", label: "Monthly" }),
  Object.freeze({ id: "yearly", label: "Yearly" }),
  Object.freeze({ id: "custom", label: "Custom" }),
] as const);

export type RecurrenceFrequencyId =
  (typeof RECURRENCE_FREQUENCIES)[number]["id"];
