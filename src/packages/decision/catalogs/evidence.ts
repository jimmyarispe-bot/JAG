/** Evidence roles for documents.core references. */
export const DECISION_EVIDENCE_ROLES = Object.freeze([
  Object.freeze({ id: "supporting_document", label: "Supporting Document" }),
  Object.freeze({ id: "reference", label: "Reference" }),
  Object.freeze({ id: "attachment", label: "Attachment" }),
  Object.freeze({ id: "linked_record", label: "Linked Record" }),
] as const);
