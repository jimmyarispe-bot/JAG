import type { PlatformSchema, SchemaValidationResult } from "@/lib/platform/schema/types";
import { validatePlatformSchema } from "@/lib/platform/schema/validation";

/**
 * Normalize + optionally validate a schema definition before registration.
 */
export function normalizePlatformSchema(
  definition: PlatformSchema
): PlatformSchema {
  if (!definition.id?.trim()) {
    throw new Error("PlatformSchema.id is required");
  }
  if (!definition.entityType?.trim()) {
    throw new Error("PlatformSchema.entityType is required");
  }
  if (!definition.version?.trim()) {
    throw new Error("PlatformSchema.version is required");
  }
  if (!definition.label?.trim()) {
    throw new Error("PlatformSchema.label is required");
  }
  if (!definition.layer) {
    throw new Error("PlatformSchema.layer is required");
  }

  return {
    ...definition,
    id: definition.id.trim(),
    entityType: definition.entityType.trim(),
    version: definition.version.trim(),
    label: definition.label.trim(),
    extends: definition.extends?.trim() || null,
    fields: definition.fields ?? [],
    relationships: definition.relationships ?? [],
    permissions: definition.permissions ?? [],
    forms: definition.forms ?? [],
    workflows: definition.workflows ?? [],
    indexes: definition.indexes ?? [],
    reports: definition.reports ?? [],
    metadata: definition.metadata ?? {},
  };
}

export function validateSchemaDefinition(
  definition: PlatformSchema,
  options?: { checkReferences?: boolean }
): SchemaValidationResult {
  return validatePlatformSchema(definition, options);
}
