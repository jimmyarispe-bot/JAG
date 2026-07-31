/** Output format definitions only — no rendering. */
export const REPORT_OUTPUT_FORMATS = Object.freeze([
  Object.freeze({ id: "screen", label: "Screen" }),
  Object.freeze({ id: "pdf", label: "PDF" }),
  Object.freeze({ id: "spreadsheet", label: "Spreadsheet" }),
  Object.freeze({ id: "csv", label: "CSV" }),
  Object.freeze({ id: "json", label: "JSON" }),
] as const);
