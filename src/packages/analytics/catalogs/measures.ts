/** Measure kinds — no aggregation engine. */
export const ANALYTIC_MEASURE_KINDS = Object.freeze([
  Object.freeze({ id: "count", label: "Count" }),
  Object.freeze({ id: "percentage", label: "Percentage" }),
  Object.freeze({ id: "duration", label: "Duration" }),
  Object.freeze({ id: "currency", label: "Currency" }),
  Object.freeze({ id: "ratio", label: "Ratio" }),
  Object.freeze({ id: "score", label: "Score" }),
] as const);
