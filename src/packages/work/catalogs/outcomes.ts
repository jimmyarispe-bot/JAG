/** Outcome representations for completed work. */
export const WORK_OUTCOMES = Object.freeze([
  Object.freeze({ id: "completed", label: "Completed" }),
  Object.freeze({ id: "abandoned", label: "Abandoned" }),
  Object.freeze({ id: "superseded", label: "Superseded" }),
] as const);

export type WorkOutcomeId = (typeof WORK_OUTCOMES)[number]["id"];
