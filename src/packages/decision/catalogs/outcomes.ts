/** Decision outcome representations. */
export const DECISION_OUTCOMES = Object.freeze([
  Object.freeze({ id: "accepted", label: "Accepted" }),
  Object.freeze({ id: "rejected", label: "Rejected" }),
  Object.freeze({ id: "deferred", label: "Deferred" }),
  Object.freeze({ id: "superseded", label: "Superseded" }),
] as const);

export type DecisionOutcomeId = (typeof DECISION_OUTCOMES)[number]["id"];
