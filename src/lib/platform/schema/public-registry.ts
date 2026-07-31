import {
  assertSchemaRegistered,
  getRegisteredSchema,
  listRegisteredSchemas,
  putSchema,
  removeSchema,
  resetSchemaRegistryForTests,
  SchemaRegistry,
} from "@/lib/platform/schema/registry";
import { normalizePlatformSchema } from "@/lib/platform/schema/schema";
import type { PlatformSchema } from "@/lib/platform/schema/types";
import { validatePlatformSchema } from "@/lib/platform/schema/validation";

/**
 * Thin registry helpers matching Entity/Form naming conventions.
 * Prefer SchemaService.register for validation + optional framework sync.
 */
export function registerSchema(
  definition: PlatformSchema,
  options?: { skipValidation?: boolean }
): PlatformSchema {
  const normalized = normalizePlatformSchema(definition);
  if (!options?.skipValidation) {
    const result = validatePlatformSchema(normalized, {
      checkReferences: true,
    });
    if (!result.valid) {
      const detail = result.issues
        .map((i) => `${i.code}: ${i.message}`)
        .join("; ");
      throw new Error(`Schema validation failed: ${detail}`);
    }
  }
  return putSchema(normalized);
}

export function unregisterSchema(schemaId: string): boolean {
  return removeSchema(schemaId);
}

export function getSchema(schemaId: string): PlatformSchema | null {
  return getRegisteredSchema(schemaId);
}

export function listSchemas(
  filter?: Parameters<typeof listRegisteredSchemas>[0]
): PlatformSchema[] {
  return listRegisteredSchemas(filter);
}

export {
  assertSchemaRegistered,
  resetSchemaRegistryForTests,
  SchemaRegistry,
};
