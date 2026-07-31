/**
 * Example document types — data only.
 * Industry blueprints decide which types an organization uses.
 */

export const DOCUMENT_TYPE_EXAMPLES = Object.freeze([
  Object.freeze({ id: "policy", label: "Policy", category: "governance" }),
  Object.freeze({
    id: "procedure",
    label: "Procedure",
    category: "governance",
  }),
  Object.freeze({ id: "contract", label: "Contract", category: "legal" }),
  Object.freeze({ id: "form", label: "Form", category: "capture" }),
  Object.freeze({ id: "report", label: "Report", category: "reporting" }),
  Object.freeze({ id: "notice", label: "Notice", category: "communications" }),
  Object.freeze({ id: "handbook", label: "Handbook", category: "reference" }),
  Object.freeze({ id: "invoice", label: "Invoice", category: "finance" }),
  Object.freeze({ id: "letter", label: "Letter", category: "communications" }),
  Object.freeze({
    id: "certificate",
    label: "Certificate",
    category: "credentials",
  }),
] as const);
