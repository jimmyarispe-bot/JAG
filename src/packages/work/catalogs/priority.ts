/** Priority definitions only. */
export const WORK_PRIORITIES = Object.freeze([
  Object.freeze({ id: "low", label: "Low" }),
  Object.freeze({ id: "normal", label: "Normal" }),
  Object.freeze({ id: "high", label: "High" }),
  Object.freeze({ id: "critical", label: "Critical" }),
] as const);

export type WorkPriorityId = (typeof WORK_PRIORITIES)[number]["id"];
