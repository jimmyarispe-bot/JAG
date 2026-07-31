/** Delivery policy modes — representation only (no scheduler / transport). */
export const DELIVERY_POLICY_MODES = Object.freeze([
  Object.freeze({ id: "immediate", label: "Immediate" }),
  Object.freeze({ id: "batched", label: "Batched" }),
  Object.freeze({ id: "scheduled", label: "Scheduled" }),
] as const);

export const NOTIFICATION_PRIORITIES = Object.freeze([
  Object.freeze({ id: "low", label: "Low" }),
  Object.freeze({ id: "normal", label: "Normal" }),
  Object.freeze({ id: "high", label: "High" }),
  Object.freeze({ id: "urgent", label: "Urgent" }),
] as const);

export const NOTIFICATION_SEVERITIES = Object.freeze([
  Object.freeze({ id: "info", label: "Info" }),
  Object.freeze({ id: "warning", label: "Warning" }),
  Object.freeze({ id: "error", label: "Error" }),
  Object.freeze({ id: "critical", label: "Critical" }),
] as const);
