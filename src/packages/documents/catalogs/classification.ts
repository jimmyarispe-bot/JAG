/** Classification labels — definitions only. */
export const DOCUMENT_CLASSIFICATIONS = Object.freeze([
  Object.freeze({ id: "public", label: "Public" }),
  Object.freeze({ id: "internal", label: "Internal" }),
  Object.freeze({ id: "confidential", label: "Confidential" }),
  Object.freeze({ id: "restricted", label: "Restricted" }),
] as const);
