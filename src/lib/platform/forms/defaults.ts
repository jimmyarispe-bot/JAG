import type {
  FormDefinition,
  FormValues,
} from "@/lib/platform/forms/types";

/** Apply field defaultValue for keys not present in input values. */
export function applyFormDefaults(
  definition: FormDefinition,
  values: FormValues = {}
): FormValues {
  const next: FormValues = { ...values };
  for (const field of definition.fields) {
    if (next[field.key] === undefined && field.defaultValue !== undefined) {
      next[field.key] = field.defaultValue;
    }
  }
  return next;
}
