/** Reusable analysis dimensions — definitions only. */
export const ANALYTIC_DIMENSION_EXAMPLES = Object.freeze([
  Object.freeze({ id: "organization", label: "Organization" }),
  Object.freeze({ id: "department", label: "Department" }),
  Object.freeze({ id: "team", label: "Team" }),
  Object.freeze({ id: "time", label: "Time" }),
  Object.freeze({ id: "geography", label: "Geography" }),
  Object.freeze({ id: "capability_pack", label: "Capability Pack" }),
  Object.freeze({ id: "role", label: "Role" }),
] as const);
