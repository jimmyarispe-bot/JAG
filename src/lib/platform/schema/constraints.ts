import type {
  SchemaFieldConstraint,
  SchemaFieldDefinition,
  SchemaValidationIssue,
} from "@/lib/platform/schema/types";

export function mergeFieldConstraints(
  base?: SchemaFieldConstraint,
  overlay?: SchemaFieldConstraint
): SchemaFieldConstraint | undefined {
  if (!base && !overlay) return undefined;
  return { ...(base ?? {}), ...(overlay ?? {}) };
}

export function validateFieldConstraints(
  field: SchemaFieldDefinition
): SchemaValidationIssue[] {
  const issues: SchemaValidationIssue[] = [];
  const c = field.constraints;
  if (!c) return issues;

  if (c.regex) {
    try {
      // eslint-disable-next-line no-new
      new RegExp(c.regex);
    } catch {
      issues.push({
        path: `fields.${field.key}.constraints.regex`,
        code: "invalid_regex",
        message: `Invalid regex for field "${field.key}"`,
      });
    }
  }

  if (
    c.min !== undefined &&
    c.max !== undefined &&
    c.min > c.max
  ) {
    issues.push({
      path: `fields.${field.key}.constraints`,
      code: "invalid_range",
      message: `Field "${field.key}" has min > max`,
    });
  }

  if (
    c.minLength !== undefined &&
    c.maxLength !== undefined &&
    c.minLength > c.maxLength
  ) {
    issues.push({
      path: `fields.${field.key}.constraints`,
      code: "invalid_length_range",
      message: `Field "${field.key}" has minLength > maxLength`,
    });
  }

  return issues;
}

export function fieldKeysUnique(
  fields: SchemaFieldDefinition[]
): SchemaValidationIssue[] {
  const seen = new Map<string, number>();
  const issues: SchemaValidationIssue[] = [];
  for (const field of fields) {
    const count = (seen.get(field.key) ?? 0) + 1;
    seen.set(field.key, count);
    if (count === 2) {
      issues.push({
        path: `fields.${field.key}`,
        code: "duplicate_field",
        message: `Duplicate field key "${field.key}"`,
      });
    }
  }
  return issues;
}
