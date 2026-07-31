import type { FormFieldType } from "@/lib/platform/forms/types";

/** Generic field library — no application-specific types. */
export const FORM_FIELD_TYPES: readonly FormFieldType[] = [
  "text",
  "number",
  "currency",
  "email",
  "phone",
  "date",
  "select",
  "multiselect",
  "boolean",
  "entity_reference",
  "document_upload",
  "rich_text",
] as const;

export const FORM_FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
  text: "Text",
  number: "Number",
  currency: "Currency",
  email: "Email",
  phone: "Phone",
  date: "Date",
  select: "Select",
  multiselect: "Multi-select",
  boolean: "Boolean",
  entity_reference: "Entity reference",
  document_upload: "Document upload",
  rich_text: "Rich text",
};

export function isFormFieldType(value: string): value is FormFieldType {
  return (FORM_FIELD_TYPES as readonly string[]).includes(value);
}
