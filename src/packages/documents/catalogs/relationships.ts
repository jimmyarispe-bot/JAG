/** Document relationship kinds — definitions only. */
export const DOCUMENT_RELATIONSHIP_KINDS = Object.freeze([
  Object.freeze({
    id: "parent",
    label: "Parent document",
    description: "Hierarchical parent",
  }),
  Object.freeze({
    id: "referenced",
    label: "Referenced document",
    description: "Citation / reference",
  }),
  Object.freeze({
    id: "attachment",
    label: "Attachment",
    description: "Attached artifact metadata (not storage)",
  }),
  Object.freeze({
    id: "related_record",
    label: "Related record",
    description: "Link to another business record",
  }),
] as const);
