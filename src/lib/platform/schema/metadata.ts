import type {
  PlatformSchema,
  SchemaFieldDefinition,
  SchemaIndexDefinition,
  SchemaPermissionRule,
  SchemaReportDefinition,
} from "@/lib/platform/schema/types";

export function listSchemaFieldKeys(schema: PlatformSchema): string[] {
  return schema.fields.map((f) => f.key);
}

export function getSchemaField(
  schema: PlatformSchema,
  key: string
): SchemaFieldDefinition | null {
  return schema.fields.find((f) => f.key === key) ?? null;
}

export function listSearchableFields(
  schema: PlatformSchema
): SchemaFieldDefinition[] {
  const hinted = new Set(schema.intelligence?.searchableFields ?? []);
  return schema.fields.filter(
    (f) => f.searchable || f.indexed || hinted.has(f.key)
  );
}

export function listIndexedFields(
  schema: PlatformSchema
): SchemaIndexDefinition[] {
  return schema.indexes;
}

export function listPermissionActions(
  schema: PlatformSchema
): SchemaPermissionRule[] {
  return schema.permissions;
}

export function listReports(schema: PlatformSchema): SchemaReportDefinition[] {
  return schema.reports;
}

export function schemaSummary(schema: PlatformSchema): {
  id: string;
  entityType: string;
  version: string;
  fieldCount: number;
  relationshipCount: number;
  formCount: number;
  workflowCount: number;
} {
  return {
    id: schema.id,
    entityType: schema.entityType,
    version: schema.version,
    fieldCount: schema.fields.length,
    relationshipCount: schema.relationships.length,
    formCount: schema.forms.length,
    workflowCount: schema.workflows.length,
  };
}
