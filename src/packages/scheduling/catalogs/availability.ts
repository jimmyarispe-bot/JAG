/** Availability states — no calendar synchronization. */
export const AVAILABILITY_STATES = Object.freeze([
  Object.freeze({ id: "available", label: "Available" }),
  Object.freeze({ id: "busy", label: "Busy" }),
  Object.freeze({ id: "tentative", label: "Tentative" }),
  Object.freeze({ id: "unavailable", label: "Unavailable" }),
  Object.freeze({ id: "out_of_office", label: "Out of Office" }),
] as const);

export type AvailabilityStateId = (typeof AVAILABILITY_STATES)[number]["id"];
