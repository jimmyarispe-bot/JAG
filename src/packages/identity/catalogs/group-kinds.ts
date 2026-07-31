/** Group kinds — definitions only. */
export const IDENTITY_GROUP_KINDS = Object.freeze([
  Object.freeze({ id: "static", label: "Static group" }),
  Object.freeze({ id: "dynamic", label: "Dynamic group" }),
  Object.freeze({ id: "organizational", label: "Organizational group" }),
] as const);
