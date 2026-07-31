import type { FormDefinition } from "@/lib/platform/forms/types";
import { FORM_FIELD_TYPES } from "@/lib/platform/forms/fields";

/** Structural schema checks before/after registration. */
export function validateFormSchema(definition: FormDefinition): string[] {
  const errors: string[] = [];
  if (!definition.id) errors.push("id required");
  if (!definition.version) errors.push("version required");
  if (!definition.title) errors.push("title required");
  if (!definition.fields.length) errors.push("at least one field required");

  const keys = new Set<string>();
  for (const field of definition.fields) {
    if (!field.key) errors.push("field key required");
    if (keys.has(field.key)) errors.push(`duplicate field key "${field.key}"`);
    keys.add(field.key);
    if (!(FORM_FIELD_TYPES as readonly string[]).includes(field.type)) {
      errors.push(`unsupported field type "${field.type}" on ${field.key}`);
    }
    if (
      (field.type === "select" || field.type === "multiselect") &&
      (!field.options || field.options.length === 0)
    ) {
      errors.push(`field "${field.key}" requires options`);
    }
    if (field.type === "entity_reference" && !field.entityType) {
      errors.push(`field "${field.key}" requires entityType`);
    }
  }

  for (const section of definition.sections) {
    if (!section.key) errors.push("section key required");
    for (const key of section.fields) {
      if (!keys.has(key)) {
        errors.push(`section "${section.key}" unknown field "${key}"`);
      }
    }
  }

  return errors;
}
