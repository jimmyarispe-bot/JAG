/** Document lifecycle states — representation only (no workflow engine). */
export const DOCUMENT_LIFECYCLE_STATES = Object.freeze([
  Object.freeze({ id: "draft", label: "Draft" }),
  Object.freeze({ id: "review", label: "Review" }),
  Object.freeze({ id: "approved", label: "Approved" }),
  Object.freeze({ id: "published", label: "Published" }),
  Object.freeze({ id: "archived", label: "Archived" }),
  Object.freeze({ id: "retired", label: "Retired" }),
] as const);

export type DocumentLifecycleStateId =
  (typeof DOCUMENT_LIFECYCLE_STATES)[number]["id"];
