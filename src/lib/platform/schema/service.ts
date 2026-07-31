import {
  generateAllSchemaDocumentation,
  generateSchemaDocumentation,
} from "@/lib/platform/schema/documentation";
import {
  getExtensionChain,
  resolveSchema,
  validateExtensionHierarchy,
} from "@/lib/platform/schema/extensions";
import {
  projectToEntityType,
  projectToFormDefinitions,
  schemaIntelligenceSurface,
  syncSchemaToFrameworks,
} from "@/lib/platform/schema/integrations";
import {
  getSchemaField,
  listIndexedFields,
  listPermissionActions,
  listReports,
  listSchemaFieldKeys,
  listSearchableFields,
  schemaSummary,
} from "@/lib/platform/schema/metadata";
import {
  assertSchemaRegistered,
  getRegisteredSchema,
  listRegisteredSchemas,
  putSchema,
  removeSchema,
  resetSchemaRegistryForTests,
  SchemaRegistry,
} from "@/lib/platform/schema/registry";
import {
  assertReflectable,
  listReflectableSchemas,
  reflectByEntityType,
  reflectFields,
  reflectForms,
  reflectIndexes,
  reflectPermissions,
  reflectRelationships,
  reflectReports,
  reflectSchema,
  reflectWorkflows,
} from "@/lib/platform/schema/reflection";
import {
  assertRelationshipDefined,
  buildRelationshipGraph,
  findRelationshipCycles,
  getRelationshipsForEntityType,
  listSchemaRelationships,
} from "@/lib/platform/schema/relationships";
import {
  normalizePlatformSchema,
  validateSchemaDefinition,
} from "@/lib/platform/schema/schema";
import type {
  PlatformSchema,
  SchemaRegisterOptions,
  SchemaValidationResult,
} from "@/lib/platform/schema/types";
import { validatePlatformSchema } from "@/lib/platform/schema/validation";

export function resetSchemaFrameworkForTests(): void {
  resetSchemaRegistryForTests();
}

/**
 * Universal Schema Registry service.
 * Applications register schemas once; platform reflects and projects metadata.
 * Platform ships with zero schemas.
 */
export const SchemaService = {
  registry: SchemaRegistry,

  /**
   * Register an application/org schema.
   * Optionally syncs Entity + Forms frameworks from schema metadata.
   */
  register(
    definition: PlatformSchema,
    options?: SchemaRegisterOptions
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

    const stored = putSchema(normalized);

    if (options?.syncFrameworks) {
      syncSchemaToFrameworks(stored.id);
    }

    return stored;
  },

  unregister(schemaId: string): boolean {
    return removeSchema(schemaId);
  },

  get(schemaId: string): PlatformSchema | null {
    return getRegisteredSchema(schemaId);
  },

  list: listRegisteredSchemas,
  assertRegistered: assertSchemaRegistered,

  validate: validatePlatformSchema,
  validateDefinition: validateSchemaDefinition,
  normalize: normalizePlatformSchema,

  resolve: resolveSchema,
  extensionChain: getExtensionChain,
  validateExtension: validateExtensionHierarchy,

  reflect: reflectSchema,
  reflectFields,
  reflectRelationships,
  reflectForms,
  reflectWorkflows,
  reflectPermissions,
  reflectIndexes,
  reflectReports,
  reflectByEntityType,
  listReflectable: listReflectableSchemas,
  assertReflectable,

  // Metadata helpers
  fieldKeys: listSchemaFieldKeys,
  getField: getSchemaField,
  searchableFields: listSearchableFields,
  indexes: listIndexedFields,
  permissions: listPermissionActions,
  reports: listReports,
  summary: schemaSummary,

  // Relationships
  relationships: listSchemaRelationships,
  relationshipsForEntityType: getRelationshipsForEntityType,
  relationshipGraph: buildRelationshipGraph,
  relationshipCycles: findRelationshipCycles,
  assertRelationship: assertRelationshipDefined,

  // Documentation (derived)
  document: generateSchemaDocumentation,
  documentAll: generateAllSchemaDocumentation,

  // Framework projection
  projectEntity: projectToEntityType,
  projectForms: projectToFormDefinitions,
  syncFrameworks: syncSchemaToFrameworks,
  intelligenceSurface: schemaIntelligenceSurface,

  /** Convenience: validate without throwing. */
  tryValidate(definition: PlatformSchema): SchemaValidationResult {
    return validatePlatformSchema(normalizePlatformSchema(definition));
  },

  resetForTests: resetSchemaFrameworkForTests,
} as const;

export type SchemaServiceApi = typeof SchemaService;
