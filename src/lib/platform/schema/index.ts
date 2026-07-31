export {
  SchemaService,
  resetSchemaFrameworkForTests,
} from "@/lib/platform/schema/service";
export type { SchemaServiceApi } from "@/lib/platform/schema/service";

export {
  SchemaRegistry,
  registerSchema,
  unregisterSchema,
  getSchema,
  listSchemas,
  assertSchemaRegistered,
  resetSchemaRegistryForTests,
} from "@/lib/platform/schema/public-registry";

export { normalizePlatformSchema, validateSchemaDefinition } from "@/lib/platform/schema/schema";
export { validatePlatformSchema } from "@/lib/platform/schema/validation";
export {
  resolveSchema,
  getExtensionChain,
  validateExtensionHierarchy,
} from "@/lib/platform/schema/extensions";
export {
  reflectSchema,
  reflectFields,
  reflectRelationships,
  reflectForms,
  reflectWorkflows,
  reflectPermissions,
  reflectIndexes,
  reflectReports,
  reflectByEntityType,
  listReflectableSchemas,
} from "@/lib/platform/schema/reflection";
export {
  generateSchemaDocumentation,
  generateAllSchemaDocumentation,
} from "@/lib/platform/schema/documentation";
export {
  projectToEntityType,
  projectToFormDefinitions,
  syncSchemaToFrameworks,
  schemaIntelligenceSurface,
} from "@/lib/platform/schema/integrations";
export type { SchemaSyncResult } from "@/lib/platform/schema/integrations";

export type {
  PlatformSchema,
  ResolvedPlatformSchema,
  SchemaDocumentation,
  SchemaExtensionLayer,
  SchemaFieldConstraint,
  SchemaFieldDefinition,
  SchemaFieldType,
  SchemaFormRef,
  SchemaIndexDefinition,
  SchemaIntelligenceHints,
  SchemaPermissionRule,
  SchemaReflection,
  SchemaRegisterOptions,
  SchemaRelationshipCardinality,
  SchemaRelationshipDefinition,
  SchemaReportDefinition,
  SchemaValidationIssue,
  SchemaValidationResult,
  SchemaWorkflowRef,
} from "@/lib/platform/schema/types";
