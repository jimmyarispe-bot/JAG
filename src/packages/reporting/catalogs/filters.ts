/** Filter dimension examples — definitions only. */
export const REPORT_FILTER_DIMENSIONS = Object.freeze([
  Object.freeze({ id: "scope", label: "Scope" }),
  Object.freeze({ id: "organization", label: "Organization" }),
  Object.freeze({ id: "date_range", label: "Date Range" }),
  Object.freeze({ id: "status", label: "Status" }),
  Object.freeze({ id: "owner", label: "Owner" }),
  Object.freeze({ id: "tags", label: "Tags" }),
] as const);
