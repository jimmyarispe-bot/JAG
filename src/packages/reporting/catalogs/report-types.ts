/** Example report type keys — industry blueprints decide which exist. */
export const REPORT_TYPE_EXAMPLES = Object.freeze([
  Object.freeze({ id: "executive", label: "Executive Report" }),
  Object.freeze({ id: "operational", label: "Operational Report" }),
  Object.freeze({ id: "compliance", label: "Compliance Report" }),
  Object.freeze({ id: "financial", label: "Financial Report" }),
  Object.freeze({ id: "activity", label: "Activity Report" }),
  Object.freeze({ id: "status", label: "Status Report" }),
  Object.freeze({ id: "exception", label: "Exception Report" }),
] as const);
