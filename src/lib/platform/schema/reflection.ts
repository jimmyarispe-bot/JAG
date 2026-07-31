import { resolveSchema } from "@/lib/platform/schema/extensions";
import {
  assertSchemaRegistered,
  getRegisteredSchema,
  listRegisteredSchemas,
} from "@/lib/platform/schema/registry";
import type {
  PlatformSchema,
  SchemaFieldDefinition,
  SchemaFormRef,
  SchemaIndexDefinition,
  SchemaPermissionRule,
  SchemaReflection,
  SchemaRelationshipDefinition,
  SchemaReportDefinition,
  SchemaWorkflowRef,
} from "@/lib/platform/schema/types";

/**
 * Reflect resolved metadata for a schema — answers platform questions
 * without application code.
 */
export function reflectSchema(schemaId: string): SchemaReflection {
  const resolved = resolveSchema(schemaId);
  return {
    schemaId: resolved.id,
    entityType: resolved.entityType,
    version: resolved.version,
    layer: resolved.layer,
    fields: resolved.fields,
    relationships: resolved.relationships,
    forms: resolved.forms,
    workflows: resolved.workflows,
    permissions: resolved.permissions,
    indexes: resolved.indexes,
    reports: resolved.reports,
    capabilities: resolved.capabilities ?? [],
    intelligence: resolved.intelligence ?? {},
    ancestors: resolved.ancestors,
  };
}

export function reflectFields(schemaId: string): SchemaFieldDefinition[] {
  return reflectSchema(schemaId).fields;
}

export function reflectRelationships(
  schemaId: string
): SchemaRelationshipDefinition[] {
  return reflectSchema(schemaId).relationships;
}

export function reflectForms(schemaId: string): SchemaFormRef[] {
  return reflectSchema(schemaId).forms;
}

export function reflectWorkflows(schemaId: string): SchemaWorkflowRef[] {
  return reflectSchema(schemaId).workflows;
}

export function reflectPermissions(
  schemaId: string
): SchemaPermissionRule[] {
  return reflectSchema(schemaId).permissions;
}

export function reflectIndexes(schemaId: string): SchemaIndexDefinition[] {
  return reflectSchema(schemaId).indexes;
}

export function reflectReports(schemaId: string): SchemaReportDefinition[] {
  return reflectSchema(schemaId).reports;
}

export function reflectByEntityType(
  entityType: string,
  options?: {
    applicationId?: string | null;
    organizationId?: string | null;
  }
): SchemaReflection | null {
  const schemas = listRegisteredSchemas({ entityType });
  if (!schemas.length) return null;

  // Prefer organization → application → base for the given scope
  const orgMatch = options?.organizationId
    ? schemas.find(
        (s) =>
          s.layer === "organization" &&
          s.organizationId === options.organizationId
      )
    : null;
  if (orgMatch) return reflectSchema(orgMatch.id);

  const appMatch = options?.applicationId
    ? schemas.find(
        (s) =>
          s.layer === "application" &&
          s.applicationId === options.applicationId
      )
    : null;
  if (appMatch) return reflectSchema(appMatch.id);

  const base = schemas.find((s) => s.layer === "base") ?? schemas[0];
  return base ? reflectSchema(base.id) : null;
}

export function listReflectableSchemas(): Array<{
  id: string;
  entityType: string;
  layer: PlatformSchema["layer"];
  version: string;
}> {
  return listRegisteredSchemas().map((s) => ({
    id: s.id,
    entityType: s.entityType,
    layer: s.layer,
    version: s.version,
  }));
}

export function assertReflectable(schemaId: string): SchemaReflection {
  assertSchemaRegistered(schemaId);
  return reflectSchema(schemaId);
}

export function getSchemaOrNull(schemaId: string): PlatformSchema | null {
  return getRegisteredSchema(schemaId);
}
